export const IDL_SOURCES = ["auto", "anchor", "program-metadata"] as const;

export type IdlSource = (typeof IDL_SOURCES)[number];
export type ExplicitIdlSource = Exclude<IdlSource, "auto">;

export function isIdlSource(value: unknown): value is IdlSource {
  return typeof value === "string" && IDL_SOURCES.includes(value as IdlSource);
}

export function normalizeIdlSource(value: unknown): IdlSource {
  return isIdlSource(value) ? value : "auto";
}

export function getIdlSourceFromSearchParams(
  params: URLSearchParams
): IdlSource {
  return normalizeIdlSource(params.get("idlSource"));
}
