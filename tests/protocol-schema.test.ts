import { describe, it, expect } from "vitest";
import { FieldProtocolSchema } from "../src/lib/schemas";

describe("FieldProtocolSchema step count constraints", () => {
  const baseValidProtocol = {
    id: "test-protocol-123",
    title: "Urban Bird Song Activity",
    researchQuestion: "Which bird species are calling at morning twilight?",
    minutes: 30,
    type: "sound",
    evidenceNeeded: ["Audio note", "Photo of tree canopy"],
    safetyNote: "Stay on public footpaths and remain aware of surrounding traffic.",
    audioScript: "Step outside calmly. Find a comfortable bench or safe sidewalk.",
  };

  const createSteps = (count: number) =>
    Array.from({ length: count }, (_, idx) => ({
      id: `step-${idx + 1}`,
      instruction: `Investigate zone ${idx + 1} for bird chirps.`,
      evidence: "note" as const,
      required: true,
    }));

  it("rejects a protocol with 2 steps (fewer than minimum of 4)", () => {
    const invalid = {
      ...baseValidProtocol,
      steps: createSteps(2),
    };

    const result = FieldProtocolSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 4 steps");
    }
  });

  it("rejects a protocol with 9 steps (more than maximum of 6)", () => {
    const invalid = {
      ...baseValidProtocol,
      steps: createSteps(9),
    };

    const result = FieldProtocolSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at most 6 steps");
    }
  });

  it("accepts a protocol with exactly 4 steps", () => {
    const valid = {
      ...baseValidProtocol,
      steps: createSteps(4),
    };

    const result = FieldProtocolSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts a protocol with exactly 6 steps", () => {
    const valid = {
      ...baseValidProtocol,
      steps: createSteps(6),
    };

    const result = FieldProtocolSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
