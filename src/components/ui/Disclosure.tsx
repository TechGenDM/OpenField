"use client";

import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface DisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className = "",
}: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-[#D3D9D3] rounded-[4px] bg-[#FAFBF9] overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-[#F2F4F1] focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-[-2px]"
      >
        <span className="text-[14px] font-mono uppercase tracking-wider text-[#101613] font-medium">
          {title}
        </span>
        <CaretDown
          size={16}
          className={`text-[#44504A] transition-transform duration-200 motion-reduce:transition-none ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-[#D3D9D3] text-[15px] leading-relaxed text-[#101613]">
          {children}
        </div>
      )}
    </div>
  );
}
