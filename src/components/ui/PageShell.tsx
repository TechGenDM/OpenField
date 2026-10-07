"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Plant, BookOpen, ClipboardText, ChartBar, Sun, Leaf } from "@phosphor-icons/react";

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

  const isPlan =
    pathname === "/" ||
    (pathname?.startsWith("/study/") &&
      !pathname.includes("/field") &&
      !pathname.includes("/return") &&
      !pathname.includes("/report"));
  const isField = Boolean(pathname?.includes("/field"));
  const isReturn = Boolean(pathname?.includes("/return"));
  const isReport = Boolean(pathname?.includes("/report"));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F4F5F1] text-[#101613] antialiased">
      {/* Top Survey Header */}
      <header className="border-b border-[#E5E7E2] bg-[#FAFBF9]/95 backdrop-blur-xs sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 min-h-[56px] flex items-center justify-between">
          {/* Logo + Local AI badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[#111613] hover:text-[#C0562F] transition-colors focus-visible:outline-2 focus-visible:outline-[#C0562F] focus-visible:outline-offset-2"
            >
              <span className="font-bold text-[19px] tracking-tight text-[#111613]">
                OpenField
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBECE7] text-[#555E57] text-[11px] font-mono font-semibold tracking-wider uppercase select-none">
              <span>LOCAL AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C0562F]" aria-hidden="true" />
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                isPlan
                  ? "bg-[#FAF0E8] border border-[#ECD5C5] text-[#C0562F] shadow-xs"
                  : "text-[#636C65] hover:text-[#111613]"
              }`}
            >
              <Plant size={15} weight="regular" />
              <span>Plan</span>
            </Link>
            <span
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                isField
                  ? "bg-[#FAF0E8] border border-[#ECD5C5] text-[#C0562F] shadow-xs"
                  : "text-[#636C65] hover:text-[#111613]"
              }`}
            >
              <BookOpen size={15} weight="regular" />
              <span>Field</span>
            </span>
            <span
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                isReturn
                  ? "bg-[#FAF0E8] border border-[#ECD5C5] text-[#C0562F] shadow-xs"
                  : "text-[#636C65] hover:text-[#111613]"
              }`}
            >
              <ClipboardText size={15} weight="regular" />
              <span>Return</span>
            </span>
            <span
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                isReport
                  ? "bg-[#FAF0E8] border border-[#ECD5C5] text-[#C0562F] shadow-xs"
                  : "text-[#636C65] hover:text-[#111613]"
              }`}
            >
              <ChartBar size={15} weight="regular" />
              <span>Report</span>
            </span>
          </nav>

          {/* Right Header: Subtitle & Avatar */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-l border-[#E0E3DE] pl-4">
              <Sun size={20} weight="regular" className="text-[#C0562F] shrink-0" />
              <div className="text-left select-none">
                <p className="text-[12px] font-semibold text-[#18201B] leading-tight">
                  Screen-off outdoor science
                </p>
                <p className="text-[11px] text-[#69726C] leading-tight">
                  Explore nature. Notice more.
                </p>
              </div>
            </div>
            <div
              aria-label="User avatar"
              className="w-8 h-8 rounded-full bg-[#202723] text-white flex items-center justify-center font-bold text-[13px] select-none shrink-0"
            >
              N
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-5 relative flex flex-col justify-center">
        {children}
      </main>

      {/* Survey Footer */}
      <footer className="border-t border-[#DFE2DC] py-3.5 text-[13px] text-[#5D655F] no-print bg-[#FAFBF9]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-full bg-[#202723] text-white flex items-center justify-center font-bold text-[12px] select-none"
            >
              N
            </div>
            <p className="hidden sm:inline text-[#5D655F]">
              OpenField runs locally. Photos and notes stay on your device.
            </p>
          </div>
          <p className="sm:hidden text-center text-[#5D655F]">
            OpenField runs locally. Photos and notes stay on your device.
          </p>
          <div className="flex items-center gap-1.5 text-[#4F6754] select-none">
            <Leaf size={16} weight="regular" className="shrink-0" />
            <span>A calmer, more observant you.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
