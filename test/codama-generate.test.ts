import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { generateFromIdl } from "../lib/codama-generate";
import { MINIMAL_SOLANA_IDL } from "./fixtures/minimal-anchor-idl";
import { MINIMAL_CODAMA_ROOT } from "./fixtures/minimal-codama-root";

test("generateFromIdl produces a zip with a generated TypeScript package", async () => {
  const buffer = await generateFromIdl({ ...MINIMAL_SOLANA_IDL }, "typescript");

  const zip = await JSZip.loadAsync(buffer);
  const fileNames = Object.keys(zip.files);

  assert(fileNames.includes("package.json"));
  assert(fileNames.includes("src/generated/index.ts"));
  assert(fileNames.some((fileName) => fileName.startsWith("src/generated/")));

  const packageJson = JSON.parse(await zip.file("package.json")!.async("text"));
  assert.equal(typeof packageJson.name, "string");
  assert.equal(typeof packageJson.dependencies, "object");
});

test("generateFromIdl accepts a Codama root node", async () => {
  const buffer = await generateFromIdl(
    { ...MINIMAL_CODAMA_ROOT },
    "typescript"
  );

  const zip = await JSZip.loadAsync(buffer);
  const fileNames = Object.keys(zip.files);

  assert(fileNames.includes("package.json"));
  assert(fileNames.includes("src/generated/index.ts"));
});
