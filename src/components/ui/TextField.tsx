"use client";

import React from "react";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string | null;
  leftIcon?: React.ReactNode;
  counter?: React.ReactNode;
  highlighted?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      helperText,
      errorText,
      id,
      className = "",
      required,
      leftIcon,
      counter,
      highlighted = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={id} className="block text-[14px] font-semibold text-[#18201B]">
              {label}
              {required && <span className="text-[#C0562F] ml-1">*</span>}
            </label>
            {counter && (
              <span className="text-[12px] font-mono text-[#7D857F] select-none">
                {counter}
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center justify-center text-[#7A837C] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            required={required}
            className={`w-full min-h-[44px] py-2.5 rounded-xl border bg-white text-[#18201B] placeholder:text-[#8D958F] text-[14.5px] transition-all focus:outline-none focus:ring-2 focus:ring-[#C0562F]/20 focus:border-[#C0562F] disabled:bg-[#F2F4F1] disabled:text-[#44504A]/60 ${
              leftIcon ? "pl-10 pr-3.5" : "px-3.5"
            } ${
              errorText
                ? "border-[#C0562F]"
                : highlighted
                ? "border-[#E39878]"
                : "border-[#DFE2DC] hover:border-[#BAC0B7]"
            } ${className}`}
            {...props}
          />
        </div>
        {helperText && !errorText && (
          <p className="text-[12px] text-[#7A827B] leading-normal">{helperText}</p>
        )}
        {errorText && (
          <p role="alert" className="text-[12px] text-[#C0562F] font-medium leading-normal">
            {errorText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
