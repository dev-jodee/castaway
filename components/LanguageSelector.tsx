"use client";

import { Language, LANGUAGES } from "@/lib/codama-generate";

interface LanguageSelectorProps {
  selected: Language;
  onChange: (lang: Language) => void;
}

export function LanguageSelector({
  selected,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onChange(lang.id)}
          className={`flex-1 px-4 py-3 rounded-lg border text-left transition-all ${
            selected === lang.id
              ? "bg-violet-600/20 border-violet-500 text-violet-300"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          <div className="text-sm font-medium">{lang.label}</div>
          <div className="text-xs mt-0.5 opacity-70">{lang.description}</div>
        </button>
      ))}
    </div>
  );
}
