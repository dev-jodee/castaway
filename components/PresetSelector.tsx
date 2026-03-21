"use client";

import { useState, useRef, useEffect } from "react";
import presetsData from "@/data/presets.json";

interface Preset {
  name: string;
  programId: string;
  description: string;
  category: string;
}

const presets: Preset[] = presetsData as Preset[];

interface PresetSelectorProps {
  onSelect: (preset: Preset) => void;
}

export function PresetSelector({ onSelect }: PresetSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? presets.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : presets;

  function handleSelect(preset: Preset) {
    onSelect(preset);
    setQuery("");
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const next = i < filtered.length - 1 ? i + 1 : 0;
        scrollItemIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const next = i > 0 ? i - 1 : filtered.length - 1;
        scrollItemIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function scrollItemIntoView(index: number) {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const CATEGORY_COLORS: Record<string, string> = {
    DeFi: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Staking: "bg-green-500/10 text-green-400 border-green-500/20",
    NFT: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Governance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg pl-9 pr-4 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 hover:border-zinc-600 transition-colors"
          placeholder="Search preset programs…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
        </div>
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto"
        >
          {filtered.map((p, i) => (
            <li key={p.programId}>
              <button
                onMouseDown={() => handleSelect(p)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors group ${
                  highlightedIndex === i
                    ? "bg-zinc-800"
                    : "hover:bg-zinc-800/60"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {p.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${
                    CATEGORY_COLORS[p.category] ??
                    "bg-zinc-700 text-zinc-400 border-zinc-600"
                  }`}
                >
                  {p.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-500">
          No presets match &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
