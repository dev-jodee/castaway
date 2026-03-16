"use client";

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
  return (
    <div className="relative">
      <select
        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer hover:border-violet-500 focus:outline-none focus:border-violet-500 transition-colors"
        defaultValue=""
        onChange={(e) => {
          const preset = presets.find((p) => p.programId === e.target.value);
          if (preset) onSelect(preset);
          e.target.value = "";
        }}
      >
        <option value="" disabled>
          Load a preset program…
        </option>
        {presets.map((p) => (
          <option key={p.programId} value={p.programId}>
            {p.name} — {p.category}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
