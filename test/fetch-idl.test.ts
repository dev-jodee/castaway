import test from "node:test";
import assert from "node:assert/strict";
import { deflate } from "pako";
import { decodeIdlAccountData } from "../lib/fetch-idl";

test("decodeIdlAccountData inflates and parses compatible Solana IDL account data", () => {
  const idl = {
    address: "11111111111111111111111111111111",
    metadata: { name: "counter", version: "0.1.0", spec: "0.1.0" },
    instructions: [],
    accounts: [],
    types: [],
  };

  const compressed = deflate(JSON.stringify(idl));
  const raw = new Uint8Array(8 + 32 + 4 + compressed.length);
  const view = new DataView(raw.buffer);

  view.setUint32(40, compressed.length, true);
  raw.set(compressed, 44);

  assert.deepEqual(decodeIdlAccountData(raw), idl);
});

test("decodeIdlAccountData rejects account data that is too short", () => {
  assert.throws(
    () => decodeIdlAccountData(new Uint8Array(10)),
    /too short to be valid/i
  );
});
