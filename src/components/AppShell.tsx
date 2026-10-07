"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * AppShell manages top-level layout isolation.
 * When in Field Mode (/field), the normal site header and footer are omitted
 * to maintain the calm, dedicated "screen-off" immersion required outdoors.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFieldMode = pathname?.endsWith("/field");

  if (isFieldMode) {
    return (
      <div className="min-h-screen bg-black text-zinc-100">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <header className="border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-sm sticky top-0 z-10 no-print">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900 hover:text-zinc-700 transition"
          >
            OpenField{" "}
            <span className="text-xs font-normal text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full ml-1.5 border border-emerald-200">
              Local AI
            </span>
          </Link>
          <span className="text-xs text-zinc-600 font-medium">
            Screen-off outdoor science
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8">
        {children}
      </main>

      <footer className="border-t border-zinc-200/60 py-6 text-center text-xs text-zinc-600 no-print">
        <p>OpenField runs locally. Photos and notes stay on your device.</p>
      </footer>
    </div>
  );
}
