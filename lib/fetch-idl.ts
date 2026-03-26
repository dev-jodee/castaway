import {
  address,
  createAddressWithSeed,
  createSolanaRpc,
  fetchEncodedAccount,
  getProgramDerivedAddress,
} from "@solana/kit";
import {
  fetchAndParseMetadataContent,
  findMetadataPda,
} from "@solana-program/program-metadata";
import { inflate } from "pako";
import type { ExplicitIdlSource, IdlSource } from "./idl-source";

export const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

const NO_COMPATIBLE_IDL_MESSAGE =
  "No compatible on-chain IDL was found for this program. The IDL may not have been uploaded, or the program may use an unsupported IDL layout.";

class MissingIdlError extends Error {
  readonly source: ExplicitIdlSource;

  constructor(source: ExplicitIdlSource) {
    super(NO_COMPATIBLE_IDL_MESSAGE);
    this.name = "MissingIdlError";
    this.source = source;
  }
}

type SolanaRpc = ReturnType<typeof createSolanaRpc>;

type AnchorIdlAccount = {
  accountAddress: string;
  data: Uint8Array;
};

type ProgramMetadataIdl = {
  accountAddress: string;
  idl: unknown;
};

export type FetchIdlDeps = {
  createRpc: (rpcUrl: string) => SolanaRpc;
  fetchAnchorIdlAccount: (
    rpc: SolanaRpc,
    programId: string
  ) => Promise<AnchorIdlAccount>;
  fetchProgramMetadataIdl: (
    rpc: SolanaRpc,
    programId: string
  ) => Promise<ProgramMetadataIdl>;
  getLatestUpdateTimestamp: (
    rpc: SolanaRpc,
    accountAddress: string
  ) => Promise<number | null>;
};

type SuccessfulCandidate = {
  accountAddress: string;
  idl: unknown;
  source: ExplicitIdlSource;
  updatedAt: number | null;
};

type FailedCandidate = {
  error: Error;
  source: ExplicitIdlSource;
};

type IdlCandidate = SuccessfulCandidate | FailedCandidate;

// Anchor stores IDLs at: createWithSeed(findProgramAddress([], programId), "anchor:idl", programId)
async function getAnchorIdlAddress(programId: string): Promise<string> {
  const programAddress = address(programId);
  const [base] = await getProgramDerivedAddress({
    programAddress,
    seeds: [],
  });

  return createAddressWithSeed({
    baseAddress: base,
    programAddress,
    seed: "anchor:idl",
  });
}

async function getProgramMetadataIdlAddress(
  programId: string
): Promise<string> {
  const [metadataAddress] = await findMetadataPda({
    authority: null,
    program: address(programId),
    seed: "idl",
  });

  return metadataAddress;
}

