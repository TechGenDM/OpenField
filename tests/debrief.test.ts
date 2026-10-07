import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  stripBase64Header,
  validateReportQuality,
  validateRawReport,
  createReport,
} from "../src/lib/ai/debrief";
import { FieldProtocol, Observation, FieldReport } from "../src/lib/schemas";
import { ollama } from "../src/lib/ai/ollama";

// Sample valid protocol for testing
const sampleProtocol: FieldProtocol = {
  id: "proto-123",
  title: "Urban Tree Canopy Study",
  researchQuestion: "How does tree shade influence ambient ground conditions?",
  minutes: 30,
  type: "nature",
  steps: [
    {
      id: "step-1",
      instruction: "Find an unshaded sidewalk spot and note surface warmth.",
      evidence: "note",
      required: true,
    },
    {
      id: "step-2",
      instruction: "Take a wide photo of the surrounding tree canopy.",
      evidence: "photo",
      required: true,
    },
    {
      id: "step-3",
      instruction: "Find a spot under dense canopy and record observations.",
      evidence: "note",
      required: true,
    },
    {
      id: "step-4",
      instruction: "Photograph leaf density looking directly up.",
      evidence: "photo",
      required: true,
    },
  ],
  evidenceNeeded: ["2 notes", "2 photos"],
  safetyNote: "Watch for uneven sidewalk roots before looking up.",
  audioScript: "Briefing for tree canopy investigation.",
};

const sampleObservations: Observation[] = [
  { stepId: "step-1", note: "Pavement felt warm to touch in direct sun." },
  { stepId: "step-2", photoIds: ["photo-canopy-1"] },
  { stepId: "step-3", note: "Ground was noticeably cooler and damp." },
  { stepId: "step-4", photoIds: ["photo-leaves-2"] },
];

const samplePhotos = [
  { id: "photo-canopy-1", dataUrl: "data:image/jpeg;base64,dGVzdC1jYW5vcHk=" },
  { id: "photo-leaves-2", dataUrl: "data:image/jpeg;base64,dGVzdC1sZWF2ZXM=" },
];

const sampleValidReport: FieldReport = {
  findings: [
    {
      claim: "Direct sunlit asphalt feels hotter than canopy-shaded ground.",
      evidenceRefs: ["step-1", "step-3"],
      confidence: "high",
    },
    {
      claim: "Mature maple leaves provide continuous overhead cover in photo 1.",
      evidenceRefs: ["photo-canopy-1", "step-2"],
      confidence: "medium",
    },
  ],
  observed: [
    "Pavement warm to touch in sun at step 1.",
    "Ground under canopy was cooler and damp at step 3.",
    "Two canopy photos captured.",
  ],
  inferred: [
    "Dense canopy creates localized microclimate cooling of the surface.",
  ],
  uncertain: [
    "No instrumented temperature readings were recorded to measure exact degrees.",
    "Species classification is tentative from overhead foliage.",
  ],
  evidenceSummary: {
    photos: 2,
    notes: 2,
    measurements: 0,
  },
  nextQuestion:
    "How does surface moisture retention differ across tree species in this park?",
};

