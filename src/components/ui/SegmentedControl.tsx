"use client";

import React from "react";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  name = "segmented-control",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`grid grid-cols-4 border border-[#D3D9D3] rounded-[4px] bg-[#FAFBF9] divide-x divide-[#D3D9D3] overflow-hidden ${className}`}
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
            className={`min-h-[48px] py-3 px-2 text-center text-[15px] font-mono transition-colors focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-[-2px] disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? "bg-[#101613] text-[#F2F4F1] font-semibold"
                : "bg-[#FAFBF9] text-[#44504A] hover:bg-[#F2F4F1] hover:text-[#101613]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
