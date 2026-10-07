import React from "react";

export interface TagProps {
  children: React.ReactNode;
  variant?: "default" | "signal" | "dim";
  className?: string;
}

export function Tag({ children, variant = "default", className = "" }: TagProps) {
  let variantStyles = "border-[#D3D9D3] text-[#44504A] bg-[#FAFBF9]";
  if (variant === "signal") {
    variantStyles = "border-[#B8461A] text-[#B8461A] bg-[#FAFBF9]";
  } else if (variant === "dim") {
    variantStyles = "border-[#D3D9D3] text-[#44504A] bg-transparent";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[12px] font-mono uppercase tracking-wider rounded-[4px] border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}
