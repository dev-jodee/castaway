"use client";

import { useState, useEffect } from "react";
import { getIdlDisplayInfo } from "@/lib/idl-utils";

interface IdlViewerProps {
  idl: Record<string, unknown>;
}

const LARGE_IDL_INSTRUCTION_THRESHOLD = 100;
const LARGE_IDL_JSON_BYTES_THRESHOLD = 75_000;

export function IdlViewer({ idl }: IdlViewerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [json, setJson] = useState("");
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { accountCount, address, instructionCount, name, typeCount, version } =
    getIdlDisplayInfo(idl);
  const isLargeIdl = instructionCount >= LARGE_IDL_INSTRUCTION_THRESHOLD;
  const shouldHighlight =
    json.length > 0 && json.length <= LARGE_IDL_JSON_BYTES_THRESHOLD;

  useEffect(() => {
    setCollapsed(isLargeIdl);
  }, [idl, isLargeIdl]);

  useEffect(() => {
    if (collapsed) {
      setJson("");
      setHighlighted(null);
      return;
    }

    setJson(JSON.stringify(idl, null, 2));
    setHighlighted(null);
  }, [idl, collapsed]);

  // Lazily syntax-highlight with shiki; fall back to plain text until ready.
  useEffect(() => {
    if (collapsed || !shouldHighlight) return;
    let cancelled = false;

    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(json, { lang: "json", theme: "github-dark-dimmed" })
      )
      .then((html) => {
        if (!cancelled) setHighlighted(html);
      })
      .catch(() => {
        /* silently fall back to plain text */
      });

    return () => {
      cancelled = true;
    };
  }, [json, collapsed, shouldHighlight]);

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-zinc-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-800/60 px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-semibold text-zinc-100">{name}</span>
            <span className="text-xs text-zinc-500">v{version}</span>
          </div>

          {address && (
            <button
              onClick={handleCopy}
              title="Copy program address"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono truncate max-w-[140px]"
            >
              <span className="truncate">{address.slice(0, 8)}…</span>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          )}

          <div className="hidden sm:flex gap-2 text-xs text-zinc-500">
            <span className="bg-zinc-700 px-2 py-0.5 rounded">
              {instructionCount} instructions
            </span>
            <span className="bg-zinc-700 px-2 py-0.5 rounded">
              {accountCount} accounts
            </span>
            {typeCount > 0 && (
              <span className="bg-zinc-700 px-2 py-0.5 rounded">
                {typeCount} types
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 ml-3"
        >
          {collapsed ? "Show IDL" : "Hide IDL"}
        </button>
      </div>

      {/* JSON view */}
      {!collapsed && (
        <div className="relative max-h-64 overflow-auto bg-zinc-900">
          {!shouldHighlight && json.length > 0 && (
            <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs text-zinc-500">
              Large IDL detected. Syntax highlighting is disabled to keep the
              page responsive.
            </div>
          )}
          {highlighted ? (
            <div
              className="p-4"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          ) : (
            <pre className="p-4 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-all">
              {json}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0 text-green-400"
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
