"use client";

import React from "react";

export interface RadioRowOption<T extends string> {
  value: T;
  label: string;
  desc: string;
  icon?: React.ReactNode;
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
      className={`border border-[#DFE2DC] rounded-xl bg-white divide-y divide-[#EAECE8] overflow-hidden ${className}`}
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
            className={`w-full text-left p-2.5 sm:px-3.5 sm:py-2.5 min-h-[48px] transition-colors flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-[#C0562F] focus-visible:outline-offset-[-2px] disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? "bg-[#FAF4EF] border-l-4 border-l-[#C0562F] pl-2.5 sm:pl-3"
                : "bg-white border-l-4 border-l-transparent pl-2.5 sm:pl-3 hover:bg-[#F9FAF8]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {opt.icon && (
                <div
                  className={`shrink-0 transition-colors ${
                    isSelected ? "text-[#C0562F]" : "text-[#3A423D]"
                  }`}
                >
                  {opt.icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-[#18201B] text-[14px] leading-snug">
                  {opt.label}
                </div>
                <div className="text-[11.5px] text-[#636C65] mt-0.5 leading-normal">
                  {opt.desc}
                </div>
              </div>
            </div>
            <div
              className={`shrink-0 w-4.5 h-4.5 rounded-full border-2 transition-all flex items-center justify-center ${
                isSelected ? "border-[#C0562F]" : "border-[#D2D6CF]"
              }`}
              aria-hidden="true"
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-[#C0562F]" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
