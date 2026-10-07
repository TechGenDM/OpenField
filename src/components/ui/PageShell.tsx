"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

export interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  const pathname = usePathname();
  const isFieldMode = pathname?.endsWith("/field");
  const shouldReduceMotion = useReducedMotion();

  if (isFieldMode) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0F0D] text-[#F2F4F1] font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F2F4F1] text-[#101613] antialiased">
      {/* Top Survey Header */}
      <header className="border-b border-[#D3D9D3] bg-[#FAFBF9] sticky top-0 z-20 no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 min-h-[64px] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[#101613] hover:text-[#B8461A] transition-colors focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-2"
          >
            <span className="font-semibold text-[19px] tracking-tight">OpenField</span>
            <span className="text-[11px] font-mono tracking-wider text-[#44504A] border border-[#D3D9D3] px-1.5 py-0.5 rounded-[4px] uppercase select-none">
              Local AI
            </span>
          </Link>
          <span className="text-[13px] text-[#44504A] hidden sm:inline select-none">
            Screen-off outdoor science
          </span>
        </div>
      </header>

      {/* Main Content with subtle 8px fade-up mount motion */}
      <motion.main
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10"
      >
        {children}
      </motion.main>

      {/* Survey Footer */}
      <footer className="border-t border-[#D3D9D3] py-6 text-center text-[13px] text-[#44504A] no-print">
        <div className="max-w-4xl mx-auto px-4">
          <p>OpenField runs locally. Photos and notes stay on your device.</p>
        </div>
      </footer>
    </div>
  );
}
