"use client";

import { useState } from "react";
import { Language } from "@/lib/codama-types";
import { LanguageSelector } from "./LanguageSelector";

interface GeneratePanelProps {
  idl: Record<string, unknown>;
  programId: string;
}

export function GeneratePanel({ idl, programId }: GeneratePanelProps) {
  const [language, setLanguage] = useState<Language>("typescript");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const programName =
    typeof idl.name === "string"
      ? idl.name
      : typeof idl.metadata === "object" &&
          idl.metadata !== null &&
          "name" in idl.metadata
        ? String((idl.metadata as Record<string, unknown>).name)
        : "program";

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setDownloaded(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idl, language }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${programName}-${language}-client.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Generate SDK Client
        </h2>
        <LanguageSelector selected={language} onChange={setLanguage} />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {generating ? (
            <>
              <Spinner />
              Generating…
            </>
          ) : (
            <>
              <DownloadIcon />
              Generate &amp; Download
            </>
          )}
        </button>

        {downloaded && !generating && (
          <span className="text-green-400 text-sm flex items-center gap-1.5">
            <CheckIcon />
            Downloaded!
          </span>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Info box */}
      <div className="text-xs text-zinc-500 bg-zinc-800/50 rounded-lg p-3 space-y-1">
        <p>
          <span className="text-zinc-400">Program:</span>{" "}
          <span className="font-mono">{programId}</span>
        </p>
        <p>
          <span className="text-zinc-400">Output:</span> A zip file containing
          the generated client files for the selected language.
        </p>
      </div>

      {/* Next steps */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-zinc-800/40 border-b border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-300">
            What to do with the generated files
          </h3>
        </div>
        <div className="p-4 space-y-3 text-xs text-zinc-400">
          {language === "typescript" && (
            <>
              <Step
                n={1}
                text="Unzip the download and copy the files into your project (e.g. src/generated/)."
              />
              <Step n={2} text="Install the required dependency:">
                <Code>npm install @solana/kit</Code>
              </Step>
              <Step
                n={3}
                text="Import the generated helpers and use them in your code:"
              >
                <Code>{`import { get${capitalize(programName)}InstructionAccounts } from './generated';`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                Generated with{" "}
                <span className="text-zinc-500">@solana/kit</span> (web3.js v2).
                The files are plain TypeScript — no build step required before
                importing.
              </p>
            </>
          )}
          {language === "typescript-umi" && (
            <>
              <Step
                n={1}
                text="Unzip the download and copy the files into your project (e.g. src/generated/)."
              />
              <Step n={2} text="Install the required dependencies:">
                <Code>
                  npm install @metaplex-foundation/umi
                  @metaplex-foundation/umi-bundle-defaults
                </Code>
              </Step>
              <Step
                n={3}
                text="Set up a Umi instance and import the generated plugin:"
              >
                <Code>{`import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';\nimport { ${programName}() } from './generated';\n\nconst umi = createUmi(rpcUrl).use(${programName}());`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                Generated for the{" "}
                <span className="text-zinc-500">Metaplex Umi</span> framework.
                Best suited for NFT and Metaplex ecosystem programs.
              </p>
            </>
          )}
          {language === "rust" && (
            <>
              <Step
                n={1}
                text="Unzip the download and place the files inside your crate (e.g. src/generated/)."
              />
              <Step
                n={2}
                text="Declare the module in your crate root (src/lib.rs or src/main.rs):"
              >
                <Code>mod generated;</Code>
              </Step>
              <Step
                n={3}
                text="Add any required Solana dependencies to your Cargo.toml:"
              >
                <Code>{`[dependencies]\nsolana-program = "2"`}</Code>
              </Step>
              <Step
                n={4}
                text="Import and use the generated types and instructions:"
              >
                <Code>{`use crate::generated::instructions::*;\nuse crate::generated::types::*;`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                Generated as a native Rust crate. Run{" "}
                <span className="text-zinc-500 font-mono">cargo build</span> to
                verify everything compiles.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Step({
  n,
  text,
  children,
}: {
  n: number;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p>
        <span className="text-zinc-500 font-medium">{n}.</span> {text}
      </p>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-zinc-900 border border-zinc-700/50 rounded-md px-3 py-2 font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
      {children}
    </pre>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
