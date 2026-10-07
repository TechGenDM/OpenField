"use client";

import React from "react";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  activeVariant?: "dark" | "terracotta";
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  name = "segmented-control",
  activeVariant = "terracotta",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`grid grid-cols-4 border border-[#DFE2DC] rounded-xl bg-white divide-x divide-[#DFE2DC] overflow-hidden ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`min-h-[48px] py-3 px-1 text-center text-[14px] font-medium transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#C0562F] focus-visible:outline-offset-[-2px] disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? activeVariant === "terracotta"
                  ? "bg-[#C0562F] text-white"
                  : "bg-[#101613] text-[#F2F4F1] font-semibold"
                : "bg-white text-[#303833] hover:bg-[#F9FAF8]"
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
