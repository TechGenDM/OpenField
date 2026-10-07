"use client";

import React from "react";

export interface RadioRowOption<T extends string> {
  value: T;
  label: string;
  desc: string;
}

export interface RadioRowProps<T extends string> {
  options: RadioRowOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function RadioRow<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}: RadioRowProps<T>) {
  return (
    <div
      role="radiogroup"
      className={`border border-[#D3D9D3] rounded-[4px] bg-[#FAFBF9] divide-y divide-[#D3D9D3] overflow-hidden ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-3.5 sm:p-4 min-h-[56px] transition-colors flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-[-2px] disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? "bg-[#FAFBF9] border-l-[4px] border-l-[#B8461A] pl-3 sm:pl-[14px]"
                : "border-l-[4px] border-l-transparent pl-3 sm:pl-[14px] hover:bg-[#F2F4F1]"
            }`}
          >
            <div>
              <div className="font-medium text-[#101613] text-[16px] leading-snug">
                {opt.label}
              </div>
              <div className="text-[13px] text-[#44504A] mt-0.5 leading-normal">
                {opt.desc}
              </div>
            </div>
            {isSelected && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-[#B8461A]" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
