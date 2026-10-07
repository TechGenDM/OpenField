import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "OpenField - Local AI Field Study Instrument",
  description:
    "Ask a question about the real world. Local Gemma turns it into an outdoor field study.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-[100dvh] antialiased bg-[#F2F4F1] text-[#101613] font-sans selection:bg-[#B8461A]/20 selection:text-[#101613]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
