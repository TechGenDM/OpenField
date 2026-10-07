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
      className={`flex items-center gap-4 sm:gap-5 text-[13px] font-sans no-print select-none ${className}`}
    >
      {STAGES.map((s, idx) => {
        const isCurrent = s.id === currentStage;
        return (
          <div key={s.id} className="flex items-center gap-4 sm:gap-5">
            <span
              className={`pb-0.5 transition-colors ${
                isCurrent
                  ? "text-[#101613] font-semibold border-b-2 border-[#101613]"
                  : "text-[#7A837C]"
              }`}
            >
              {s.label}
            </span>
            {idx < STAGES.length - 1 && (
              <span className="text-[#C4C8C2]" aria-hidden="true">
                /
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