describe("Debrief & Field Report Generation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("stripBase64Header", () => {
    it("strips jpeg base64 header prefix", () => {
      const dataUrl = "data:image/jpeg;base64,ABC123XYZ";
      expect(stripBase64Header(dataUrl)).toBe("ABC123XYZ");
    });

    it("strips png base64 header prefix", () => {
      const dataUrl = "data:image/png;base64,HELLO_WORLD";
      expect(stripBase64Header(dataUrl)).toBe("HELLO_WORLD");
    });

    it("returns raw string unchanged if no data URL header exists", () => {
      const raw = "ALREADY_RAW_BASE64";
      expect(stripBase64Header(raw)).toBe("ALREADY_RAW_BASE64");
    });
  });

  describe("validateReportQuality (Deterministic Honesty & Citation Checks)", () => {
    const validStepIds = ["step-1", "step-2", "step-3", "step-4"];
    const validPhotoIds = ["photo-canopy-1", "photo-leaves-2"];

    it("accepts a report where all evidence references match valid step or photo IDs", () => {
      const result = validateReportQuality(
        sampleValidReport,
        validStepIds,
        validPhotoIds
      );
      expect(result.ok).toBe(true);
    });

    it("rejects a report citing a hallucinated step ID", () => {
      const invalidReport: FieldReport = {
        ...sampleValidReport,
        findings: [
          {
            claim: "Unverified claim citing missing step.",
            evidenceRefs: ["step-99"],
            confidence: "low",
          },
        ],
      };

      const result = validateReportQuality(
        invalidReport,
        validStepIds,
        validPhotoIds
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("Invalid evidence reference \"step-99\"");
      }
    });

    it("rejects a report citing an unknown photo ID", () => {
      const invalidReport: FieldReport = {
        ...sampleValidReport,
        findings: [
          {
            claim: "Foliage looks diseased in photo 5.",
            evidenceRefs: ["photo-999"],
            confidence: "medium",
          },
        ],
      };

      const result = validateReportQuality(
        invalidReport,
        validStepIds,
        validPhotoIds
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("Invalid evidence reference \"photo-999\"");
      }
    });

    it("rejects a finding with empty evidence references", () => {
      const invalidReport: FieldReport = {
        ...sampleValidReport,
        findings: [
          {
            claim: "A claim without any evidence cite.",
            evidenceRefs: [],
            confidence: "low",
          },
        ],
      };

      const result = validateReportQuality(
        invalidReport,
        validStepIds,
        validPhotoIds
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("does not cite any evidence references");
      }
    });

    it("rejects a report with empty nextQuestion", () => {
      const invalidReport: FieldReport = {
        ...sampleValidReport,
        nextQuestion: "   ",
      };

      const result = validateReportQuality(
        invalidReport,
        validStepIds,
        validPhotoIds
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("missing a follow-up research question");
      }
    });
  });

  describe("validateRawReport", () => {
    const validStepIds = ["step-1", "step-2", "step-3", "step-4"];
    const validPhotoIds = ["photo-canopy-1", "photo-leaves-2"];

    it("parses and validates valid raw JSON", () => {
      const raw = JSON.stringify(sampleValidReport);
      const res = validateRawReport(raw, validStepIds, validPhotoIds);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.findings.length).toBe(2);
        expect(res.data.observed.length).toBe(3);
        expect(res.data.inferred.length).toBe(1);
        expect(res.data.uncertain.length).toBe(2);
      }
    });

    it("fails on malformed JSON", () => {
      const res = validateRawReport("not json", validStepIds, validPhotoIds);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("JSON parse error");
      }
    });

    it("fails if required honesty sections are missing from schema", () => {
      const incomplete = { ...sampleValidReport };
      delete (incomplete as Record<string, unknown>).uncertain;

      const res = validateRawReport(
        JSON.stringify(incomplete),
        validStepIds,
        validPhotoIds
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("uncertain");
      }
    });
  });

  describe("createReport with Mocked Ollama", () => {
    it("successfully creates a report and passes raw images to Ollama", async () => {
      const chatSpy = vi.spyOn(ollama, "chat").mockResolvedValueOnce({
        message: {
          role: "assistant",
          content: JSON.stringify(sampleValidReport),
        },
      } as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      const res = await createReport({
        protocol: sampleProtocol,
        observations: sampleObservations,
        photos: samplePhotos,
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.report.findings.length).toBe(2);
        expect(res.report.nextQuestion).toBe(sampleValidReport.nextQuestion);
      }

      expect(chatSpy).toHaveBeenCalledTimes(1);
      const callArgs = chatSpy.mock.calls[0][0];
      const userMsg = callArgs.messages?.find((m) => m.role === "user");
      expect(userMsg).toBeDefined();
      // Verifies stripped base64 images passed to ollama vision
      expect(userMsg?.images).toEqual(["dGVzdC1jYW5vcHk=", "dGVzdC1sZWF2ZXM="]);
    });

    it("retries once when initial output violates citation checks, then succeeds", async () => {
      // First attempt outputs invalid citation "step-unknown"
      const invalidReportAttempt = {
        ...sampleValidReport,
        findings: [
          {
            claim: "First attempt claim with bad ref",
            evidenceRefs: ["step-unknown"],
            confidence: "low",
          },
        ],
      };

      const chatSpy = vi
        .spyOn(ollama, "chat")
        .mockResolvedValueOnce({
          message: {
            role: "assistant",
            content: JSON.stringify(invalidReportAttempt),
          },
        } as unknown as Awaited<ReturnType<typeof ollama.chat>>)
        .mockResolvedValueOnce({
          message: {
            role: "assistant",
            content: JSON.stringify(sampleValidReport),
          },
        } as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      const res = await createReport({
        protocol: sampleProtocol,
        observations: sampleObservations,
        photos: samplePhotos,
      });

      expect(res.success).toBe(true);
      expect(chatSpy).toHaveBeenCalledTimes(2);

      // Verify retry prompt included error details
      const retryCallArgs = chatSpy.mock.calls[1][0];
      const retryMsg = retryCallArgs.messages?.find((m) => m.role === "user");
      expect(retryMsg?.content).toContain("step-unknown");
    });

    it("returns typed INVALID_MODEL_OUTPUT error when both attempts fail", async () => {
      const invalidReportAttempt = {
        ...sampleValidReport,
        findings: [
          {
            claim: "Claim with persistent bad ref",
            evidenceRefs: ["step-never-existed"],
            confidence: "low",
          },
        ],
      };

      vi.spyOn(ollama, "chat")
        .mockResolvedValueOnce({
          message: {
            role: "assistant",
            content: JSON.stringify(invalidReportAttempt),
          },
        } as unknown as Awaited<ReturnType<typeof ollama.chat>>)
        .mockResolvedValueOnce({
          message: {
            role: "assistant",
            content: JSON.stringify(invalidReportAttempt),
          },
        } as unknown as Awaited<ReturnType<typeof ollama.chat>>);

      const res = await createReport({
        protocol: sampleProtocol,
        observations: sampleObservations,
        photos: samplePhotos,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("INVALID_MODEL_OUTPUT");
        expect(res.error.details).toContain("step-never-existed");
      }
    });

    it("returns typed OLLAMA_UNREACHABLE error when connection fails", async () => {
      vi.spyOn(ollama, "chat").mockRejectedValueOnce(
        new Error("connect ECONNREFUSED 127.0.0.1:11434")
      );

      const res = await createReport({
        protocol: sampleProtocol,
        observations: sampleObservations,
        photos: samplePhotos,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe("OLLAMA_UNREACHABLE");
      }
    });
  });
});
