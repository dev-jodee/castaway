import test from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../lib/rate-limit";

test("rateLimit allows requests until the endpoint budget is exhausted", () => {
  const ip = `test-generate-${Date.now()}`;

  for (let i = 0; i < 10; i += 1) {
    const result = rateLimit(ip, "generate");
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 9 - i);
  }

  const blocked = rateLimit(ip, "generate");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});
