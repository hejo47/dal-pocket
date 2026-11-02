import assert from "node:assert/strict";
import test from "node:test";

import { createDemoData, todayInSeoul } from "../src/lib/pocket.ts";

const base = process.env.POCKET_TEST_BASE_URL;

test("Prisma API: 기록 저장·수정·삭제, 예산, 충돌 검사와 브라우저별 분리", { skip: !base }, async () => {
  assert.ok(base);
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "통합 검증에는 로컬 테스트 서버를 사용하세요.");
  const origin = new URL(base).origin;
  const endpoint = `${origin}/api/pocket`;
  const first = await fetch(endpoint);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { data: null, revision: 0 });
  const cookie = first.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);
  assert.match(first.headers.get("set-cookie") ?? "", /httponly/i);
  const write = (data: unknown, revision: number, requestOrigin = origin) => fetch(endpoint, { method: "PUT", headers: { Cookie: cookie, Origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify({ data, revision }) });
  const data = {
    ...createDemoData(todayInSeoul()), isDemo: false, budgets: { weekly: 180000, monthly: 600000 }, weekStartsOn: 0,
    expenses: [{ id: "api-integration-expense", date: todayInSeoul(), category: "식비", amount: 9000, memo: "통합 검증용 점심" }],
  };
  const saved = await write(data, 0);
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), { data, revision: 1 });
  const read = await fetch(endpoint, { headers: { Cookie: cookie } });
  assert.deepEqual(await read.json(), { data, revision: 1 });
  const otherBrowser = await fetch(endpoint);
  assert.deepEqual(await otherBrowser.json(), { data: null, revision: 0 });
  assert.equal((await write(data, 0)).status, 409);
  assert.equal((await write({ ...data, budgets: { weekly: -1, monthly: 600000 } }, 1)).status, 400);
  assert.equal((await write(data, 1, "https://other.example")).status, 403);
  const updated = { ...data, expenses: [{ ...data.expenses[0], amount: 12500, memo: "수정된 점심" }] };
  assert.equal((await write(updated, 1)).status, 200);
  assert.deepEqual(await (await fetch(endpoint, { headers: { Cookie: cookie } })).json(), { data: updated, revision: 2 });
  const deleted = { ...updated, expenses: [] };
  assert.equal((await write(deleted, 2)).status, 200);
  assert.deepEqual(await (await fetch(endpoint, { headers: { Cookie: cookie } })).json(), { data: deleted, revision: 3 });
});
