import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import type { AnchorIdl } from "@codama/nodes-from-anchor";
import { MINIMAL_SOLANA_IDL } from "./minimal-anchor-idl";

export const MINIMAL_CODAMA_ROOT = rootNodeFromAnchor(
  MINIMAL_SOLANA_IDL as unknown as AnchorIdl
);
