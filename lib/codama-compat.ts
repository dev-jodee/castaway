import { LANGUAGES, type Language } from "./codama-types";

type CompatibilityInfo = {
  supported: boolean;
  unsupportedNodeKinds: string[];
  reason: string | null;
};

const UNSUPPORTED_NODE_KINDS: Partial<Record<Language, readonly string[]>> = {
  "typescript-umi": ["zeroableOptionTypeNode"],
  rust: ["zeroableOptionTypeNode"],
  go: ["zeroableOptionTypeNode"],
};

function collectNodeKinds(value: unknown, kinds: Set<string>): void {
  if (!value || typeof value !== "object") {
    return;
  }

  if ("kind" in value && typeof value.kind === "string") {
    kinds.add(value.kind);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectNodeKinds(item, kinds);
    }
    return;
  }

  for (const nested of Object.values(value)) {
    collectNodeKinds(nested, kinds);
  }
}

export function getUnsupportedNodeKinds(
  idl: Record<string, unknown>,
  language: Language
): string[] {
  const unsupportedKinds = UNSUPPORTED_NODE_KINDS[language] ?? [];
  if (unsupportedKinds.length === 0) {
    return [];
  }

  const presentKinds = new Set<string>();
  collectNodeKinds(idl, presentKinds);

  return unsupportedKinds.filter((kind) => presentKinds.has(kind));
}

export function getCompatibilityReason(
  language: Language,
  unsupportedNodeKinds: string[]
): string | null {
  if (unsupportedNodeKinds.length === 0) {
    return null;
  }

  const languageLabel =
    LANGUAGES.find((entry) => entry.id === language)?.label ?? language;
  const kindsLabel =
    unsupportedNodeKinds.length === 1
      ? `unsupported Codama node kind: ${unsupportedNodeKinds[0]}`
      : `unsupported Codama node kinds: ${unsupportedNodeKinds.join(", ")}`;

  return `${languageLabel} does not support this IDL yet because it contains ${kindsLabel}. Try TypeScript instead.`;
}

export function getLanguageCompatibility(
  idl: Record<string, unknown>,
  language: Language
): CompatibilityInfo {
  const unsupportedNodeKinds = getUnsupportedNodeKinds(idl, language);
  return {
    supported: unsupportedNodeKinds.length === 0,
    unsupportedNodeKinds,
    reason: getCompatibilityReason(language, unsupportedNodeKinds),
  };
}

export function getAllLanguageCompatibility(idl: Record<string, unknown>) {
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language.id,
      getLanguageCompatibility(idl, language.id),
    ])
  ) as Record<Language, CompatibilityInfo>;
}

export function assertLanguageSupportedForIdl(
  idl: Record<string, unknown>,
  language: Language
): void {
  const compatibility = getLanguageCompatibility(idl, language);
  if (!compatibility.supported) {
    throw new Error(compatibility.reason ?? "Generation failed");
  }
}
