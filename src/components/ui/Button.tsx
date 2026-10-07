"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "field-solid" | "field-ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    let variantStyles = "";
    switch (variant) {
      case "primary":
        variantStyles =
          "bg-[#B8461A] text-[#FAFBF9] border border-transparent hover:bg-[#A33D15] active:scale-[0.98]";
        break;
      case "secondary":
        variantStyles =
          "bg-[#FAFBF9] text-[#101613] border border-[#D3D9D3] hover:border-[#101613] hover:bg-[#F2F4F1] active:scale-[0.98]";
        break;
      case "ghost":
        variantStyles =
          "bg-transparent text-[#44504A] hover:text-[#101613] hover:bg-[#FAFBF9] active:scale-[0.98]";
        break;
      case "field-solid":
        variantStyles =
          "bg-[#F0804A] text-[#0B0F0D] font-semibold hover:bg-[#F0804A]/90 active:scale-[0.98]";
        break;
      case "field-ghost":
        variantStyles =
          "bg-transparent text-[#F2F4F1] border border-[#232B26] hover:border-[#98A39C] hover:text-[#FFFFFF] active:scale-[0.98]";
        break;
    }

    let sizeStyles = "";
    switch (size) {
      case "sm":
        sizeStyles = "min-h-[44px] px-3.5 py-2 text-[15px]";
        break;
      case "md":
        sizeStyles = "min-h-[48px] px-5 py-3 text-[16px]";
        break;
      case "lg":
        sizeStyles = "min-h-[52px] px-6 py-3.5 text-[17px]";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2.5 font-medium rounded-[4px] transition-all duration-150 motion-reduce:transition-none motion-reduce:transform-none select-none focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
