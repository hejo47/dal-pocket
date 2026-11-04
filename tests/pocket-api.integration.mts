import assert from "node:assert/strict";
import test from "node:test";
import { POCKET_ACCOUNT_HEADER } from "../src/lib/pocket-api.ts";

const base = process.env.POCKET_TEST_BASE_URL;

test("익명 요청은 기록을 읽거나 저장하거나 계정에 합칠 수 없다", { skip: !base }, async () => {
  assert.ok(base);
  const url = new URL(base);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "통합 검증에는 로컬 테스트 서버를 사용하세요.");
  const endpoint = new URL("/api/pocket", url);
  const headers = {
    Cookie: `dal-pocket-session=${"a".repeat(64)}`,
    [POCKET_ACCOUNT_HEADER]: "11111111-1111-4111-8111-111111111111",
  };
  const read = await fetch(endpoint, { headers });
  assert.equal(read.status, 401);
  assert.match(read.headers.get("cache-control") ?? "", /no-store/);
  assert.deepEqual(await read.json(), { code: "SESSION_REQUIRED" });
  const write = await fetch(endpoint, {
    method: "PUT", headers: { ...headers, Origin: url.origin, "Content-Type": "application/json" }, body: "{}",
  });
  assert.equal(write.status, 401);
  const claim = await fetch(new URL("/api/pocket/claim", url), { method: "POST", headers });
  assert.equal(claim.status, 410);
});
