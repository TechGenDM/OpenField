import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenField — Local-AI Field Study Engine",
  description:
    "Ask a question about the real world. Local Gemma turns it into an outdoor field study.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <header className="border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-sm sticky top-0 z-10 no-print">
          <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <a
              href="/"
              className="text-lg font-bold tracking-tight text-zinc-900 hover:text-zinc-700 transition"
            >
              OpenField <span className="text-xs font-normal text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full ml-1.5 border border-emerald-200">Local AI</span>
            </a>
            <span className="text-xs text-zinc-600 font-medium">Screen-off outdoor science</span>
          </div>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8">
          {children}
        </main>

        <footer className="border-t border-zinc-200/60 py-6 text-center text-xs text-zinc-600 no-print">
          <p>OpenField runs locally. Photos and notes stay on your device.</p>
        </footer>
      </body>
    </html>
  );
}
