"use client";

import { useState } from "react";
import { fetchIdl, DEFAULT_RPC_URL } from "@/lib/fetch-idl";
import { ProgramIdInput } from "@/components/ProgramIdInput";
import { PresetSelector } from "@/components/PresetSelector";
import { IdlViewer } from "@/components/IdlViewer";
import { GeneratePanel } from "@/components/GeneratePanel";

export default function Home() {
  const [programId, setProgramId] = useState("");
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC_URL);
  const [showRpc, setShowRpc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idl, setIdl] = useState<Record<string, unknown> | null>(null);

  async function handleFetch() {
    if (!programId.trim()) return;
    setLoading(true);
    setError(null);
    setIdl(null);

    try {
      const result = await fetchIdl(programId.trim(), rpcUrl);
      setIdl(result as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch IDL");
    } finally {
      setLoading(false);
    }
  }

  function handlePresetSelect(preset: {
    name: string;
    programId: string;
    description: string;
    category: string;
  }) {
    setProgramId(preset.programId);
    setIdl(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪃</span>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 leading-none">
                Castaway
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Solana IDL → SDK Generator
              </p>
            </div>
          </div>
          <a
            href="https://github.com/codama-idl/codama"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            Powered by Codama
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
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
            <input
              type="url"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="https://api.mainnet-beta.solana.com"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
            />
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
            <div className="text-5xl mb-4">🪃</div>
            <p className="text-sm">
              Enter a program ID or select a preset to get started
            </p>
            <p className="text-xs mt-2 text-zinc-700">
              Fetches the on-chain Anchor IDL and generates SDK clients using
              Codama
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
