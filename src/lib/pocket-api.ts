import { isPocketData, todayInSeoul } from "./pocket.ts";
import type { PocketData } from "./pocket.ts";

export const MAX_EXPENSES = 10000;
export const MAX_BODY_BYTES = 2_000_000;
export type PocketPacket = { data: PocketData | null; revision: number };
export type PocketWrite = { data: PocketData; revision: number };

export function isPocketWrite(value: unknown, today = todayInSeoul()): value is PocketWrite {
  if (!value || typeof value !== "object") return false;
  const write = value as PocketWrite;
  return Number.isSafeInteger(write.revision) && write.revision >= 0 && isPocketData(write.data)
    && !write.data.isDemo && write.data.expenses.length <= MAX_EXPENSES
    && write.data.expenses.every((expense) => expense.id.length > 0 && expense.id.length <= 100 && expense.date <= today);
}

export function isSameOriginWrite(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin
    && request.headers.get("content-type")?.split(";", 1)[0].trim() === "application/json";
}
