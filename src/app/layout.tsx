import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

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
      <body className="min-h-screen antialiased bg-[#fbfbf9]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
