import {
  createSolanaRpc,
  address,
  createAddressWithSeed,
  getProgramDerivedAddress,
  fetchEncodedAccount,
} from "@solana/kit";
import { inflate } from "pako";

export const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

// Anchor stores IDLs at: createWithSeed(findProgramAddress([], programId), "anchor:idl", programId)
async function getIdlAddress(programId: string): Promise<string> {
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

// IDL account layout (after 8-byte discriminator):
//   32 bytes: authority (Pubkey)
//    4 bytes: data_len (u32 LE)
//   N bytes:  zlib-compressed IDL JSON
function decodeIdlAccountData(raw: Uint8Array): unknown {
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

export async function fetchIdl(
  programId: string,
  rpcUrl = DEFAULT_RPC_URL
): Promise<unknown> {
  // Validate it looks like a base58 address
  if (!programId || programId.length < 32 || programId.length > 44) {
    throw new Error("Invalid program ID. Must be a valid Solana base58 address.");
  }

  const rpc = createSolanaRpc(rpcUrl);
  const idlAddr = await getIdlAddress(programId);
  const account = await fetchEncodedAccount(rpc, address(idlAddr));

  if (!account.exists) {
    throw new Error(
      "No IDL found on-chain for this program. The IDL may not have been uploaded, or this program may not be an Anchor program."
    );
  }

  return decodeIdlAccountData(account.data);
}
