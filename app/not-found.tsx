import Link from "next/link";
import { BrandIcon } from "@/components/BrandIcon";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-md">
        <div className="flex justify-center">
          <BrandIcon size={64} className="rounded-2xl" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">Page not found</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          This page doesn&apos;t exist. It may have been moved or the URL might
          be wrong.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Castaway
        </Link>
      </div>
    </div>
  );
}
