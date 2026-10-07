import React from "react";

export type Stage = "plan" | "field" | "return" | "report";

export interface StageTrailProps {
  currentStage: Stage;
  className?: string;
}

const STAGES: { id: Stage; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "field", label: "Field" },
  { id: "return", label: "Return" },
  { id: "report", label: "Report" },
];

export function StageTrail({ currentStage, className = "" }: StageTrailProps) {
  return (
    <nav
      aria-label="Study progress trail"
      className={`flex items-center gap-6 text-[13px] font-mono tracking-wider no-print ${className}`}
    >
      {STAGES.map((s, idx) => {
        const isCurrent = s.id === currentStage;
        return (
          <div key={s.id} className="flex items-center gap-6">
            <span
              className={`pb-1 select-none transition-colors ${
                isCurrent
                  ? "text-[#101613] font-semibold border-b-2 border-[#B8461A]"
                  : "text-[#44504A]/70"
              }`}
            >
              {s.label}
            </span>
            {idx < STAGES.length - 1 && (
              <span className="text-[#D3D9D3] select-none" aria-hidden="true">
                /
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
