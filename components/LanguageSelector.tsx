"use client";

import { Language, LANGUAGES } from "@/lib/codama-types";

type LanguageAvailability = Partial<
  Record<Language, { supported: boolean; reason: string | null }>
>;

interface LanguageSelectorProps {
  selected: Language;
  onChange: (lang: Language) => void;
  availability?: LanguageAvailability;
}

export function LanguageSelector({
  selected,
  onChange,
  availability,
}: LanguageSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {LANGUAGES.map((lang) => {
        const state = availability?.[lang.id];
        const supported = state?.supported ?? true;

        return (
          <button
            key={lang.id}
            onClick={() => onChange(lang.id)}
            disabled={!supported}
            title={state?.reason ?? undefined}
            className={`px-4 py-3 rounded-lg border text-left transition-all ${
              !supported
                ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
                : selected === lang.id
                  ? "bg-violet-600/20 border-violet-500 text-violet-300"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            <div className="text-sm font-medium">{lang.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{lang.description}</div>
            {!supported && (
              <div className="text-[11px] mt-1 text-amber-400">Unavailable</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
