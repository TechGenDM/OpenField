import { describe, it, expect } from "vitest";
import {
  formatTimer,
  calculateRemainingSeconds,
  clampStepIndex,
} from "../src/lib/timer";
import { FieldProtocol, StudyMinutes } from "../src/lib/schemas";

describe("Field Mode Logic & Timer Helpers", () => {
  describe("Duration derivation from protocol minutes", () => {
    const minutesToSeconds = (minutes: StudyMinutes): number => minutes * 60;

    it("correctly derives total seconds for all supported study durations", () => {
      expect(minutesToSeconds(15)).toBe(900);
      expect(minutesToSeconds(30)).toBe(1800);
      expect(minutesToSeconds(45)).toBe(2700);
      expect(minutesToSeconds(60)).toBe(3600);
    });
  });

  describe("Timer formatting (formatTimer)", () => {
    it("formats boundary values accurately", () => {
      expect(formatTimer(60)).toBe("01:00");
      expect(formatTimer(59)).toBe("00:59");
      expect(formatTimer(30)).toBe("00:30");
      expect(formatTimer(1)).toBe("00:01");
      expect(formatTimer(0)).toBe("00:00");
      expect(formatTimer(90)).toBe("01:30");
      expect(formatTimer(1800)).toBe("30:00");
    });

    it("handles negative or invalid values safely", () => {
      expect(formatTimer(-1)).toBe("00:00");
      expect(formatTimer(-60)).toBe("00:00");
      expect(formatTimer(NaN)).toBe("00:00");
    });
  });

  describe("Timestamp-based remaining seconds derivation", () => {
    it("calculates remaining seconds without interval drift", () => {
      const now = 1000000;
      expect(calculateRemainingSeconds(now + 60000, now)).toBe(60);
      expect(calculateRemainingSeconds(now + 30000, now)).toBe(30);
      expect(calculateRemainingSeconds(now + 500, now)).toBe(1);
      expect(calculateRemainingSeconds(now, now)).toBe(0);
      expect(calculateRemainingSeconds(now - 5000, now)).toBe(0);
    });
  });

  describe("Step index navigation and clamping", () => {
    const totalSteps = 5;

    it("clamps negative indices to 0", () => {
      expect(clampStepIndex(-1, totalSteps)).toBe(0);
      expect(clampStepIndex(-10, totalSteps)).toBe(0);
    });

    it("clamps overflow indices to totalSteps - 1", () => {
      expect(clampStepIndex(5, totalSteps)).toBe(4);
      expect(clampStepIndex(10, totalSteps)).toBe(4);
    });

    it("preserves valid step indices within range", () => {
      for (let i = 0; i < totalSteps; i++) {
        expect(clampStepIndex(i, totalSteps)).toBe(i);
      }
    });

    it("prevents previous navigation at first step", () => {
      const current = 0;
      const prev = Math.max(0, current - 1);
      expect(prev).toBe(0);
    });

    it("prevents next navigation at final step", () => {
      const current = totalSteps - 1;
      const next = Math.min(totalSteps - 1, current + 1);
      expect(next).toBe(totalSteps - 1);
    });
  });

  describe("Protocol step access across 4, 5, and 6 steps", () => {
    const makeProtocol = (stepCount: 4 | 5 | 6): FieldProtocol => ({
      id: `protocol-${stepCount}`,
      title: `Field Study ${stepCount} Steps`,
      researchQuestion: "What patterns exist outdoors?",
      minutes: 30,
      type: "nature",
      evidenceNeeded: ["Observation note", "Photo"],
      safetyNote: "Stay on public footpaths and maintain spatial awareness.",
      audioScript: "Step outside calmly with your screen off.",
      steps: Array.from({ length: stepCount }, (_, i) => ({
        id: `step-${i + 1}`,
        instruction: `Investigation step number ${i + 1}`,
        evidence: "note" as const,
        required: i % 2 === 0,
      })),
    });

    for (const count of [4, 5, 6] as const) {
      it(`safely accesses all steps in a ${count}-step protocol without index errors`, () => {
        const protocol = makeProtocol(count);
        expect(protocol.steps.length).toBe(count);

        for (let i = 0; i < count; i++) {
          const step = protocol.steps[clampStepIndex(i, count)];
          expect(step).toBeDefined();
          expect(step.id).toBe(`step-${i + 1}`);
          expect(step.instruction).toContain(`step number ${i + 1}`);
          expect(["photo", "note", "count", "measurement"]).toContain(step.evidence);
          expect(typeof step.required).toBe("boolean");
        }
      });
    }
  });
});
