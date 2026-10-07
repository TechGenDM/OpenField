import React from "react";
import { Warning, Info } from "@phosphor-icons/react/dist/ssr";

export interface CalloutProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "signal" | "default";
  className?: string;
  role?: string;
}

export function Callout({
  title,
  children,
  icon,
  variant = "signal",
  className = "",
  role,
}: CalloutProps) {
  const borderStyles =
    variant === "signal"
      ? "border-l-[4px] border-l-[#B8461A] border-y border-r border-[#D3D9D3]"
      : "border border-[#D3D9D3]";

  return (
    <div
      role={role}
      className={`rounded-[4px] bg-[#FAFBF9] p-4 text-[#101613] text-left space-y-1.5 ${borderStyles} ${className}`}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 font-medium text-[15px] text-[#101613]">
          {icon ?? (variant === "signal" ? <Warning size={18} className="text-[#B8461A] shrink-0" weight="bold" /> : <Info size={18} className="text-[#44504A] shrink-0" />)}
          {title && <span>{title}</span>}
        </div>
      )}
      <div className="text-[15px] leading-relaxed text-[#101613]">{children}</div>
    </div>
  );
}
