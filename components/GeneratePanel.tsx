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
        body: JSON.stringify({ idl, language, programId }),
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
                text="Unzip the download. The archive is generated as a package folder, typically with its own package.json and a src/generated entrypoint."
              />
              <Step
                n={2}
                text="Install the dependencies declared in the generated package.json. At minimum, the generated client targets @solana/kit."
              >
                <Code>npm install</Code>
              </Step>
              <Step
                n={3}
                text="Import from the generated entrypoint and use the exported instruction builders, account helpers, PDA helpers, or program constants you need."
              >
                <Code>{`import * as ${camelCase(programName)}Client from './src/generated';`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                This renderer targets{" "}
                <span className="text-zinc-500">@solana/kit</span>. The
                generated package manifest is the source of truth for exact
                dependencies and versions.
              </p>
            </>
          )}
          {language === "typescript-umi" && (
            <>
              <Step
                n={1}
                text="Unzip the download and install the dependencies from the generated package.json."
              />
              <Step
                n={2}
                text="Create a Umi instance for your RPC endpoint, then wire in the generated client exports from the package entrypoint."
              >
                <Code>
                  {`import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';\nimport * as generated from './src/generated';\n\nconst umi = createUmi(rpcUrl);`}
                </Code>
              </Step>
              <Step
                n={3}
                text="If the generated client exposes a plugin factory, register it with umi.use(...). Otherwise, import the generated instruction/account helpers directly from the entrypoint."
              >
                <Code>{`const umiWithProgram = 'plugin' in generated ? umi.use((generated as { plugin: () => unknown }).plugin() as never) : umi;`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                This renderer targets the{" "}
                <span className="text-zinc-500">Metaplex Umi</span> ecosystem.
                Check the generated package exports first, because the exact
                symbols depend on the program IDL.
              </p>
            </>
          )}
          {language === "go" && (
            <>
              <Step
                n={1}
                text="Unzip the download into your Go module, then choose the import path you want the generated package to live under."
              />
              <Step
                n={2}
                text="Sync dependencies and verify the generated package compiles:"
              >
                <Code>{`go mod tidy\ngo build ./...`}</Code>
              </Step>
              <Step
                n={3}
                text="Import the generated package using your module path and call the exported instruction/account helpers from there."
              >
                <Code>{`import generated "github.com/you/yourproject/path/to/generated"`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                Generated as a native <span className="text-zinc-500">Go</span>{" "}
                package. Your module path and folder layout determine the final
                import string.
              </p>
            </>
          )}
          {language === "rust" && (
            <>
              <Step
                n={1}
                text="Unzip the download. The Rust renderer is designed around a crate folder with generated code under src/generated."
              />
              <Step
                n={2}
                text="If you keep it as its own crate, open the generated Cargo.toml and build it directly. If you copy src/generated into an existing crate, expose it from your crate root."
              >
                <Code>{`mod generated;`}</Code>
              </Step>
              <Step
                n={3}
                text="Use the generated Cargo.toml as the source of truth for required dependencies and versions."
              >
                <Code>{`cargo build`}</Code>
              </Step>
              <Step
                n={4}
                text="Import the generated modules you need, such as instructions, accounts, types, PDAs, or program constants."
              >
                <Code>{`use crate::generated::instructions::*;\nuse crate::generated::types::*;`}</Code>
              </Step>
              <p className="text-zinc-600 pt-1">
                Generated as a native Rust client. Build the generated crate
                before wiring it into a larger project so dependency issues show
                up early.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function camelCase(str: string) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, "");
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
