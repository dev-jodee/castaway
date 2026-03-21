"use client";

interface ProgramIdInputProps {
  value: string;
  onChange: (v: string) => void;
  onFetch: () => void;
  loading: boolean;
  error: string | null;
}

export function ProgramIdInput({
  value,
  onChange,
  onFetch,
  loading,
  error,
}: ProgramIdInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onFetch();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="Enter Solana program ID (e.g. JUP6Lkb…)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
        <button
          onClick={() => onFetch()}
          disabled={loading || !value.trim()}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 sm:whitespace-nowrap"
        >
          {loading ? (
            <>
              <Spinner />
              Fetching…
            </>
          ) : (
            "Fetch IDL"
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs px-1">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
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
