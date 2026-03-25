import test from "node:test";
import assert from "node:assert/strict";
import {
  getIdlSourceFromSearchParams,
  isIdlSource,
  normalizeIdlSource,
} from "../lib/idl-source";

test("isIdlSource accepts supported values", () => {
  assert.equal(isIdlSource("auto"), true);
  assert.equal(isIdlSource("anchor"), true);
  assert.equal(isIdlSource("program-metadata"), true);
  assert.equal(isIdlSource("invalid"), false);
});

test("normalizeIdlSource falls back to auto for invalid values", () => {
  assert.equal(normalizeIdlSource("anchor"), "anchor");
  assert.equal(normalizeIdlSource("invalid"), "auto");
  assert.equal(normalizeIdlSource(null), "auto");
});

test("getIdlSourceFromSearchParams reads and normalizes idlSource from the URL", () => {
  assert.equal(
    getIdlSourceFromSearchParams(
      new URLSearchParams("program=abc&idlSource=program-metadata")
    ),
    "program-metadata"
  );
  assert.equal(
    getIdlSourceFromSearchParams(
      new URLSearchParams("program=abc&idlSource=invalid")
    ),
    "auto"
  );
  assert.equal(
    getIdlSourceFromSearchParams(new URLSearchParams("program=abc")),
    "auto"
  );
});
