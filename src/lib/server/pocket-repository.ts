import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { PocketPacket, PocketWrite } from "@/lib/pocket-api";
import { isPocketData } from "@/lib/pocket";
import { getPrisma } from "@/lib/server/prisma";

type StoredPocket = Prisma.PocketGetPayload<{ include: { expenses: true } }>;

export class PocketConflict extends Error {}

function toPacket(pocket: StoredPocket | null): PocketPacket {
  if (!pocket) return { data: null, revision: 0 };
  const data = {
    version: 1, mode: pocket.mode, budgets: { weekly: pocket.weeklyBudget, monthly: pocket.monthlyBudget },
    weekStartsOn: pocket.weekStartsOn, isDemo: false,
    fonts: { body: pocket.bodyFont, numbers: pocket.numberFont, title: pocket.titleFont, chosen: pocket.fontsChosen },
    expenses: pocket.expenses.sort((a, b) => a.position - b.position).map(({ id, amount, category, date, memo }) => ({ id, amount, category, date: date.toISOString().slice(0, 10), memo })),
  };
  if (!isPocketData(data)) throw new Error("INVALID_STORED_DATA");
  return { data, revision: pocket.revision };
}

export async function readPocket(ownerId: string) {
  return toPacket(await getPrisma().pocket.findUnique({ where: { id: ownerId }, include: { expenses: true } }));
}

export async function writePocket(ownerId: string, { data, revision }: PocketWrite) {
  const db = getPrisma();
  return db.$transaction(async (tx) => {
    // Creating the owner once also serializes simultaneous first writes.
    await tx.pocket.upsert({ where: { id: ownerId }, create: { id: ownerId }, update: {} });
    const changed = await tx.pocket.updateMany({ where: { id: ownerId, revision }, data: {
      revision: { increment: 1 }, mode: data.mode, weeklyBudget: data.budgets.weekly,
      monthlyBudget: data.budgets.monthly, weekStartsOn: data.weekStartsOn,
      bodyFont: data.fonts.body, numberFont: data.fonts.numbers, titleFont: data.fonts.title, fontsChosen: data.fonts.chosen,
    } });
    if (changed.count !== 1) throw new PocketConflict("REVISION_CONFLICT");
    await tx.expense.deleteMany({ where: { pocketId: ownerId } });
    if (data.expenses.length) await tx.expense.createMany({ data: data.expenses.map((expense, position) => ({ ...expense, pocketId: ownerId, date: new Date(`${expense.date}T00:00:00Z`), position })) });
    return { data, revision: revision + 1 };
  });
}
