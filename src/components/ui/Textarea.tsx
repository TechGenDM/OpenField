"use client";

import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorText?: string | null;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, errorText, id, className = "", required, ...props }, ref) => {
    return (
      <div className="space-y-2 text-left">
        {label && (
          <label htmlFor={id} className="block text-[15px] font-medium text-[#101613]">
            {label}
            {required && <span className="text-[#B8461A] ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          required={required}
          className={`w-full min-h-[96px] px-3.5 py-3 rounded-[4px] border bg-[#FAFBF9] text-[#101613] placeholder:text-[#44504A]/60 text-[17px] leading-relaxed transition-colors focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-2 disabled:bg-[#F2F4F1] disabled:text-[#44504A]/60 ${
            errorText ? "border-[#B8461A]" : "border-[#D3D9D3] hover:border-[#44504A]"
          } ${className}`}
          {...props}
        />
        {helperText && !errorText && (
          <p className="text-[13px] text-[#44504A] leading-normal">{helperText}</p>
        )}
        {errorText && (
          <p role="alert" className="text-[13px] text-[#B8461A] font-medium leading-normal">
            {errorText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