// IDL account layout (after 8-byte discriminator):
//   32 bytes: authority (Pubkey)
//    4 bytes: data_len (u32 LE)
//   N bytes:  zlib-compressed IDL JSON
export function decodeIdlAccountData(raw: Uint8Array): unknown {
  const DISCRIMINATOR_LEN = 8;
  const AUTHORITY_LEN = 32;
  const DATA_LEN_OFFSET = DISCRIMINATOR_LEN + AUTHORITY_LEN; // 40
  const DATA_OFFSET = DATA_LEN_OFFSET + 4; // 44

  if (raw.length < DATA_OFFSET) {
    throw new Error("IDL account data is too short to be valid.");
  }

  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const dataLen = view.getUint32(DATA_LEN_OFFSET, true);
  const compressed = raw.slice(DATA_OFFSET, DATA_OFFSET + dataLen);
  const inflated = inflate(compressed);
  return JSON.parse(new TextDecoder().decode(inflated));
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function normalizeProgramMetadataIdl(idl: unknown): unknown {
  if (typeof idl !== "string") {
    return idl;
  }

  const trimmed = idl.trim();
  if (
    !(trimmed.startsWith("{") && trimmed.endsWith("}")) &&
    !(trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return idl;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return idl;
  }
}

function isMissingIdlError(error: Error): boolean {
  return (
    error instanceof MissingIdlError ||
    error.message === NO_COMPATIBLE_IDL_MESSAGE
  );
}

function isSuccessfulCandidate(
  candidate: IdlCandidate
): candidate is SuccessfulCandidate {
  return "idl" in candidate;
}

function pickAutoCandidate(
  anchorCandidate: SuccessfulCandidate,
  programMetadataCandidate: SuccessfulCandidate
): SuccessfulCandidate {
  const anchorTimestamp = anchorCandidate.updatedAt ?? Number.NEGATIVE_INFINITY;
  const programMetadataTimestamp =
    programMetadataCandidate.updatedAt ?? Number.NEGATIVE_INFINITY;

  if (programMetadataTimestamp >= anchorTimestamp) {
    return programMetadataCandidate;
  }

  return anchorCandidate;
}

async function defaultFetchAnchorIdlAccount(
  rpc: SolanaRpc,
  programId: string
): Promise<AnchorIdlAccount> {
  const accountAddress = await getAnchorIdlAddress(programId);
  const account = await fetchEncodedAccount(rpc, address(accountAddress));

  if (!account.exists) {
    throw new MissingIdlError("anchor");
  }

  return {
    accountAddress,
    data: account.data,
  };
}

async function defaultFetchProgramMetadataIdl(
  rpc: SolanaRpc,
  programId: string
): Promise<ProgramMetadataIdl> {
  const accountAddress = await getProgramMetadataIdlAddress(programId);
  const metadataAccount = await fetchEncodedAccount(
    rpc,
    address(accountAddress)
  );

  if (!metadataAccount.exists) {
    throw new MissingIdlError("program-metadata");
  }

  return {
    accountAddress,
    idl: normalizeProgramMetadataIdl(
      await fetchAndParseMetadataContent(rpc, address(programId), "idl")
    ),
  };
}

async function defaultGetLatestUpdateTimestamp(
  rpc: SolanaRpc,
  accountAddress: string
): Promise<number | null> {
  const signatures = await rpc
    .getSignaturesForAddress(address(accountAddress), { limit: 1 })
    .send();

  const latest = signatures[0];
  return latest?.blockTime == null ? null : Number(latest.blockTime);
}

function getFetchIdlDeps(overrides: Partial<FetchIdlDeps> = {}): FetchIdlDeps {
  return {
    createRpc: createSolanaRpc,
    fetchAnchorIdlAccount: defaultFetchAnchorIdlAccount,
    fetchProgramMetadataIdl: defaultFetchProgramMetadataIdl,
    getLatestUpdateTimestamp: defaultGetLatestUpdateTimestamp,
    ...overrides,
  };
}

async function loadAnchorCandidate(
  rpc: SolanaRpc,
  programId: string,
  deps: FetchIdlDeps
): Promise<IdlCandidate> {
  try {
    const account = await deps.fetchAnchorIdlAccount(rpc, programId);
    const [updatedAt, idl] = await Promise.all([
      deps.getLatestUpdateTimestamp(rpc, account.accountAddress),
      Promise.resolve(decodeIdlAccountData(account.data)),
    ]);

    return {
      accountAddress: account.accountAddress,
      idl,
      source: "anchor",
      updatedAt,
    };
  } catch (error) {
    return { error: asError(error), source: "anchor" };
  }
}

async function loadProgramMetadataCandidate(
  rpc: SolanaRpc,
  programId: string,
  deps: FetchIdlDeps
): Promise<IdlCandidate> {
  try {
    const result = await deps.fetchProgramMetadataIdl(rpc, programId);
    const updatedAt = await deps.getLatestUpdateTimestamp(
      rpc,
      result.accountAddress
    );

    return {
      accountAddress: result.accountAddress,
      idl: normalizeProgramMetadataIdl(result.idl),
      source: "program-metadata",
      updatedAt,
    };
  } catch (error) {
    return { error: asError(error), source: "program-metadata" };
  }
}

async function fetchFromExplicitSource(
  rpc: SolanaRpc,
  programId: string,
  idlSource: ExplicitIdlSource,
  deps: FetchIdlDeps
): Promise<unknown> {
  if (idlSource === "anchor") {
    const account = await deps.fetchAnchorIdlAccount(rpc, programId);
    return decodeIdlAccountData(account.data);
  }

  const result = await deps.fetchProgramMetadataIdl(rpc, programId);
  return normalizeProgramMetadataIdl(result.idl);
}

function getAutoFetchError(
  anchorCandidate: FailedCandidate,
  programMetadataCandidate: FailedCandidate
): Error {
  const preferredError = [programMetadataCandidate.error, anchorCandidate.error]
    .filter((error) => !isMissingIdlError(error))
    .at(0);

  return preferredError ?? new Error(NO_COMPATIBLE_IDL_MESSAGE);
}

export async function fetchIdl(
  programId: string,
  rpcUrl = DEFAULT_RPC_URL,
  idlSource: IdlSource = "auto"
): Promise<unknown> {
  return fetchIdlWithDeps(programId, rpcUrl, idlSource);
}

export async function fetchIdlWithDeps(
  programId: string,
  rpcUrl = DEFAULT_RPC_URL,
  idlSource: IdlSource = "auto",
  overrides: Partial<FetchIdlDeps> = {}
): Promise<unknown> {
  if (!programId || programId.length < 32 || programId.length > 44) {
    throw new Error(
      "Invalid program ID. Must be a valid Solana base58 address."
    );
  }

  const deps = getFetchIdlDeps(overrides);
  const rpc = deps.createRpc(rpcUrl);

  if (idlSource !== "auto") {
    return fetchFromExplicitSource(rpc, programId, idlSource, deps);
  }

  const [anchorCandidate, programMetadataCandidate] = await Promise.all([
    loadAnchorCandidate(rpc, programId, deps),
    loadProgramMetadataCandidate(rpc, programId, deps),
  ]);

  if (
    isSuccessfulCandidate(anchorCandidate) &&
    isSuccessfulCandidate(programMetadataCandidate)
  ) {
    return pickAutoCandidate(anchorCandidate, programMetadataCandidate).idl;
  }

  if (isSuccessfulCandidate(programMetadataCandidate)) {
    return programMetadataCandidate.idl;
  }

  if (isSuccessfulCandidate(anchorCandidate)) {
    return anchorCandidate.idl;
  }

  throw getAutoFetchError(anchorCandidate, programMetadataCandidate);
}
