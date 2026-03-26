import test from "node:test";
import assert from "node:assert/strict";
import {
  assertLanguageSupportedForIdl,
  getAllLanguageCompatibility,
  getUnsupportedNodeKinds,
} from "../lib/codama-compat";
import { MINIMAL_CODAMA_ROOT } from "./fixtures/minimal-codama-root";
import { MINIMAL_CODAMA_ROOT_WITH_ZEROABLE_OPTION } from "./fixtures/minimal-codama-root-with-zeroable-option";

test("all generators are supported for a minimal Codama root", () => {
  const compatibility = getAllLanguageCompatibility({
    ...MINIMAL_CODAMA_ROOT,
  });

  assert.equal(compatibility.typescript.supported, true);
  assert.equal(compatibility["typescript-umi"].supported, true);
  assert.equal(compatibility.rust.supported, true);
  assert.equal(compatibility.go.supported, true);
});

test("detects zeroableOptionTypeNode as unsupported for non-kit renderers", () => {
  const idl = { ...MINIMAL_CODAMA_ROOT_WITH_ZEROABLE_OPTION };

  assert.deepEqual(getUnsupportedNodeKinds(idl, "typescript"), []);
  assert.deepEqual(getUnsupportedNodeKinds(idl, "typescript-umi"), [
    "zeroableOptionTypeNode",
  ]);
  assert.deepEqual(getUnsupportedNodeKinds(idl, "rust"), [
    "zeroableOptionTypeNode",
  ]);
  assert.deepEqual(getUnsupportedNodeKinds(idl, "go"), [
    "zeroableOptionTypeNode",
  ]);
});

test("throws a clear compatibility error for unsupported renderers", () => {
  assert.throws(
    () =>
      assertLanguageSupportedForIdl(
        { ...MINIMAL_CODAMA_ROOT_WITH_ZEROABLE_OPTION },
        "go"
      ),
    /Go does not support this IDL yet because it contains unsupported Codama node kind: zeroableOptionTypeNode/
  );
});
