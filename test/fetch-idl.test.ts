import test from "node:test";
import assert from "node:assert/strict";
import { deflate } from "pako";
import {
  decodeIdlAccountData,
  fetchIdlWithDeps,
  type FetchIdlDeps,
} from "../lib/fetch-idl";
import type { IdlSource } from "../lib/idl-source";

const PROGRAM_ID = "11111111111111111111111111111111";

function encodeAnchorIdlAccountData(idl: unknown): Uint8Array {
  const compressed = deflate(JSON.stringify(idl));
  const raw = new Uint8Array(8 + 32 + 4 + compressed.length);
  const view = new DataView(raw.buffer);

  view.setUint32(40, compressed.length, true);
  raw.set(compressed, 44);

  return raw;
}

function createFetchIdlDeps(input: {
  anchorData?: Uint8Array;
  anchorError?: Error;
  anchorUpdatedAt?: number | null;
  programMetadataError?: Error;
  programMetadataIdl?: unknown;
  programMetadataUpdatedAt?: number | null;
}) {
  const calls: IdlSource[] = [];

  return {
    calls,
    deps: {
      createRpc: (() => ({})) as unknown as FetchIdlDeps["createRpc"],
      fetchAnchorIdlAccount: async () => {
        calls.push("anchor");
        if (input.anchorError) throw input.anchorError;
        if (!input.anchorData) throw new Error("Missing anchor test data");
        return {
          accountAddress: "Anchor111111111111111111111111111111111",
          data: input.anchorData,
        };
      },
      fetchProgramMetadataIdl: async () => {
        calls.push("program-metadata");
        if (input.programMetadataError) throw input.programMetadataError;
        if (input.programMetadataIdl === undefined) {
          throw new Error("Missing program metadata test data");
        }
        return {
          accountAddress: "Meta11111111111111111111111111111111111",
          idl: input.programMetadataIdl,
        };
      },
      getLatestUpdateTimestamp: async (
        _rpc: unknown,
        accountAddress: string
      ) => {
        if (accountAddress.startsWith("Anchor")) {
          return input.anchorUpdatedAt ?? null;
        }

        return input.programMetadataUpdatedAt ?? null;
      },
    },
  };
}

test("decodeIdlAccountData inflates and parses compatible Solana IDL account data", () => {
  const idl = {
    accounts: [],
    address: PROGRAM_ID,
    instructions: [],
    metadata: { name: "counter", spec: "0.1.0", version: "0.1.0" },
    types: [],
  };

  assert.deepEqual(decodeIdlAccountData(encodeAnchorIdlAccountData(idl)), idl);
});

test("decodeIdlAccountData rejects account data that is too short", () => {
  assert.throws(
    () => decodeIdlAccountData(new Uint8Array(10)),
    /too short to be valid/i
  );
});

test("fetchIdlWithDeps uses the Anchor path when idlSource=anchor", async () => {
  const anchorIdl = { metadata: { name: "anchor" } };
  const { calls, deps } = createFetchIdlDeps({
    anchorData: encodeAnchorIdlAccountData(anchorIdl),
  });

  const idl = await fetchIdlWithDeps(PROGRAM_ID, undefined, "anchor", deps);

  assert.deepEqual(idl, anchorIdl);
  assert.deepEqual(calls, ["anchor"]);
});

test("fetchIdlWithDeps uses the program metadata path when idlSource=program-metadata", async () => {
  const programMetadataIdl = { metadata: { name: "pmp" } };
  const { calls, deps } = createFetchIdlDeps({
    programMetadataIdl,
  });

  const idl = await fetchIdlWithDeps(
    PROGRAM_ID,
    undefined,
    "program-metadata",
    deps
  );

  assert.deepEqual(idl, programMetadataIdl);
  assert.deepEqual(calls, ["program-metadata"]);
});

test("fetchIdlWithDeps parses JSON-string program metadata IDLs", async () => {
  const programMetadataIdl = JSON.stringify({
    metadata: { name: "pmp-json" },
    instructions: [],
  });
  const { deps } = createFetchIdlDeps({
    programMetadataIdl,
  });

  const idl = await fetchIdlWithDeps(
    PROGRAM_ID,
    undefined,
    "program-metadata",
    deps
  );

  assert.deepEqual(idl, {
    metadata: { name: "pmp-json" },
    instructions: [],
  });
});

test("fetchIdlWithDeps leaves non-JSON program metadata strings unchanged", async () => {
  const programMetadataIdl = "plain-text-idl";
  const { deps } = createFetchIdlDeps({
    programMetadataIdl,
  });

  const idl = await fetchIdlWithDeps(
    PROGRAM_ID,
    undefined,
    "program-metadata",
    deps
  );

  assert.equal(idl, programMetadataIdl);
});

test("fetchIdlWithDeps prefers the newer source in auto mode", async () => {
  const anchorIdl = { metadata: { name: "anchor" } };
  const programMetadataIdl = { metadata: { name: "pmp" } };
  const { deps } = createFetchIdlDeps({
    anchorData: encodeAnchorIdlAccountData(anchorIdl),
    anchorUpdatedAt: 100,
    programMetadataIdl,
    programMetadataUpdatedAt: 200,
  });

  const idl = await fetchIdlWithDeps(PROGRAM_ID, undefined, "auto", deps);

  assert.deepEqual(idl, programMetadataIdl);
});

test("fetchIdlWithDeps prefers program metadata on timestamp ties in auto mode", async () => {
  const anchorIdl = { metadata: { name: "anchor" } };
  const programMetadataIdl = { metadata: { name: "pmp" } };
  const { deps } = createFetchIdlDeps({
    anchorData: encodeAnchorIdlAccountData(anchorIdl),
    anchorUpdatedAt: 100,
    programMetadataIdl,
    programMetadataUpdatedAt: 100,
  });

  const idl = await fetchIdlWithDeps(PROGRAM_ID, undefined, "auto", deps);

  assert.deepEqual(idl, programMetadataIdl);
});

test("fetchIdlWithDeps falls back to Anchor when program metadata is missing in auto mode", async () => {
  const anchorIdl = { metadata: { name: "anchor" } };
  const { deps } = createFetchIdlDeps({
    anchorData: encodeAnchorIdlAccountData(anchorIdl),
    anchorUpdatedAt: 100,
    programMetadataError: new Error(
      "No compatible on-chain IDL was found for this program."
    ),
  });

  const idl = await fetchIdlWithDeps(PROGRAM_ID, undefined, "auto", deps);

  assert.deepEqual(idl, anchorIdl);
});

test("fetchIdlWithDeps propagates a real error when auto mode has no usable IDL", async () => {
  const { deps } = createFetchIdlDeps({
    anchorError: new Error(
      "No compatible on-chain IDL was found for this program."
    ),
    programMetadataError: new Error(
      "Program metadata account exists but could not be parsed."
    ),
  });

  await assert.rejects(
    () => fetchIdlWithDeps(PROGRAM_ID, undefined, "auto", deps),
    /could not be parsed/i
  );
});

test("fetchIdlWithDeps returns the generic not-found error when neither source exists in auto mode", async () => {
  const { deps } = createFetchIdlDeps({
    anchorError: new Error(
      "No compatible on-chain IDL was found for this program."
    ),
    programMetadataError: new Error(
      "No compatible on-chain IDL was found for this program."
    ),
  });

  await assert.rejects(
    () => fetchIdlWithDeps(PROGRAM_ID, undefined, "auto", deps),
    /no compatible on-chain idl was found/i
  );
});
