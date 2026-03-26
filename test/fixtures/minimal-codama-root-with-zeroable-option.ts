import {
  definedTypeNode,
  publicKeyTypeNode,
  structFieldTypeNode,
  structTypeNode,
  zeroableOptionTypeNode,
} from "@codama/nodes";
import { MINIMAL_CODAMA_ROOT } from "./minimal-codama-root";

export const MINIMAL_CODAMA_ROOT_WITH_ZEROABLE_OPTION = {
  ...MINIMAL_CODAMA_ROOT,
  program: {
    ...MINIMAL_CODAMA_ROOT.program,
    definedTypes: [
      ...MINIMAL_CODAMA_ROOT.program.definedTypes,
      definedTypeNode({
        name: "maybeAuthority",
        docs: [],
        type: structTypeNode([
          structFieldTypeNode({
            name: "authority",
            docs: [],
            type: zeroableOptionTypeNode(publicKeyTypeNode()),
          }),
        ]),
      }),
    ],
  },
} as const;
