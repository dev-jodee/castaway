type UnknownRecord = Record<string, unknown>;

export type IdlDisplayInfo = {
  accountCount: number;
  address: string | null;
  instructionCount: number;
  name: string;
  typeCount: number;
  version: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

export function isCodamaRootNode(idl: unknown): boolean {
  const record = asRecord(idl);
  const program = asRecord(record?.program);

  return record?.kind === "rootNode" && program?.kind === "programNode";
}

export function getCodamaRootNode(idl: unknown): UnknownRecord | null {
  return isCodamaRootNode(idl) ? (idl as UnknownRecord) : null;
}

export function getIdlDisplayInfo(idl: UnknownRecord): IdlDisplayInfo {
  const codamaRoot = getCodamaRootNode(idl);

  if (codamaRoot) {
    const program = asRecord(codamaRoot.program);
    const definedTypes = Array.isArray(program?.definedTypes)
      ? program.definedTypes
      : [];
    const instructions = Array.isArray(program?.instructions)
      ? program.instructions
      : [];
    const accounts = Array.isArray(program?.accounts) ? program.accounts : [];

    return {
      accountCount: accounts.length,
      address:
        typeof program?.publicKey === "string" ? program.publicKey : null,
      instructionCount: instructions.length,
      name: typeof program?.name === "string" ? program.name : "Unknown",
      typeCount: definedTypes.length,
      version:
        typeof program?.version === "string"
          ? program.version
          : typeof codamaRoot.version === "string"
            ? codamaRoot.version
            : "?",
    };
  }

  const metadata = asRecord(idl.metadata);
  const instructions = Array.isArray(idl.instructions) ? idl.instructions : [];
  const accounts = Array.isArray(idl.accounts) ? idl.accounts : [];
  const types = Array.isArray(idl.types) ? idl.types : [];

  return {
    accountCount: accounts.length,
    address: typeof idl.address === "string" ? idl.address : null,
    instructionCount: instructions.length,
    name:
      typeof idl.name === "string"
        ? idl.name
        : typeof metadata?.name === "string"
          ? metadata.name
          : "Unknown",
    typeCount: types.length,
    version:
      typeof idl.version === "string"
        ? idl.version
        : typeof metadata?.version === "string"
          ? metadata.version
          : "?",
  };
}

export function getIdlProgramName(idl: UnknownRecord): string {
  return getIdlDisplayInfo(idl).name;
}
