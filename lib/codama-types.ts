export type Language =
  | "typescript"
  | "typescript-umi"
  | "rust"
  | "go"
  | "dart";

export const LANGUAGES: { id: Language; label: string; description: string }[] =
  [
    {
      id: "typescript",
      label: "TypeScript",
      description: "@solana/kit (web3.js v2)",
    },
    {
      id: "typescript-umi",
      label: "TypeScript Umi",
      description: "Metaplex Umi framework",
    },
    {
      id: "rust",
      label: "Rust",
      description: "Native Rust client",
    },
    {
      id: "go",
      label: "Go",
      description: "Native Go client",
    },
    {
      id: "dart",
      label: "Dart",
      description: "Native Dart client (solana_kit)",
    },
  ];
