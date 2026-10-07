"use client";

import React, { useEffect, useState } from "react";

export interface ElapsedLoaderProps {
  label: string;
  subtext?: string;
  className?: string;
}

export function ElapsedLoader({
  label,
  subtext = "Local models are slow. This usually takes about a minute.",
  className = "",
}: ElapsedLoaderProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className={`space-y-2 text-center ${className}`}>
      <div className="w-full min-h-[52px] py-3.5 px-5 rounded-[4px] bg-[#FAFBF9] border border-[#D3D9D3] text-[#101613] font-medium text-[16px] flex items-center justify-center gap-3 shadow-none">
        <span className="w-2 h-2 rounded-full bg-[#B8461A] animate-pulse" aria-hidden="true" />
        <span>{label}</span>
        <span className="font-mono text-[#B8461A] font-semibold text-[15px] ml-1">
          {formattedTime}
        </span>
      </div>
      {subtext && (
        <p className="text-[13px] text-[#44504A] font-normal leading-normal">
          {subtext}
        </p>
      )}
    </div>
  );
}
