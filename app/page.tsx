"use client";

import { useState, useEffect } from "react";
import { fetchIdl, DEFAULT_RPC_URL } from "@/lib/fetch-idl";
import { getIdlSourceFromSearchParams, type IdlSource } from "@/lib/idl-source";
import { ProgramIdInput } from "@/components/ProgramIdInput";
import { PresetSelector } from "@/components/PresetSelector";
import { IdlViewer } from "@/components/IdlViewer";
import { GeneratePanel } from "@/components/GeneratePanel";
import { BrandIcon } from "@/components/BrandIcon";

export default function Home() {
  const [programId, setProgramId] = useState("");
  const [idlSource, setIdlSource] = useState<IdlSource>("auto");
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC_URL);
  const [showRpc, setShowRpc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idl, setIdl] = useState<Record<string, unknown> | null>(null);

  // Accept an optional explicit ID so we can call this from the URL-state
  // effect before React has flushed the programId state update.
  async function handleFetch(explicitId?: string, explicitSource?: IdlSource) {
    const nextProgramId =
      typeof explicitId === "string" ? explicitId : programId;
    const nextIdlSource =
      typeof explicitSource === "string" ? explicitSource : idlSource;
    const id = nextProgramId.trim();
    if (!id) return;

    // Sync input state if we were called with an explicit ID (e.g. from URL)
    if (typeof explicitId === "string") setProgramId(explicitId);
    if (typeof explicitSource === "string") setIdlSource(explicitSource);

    // Persist the program ID in the URL so the result is shareable
    const url = new URL(window.location.href);
    url.searchParams.set("program", id);
    if (nextIdlSource === "auto") {
      url.searchParams.delete("idlSource");
    } else {
      url.searchParams.set("idlSource", nextIdlSource);
    }
    window.history.replaceState(null, "", url.toString());

    setLoading(true);
    setError(null);
    setIdl(null);

    try {
      let result: unknown;

      if (rpcUrl !== DEFAULT_RPC_URL) {
        // Custom RPC: call directly from the browser so the URL never leaves the client
        result = await fetchIdl(id, rpcUrl, nextIdlSource);
      } else {
        // Default: let the server use its configured RPC
        const res = await fetch("/api/fetch-idl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId: id, idlSource: nextIdlSource }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch IDL");
        result = data.idl;
      }

      setIdl(result as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch IDL");
    } finally {
      setLoading(false);
    }
  }

  // On mount: if ?program= is in the URL, pre-fill and auto-fetch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const program = params.get("program");
    const nextIdlSource = getIdlSourceFromSearchParams(params);
    if (program?.trim()) {
      handleFetch(program.trim(), nextIdlSource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePresetSelect(preset: {
    name: string;
    programId: string;
    description: string;
    category: string;
  }) {
    setIdl(null);
    setError(null);
    handleFetch(preset.programId);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <BrandIcon size={32} className="rounded-md" />
          <div>
            <h1 className="text-lg font-bold text-zinc-100 leading-none">
              Castaway
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Solana IDL → SDK Generator
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Input section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">Program ID</h2>
            <button
              onClick={() => setShowRpc((s) => !s)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showRpc ? "Hide RPC" : "Custom RPC"}
            </button>
          </div>

          {showRpc && (
            <div className="space-y-2">
              <input
                type="url"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="https://api.mainnet-beta.solana.com"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                Custom RPC requests are sent directly from your browser. The
                server only uses{" "}
                <code className="font-mono">SOLANA_RPC_URL</code> when fetching
                through the default API route.
              </p>
            </div>
          )}

          <ProgramIdInput
            value={programId}
            onChange={setProgramId}
            onFetch={handleFetch}
            loading={loading}
            error={error}
          />

          <PresetSelector onSelect={handlePresetSelect} />
        </section>

        {/* IDL Viewer */}
        {idl && (
          <section>
            <IdlViewer idl={idl} />
          </section>
        )}

        {/* Generate section */}
        {idl && (
          <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
            <GeneratePanel idl={idl} programId={programId} />
          </section>
        )}

        {/* Empty state */}
        {!idl && !loading && !error && (
          <div className="text-center py-16 text-zinc-600">
            <div className="mb-4 flex justify-center">
              <BrandIcon size={64} className="rounded-2xl" />
            </div>
            <p className="text-sm">
              Enter a program ID or select a preset to get started
            </p>
            <p className="text-xs mt-2 text-zinc-700">
              Fetches the on-chain IDL and generates SDK clients using Codama
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-zinc-500">
              Released under the{" "}
              <a
                href="https://github.com/dev-jodee/castaway/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
              >
                MIT License
              </a>{" "}
              &copy; {new Date().getFullYear()} dev-jodee
            </span>
            <a
              href="https://github.com/dev-jodee/castaway"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <GitHubIcon />
              dev-jodee/castaway
            </a>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            This software is provided &ldquo;as is&rdquo;, without warranty of
            any kind. The authors and contributors accept no liability for
            damages, losses, or issues arising from use of this software. Use at
            your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
