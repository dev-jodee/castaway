"use client";

import { useState } from "react";

interface IdlViewerProps {
  idl: Record<string, unknown>;
}

export function IdlViewer({ idl }: IdlViewerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const json = JSON.stringify(idl, null, 2);
  const name =
    typeof idl.name === "string"
      ? idl.name
      : typeof idl.metadata === "object" &&
          idl.metadata !== null &&
          "name" in idl.metadata
        ? String((idl.metadata as Record<string, unknown>).name)
        : "Unknown";
  const version =
    typeof idl.version === "string"
      ? idl.version
      : typeof idl.metadata === "object" &&
          idl.metadata !== null &&
          "version" in idl.metadata
        ? String((idl.metadata as Record<string, unknown>).version)
        : "?";

  const instructionCount = Array.isArray(idl.instructions)
    ? idl.instructions.length
    : 0;
  const accountCount = Array.isArray(idl.accounts) ? idl.accounts.length : 0;
  const typeCount = Array.isArray(idl.types) ? idl.types.length : 0;

  return (
    <div className="border border-zinc-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-800/60 px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-semibold text-zinc-100">{name}</span>
            <span className="text-xs text-zinc-500">v{version}</span>
          </div>
          <div className="flex gap-2 text-xs text-zinc-500">
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
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {collapsed ? "Show IDL" : "Hide IDL"}
        </button>
      </div>

      {/* JSON view */}
      {!collapsed && (
        <div className="relative max-h-64 overflow-auto bg-zinc-900">
          <pre className="p-4 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-all">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}
