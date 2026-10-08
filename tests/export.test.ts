import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatEvidenceRef,
  formatConfidenceLabel,
  formatReportMarkdown,
  formatReportJson,
  downloadFile,
  exportReportMarkdown,
  exportReportJson,
} from "../src/lib/export";
import { FieldProtocol, FieldReport } from "../src/lib/schemas";

const sampleProtocol: FieldProtocol = {
  id: "study-tree-canopy-42",
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

const sampleReport: FieldReport = {
  findings: [
    {
      claim: "Direct sunlit asphalt feels significantly hotter than canopy-shaded ground.",
      evidenceRefs: ["step-1", "step-3"],
      confidence: "high",
    },
    {
      claim: "Mature maple leaves provide continuous overhead cover in photo 1.",
      evidenceRefs: ["photo-canopy-1", "#step-2"],
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
  nextQuestion: "How does surface moisture retention differ across tree species in this park?",
};

describe("Client-Side Report Export Utility", () => {
  describe("formatEvidenceRef", () => {
    it("adds # prefix when missing", () => {
      expect(formatEvidenceRef("step-1")).toBe("#step-1");
      expect(formatEvidenceRef("photo-canopy-1")).toBe("#photo-canopy-1");
    });

    it("preserves existing # prefix", () => {
      expect(formatEvidenceRef("#step-2")).toBe("#step-2");
      expect(formatEvidenceRef("#photo-1")).toBe("#photo-1");
    });

    it("trims whitespace before formatting", () => {
      expect(formatEvidenceRef("  step-3  ")).toBe("#step-3");
      expect(formatEvidenceRef("  #step-4 ")).toBe("#step-4");
    });
  });

  describe("formatConfidenceLabel", () => {
    it("maps confidence levels correctly", () => {
      expect(formatConfidenceLabel("high")).toBe("High confidence");
      expect(formatConfidenceLabel("medium")).toBe("Medium confidence");
      expect(formatConfidenceLabel("low")).toBe("Low confidence");
    });
  });

  describe("formatReportMarkdown", () => {
    it("structures header, research question, and study metadata cleanly", () => {
      const md = formatReportMarkdown(sampleProtocol, sampleReport);

      expect(md).toContain("# Field Investigation Report: Urban Tree Canopy Study");
      expect(md).toContain('> **Research Question:** "How does tree shade influence ambient ground conditions?"');
      expect(md).toContain("- **Study ID:** `study-tree-canopy-42`");
      expect(md).toContain("- **Investigation Type:** nature");
      expect(md).toContain("- **Duration Budget:** 30 minutes");
      expect(md).toContain("- **Safety Guidance:** Watch for uneven sidewalk roots before looking up.");
    });

    it("includes evidence summary counts", () => {
      const md = formatReportMarkdown(sampleProtocol, sampleReport);

      expect(md).toContain("### Evidence Summary");
      expect(md).toContain("- **Photos:** 2");
      expect(md).toContain("- **Notes:** 2");
      expect(md).toContain("- **Measurements:** 0");
    });

    it("renders findings with formatted claims, confidence, and hashtag evidence citations", () => {
      const md = formatReportMarkdown(sampleProtocol, sampleReport);

      expect(md).toContain("## Key Empirical Findings");
      expect(md).toContain("### Finding 01");
      expect(md).toContain("**Claim:** Direct sunlit asphalt feels significantly hotter than canopy-shaded ground.");
      expect(md).toContain("- **Confidence:** High confidence");
      expect(md).toContain("- **Cited Evidence:** #step-1, #step-3");

      expect(md).toContain("### Finding 02");
      expect(md).toContain("- **Confidence:** Medium confidence");
      expect(md).toContain("- **Cited Evidence:** #photo-canopy-1, #step-2");
    });

    it("clearly separates the three honest pillars: Observed, Inferred, and Uncertain", () => {
      const md = formatReportMarkdown(sampleProtocol, sampleReport);

      expect(md).toContain("## Evidence Honesty Analysis");
      expect(md).toContain("### Observed");
      expect(md).toContain("- Pavement warm to touch in sun at step 1.");
      expect(md).toContain("- Ground under canopy was cooler and damp at step 3.");

      expect(md).toContain("### Inferred");
      expect(md).toContain("- Dense canopy creates localized microclimate cooling of the surface.");

      expect(md).toContain("### Uncertain");
      expect(md).toContain("- No instrumented temperature readings were recorded to measure exact degrees.");
      expect(md).toContain("- Species classification is tentative from overhead foliage.");
    });

    it("handles empty findings and honest sections gracefully", () => {
      const emptyReport: FieldReport = {
        findings: [],
        observed: [],
        inferred: [],
        uncertain: [],
        evidenceSummary: { photos: 0, notes: 0, measurements: 0 },
        nextQuestion: "",
      };

      const md = formatReportMarkdown(sampleProtocol, emptyReport);

      expect(md).toContain("_No empirical findings recorded._");
      expect(md).toContain("_No direct factual observations were recorded._");
      expect(md).toContain("_No inferences were derived._");
      expect(md).toContain("_All claimed steps had verifiable evidence._");
      expect(md).not.toContain("## Suggested Next Investigation");
    });

    it("includes suggested next investigation when present", () => {
      const md = formatReportMarkdown(sampleProtocol, sampleReport);

      expect(md).toContain("## Suggested Next Investigation");
      expect(md).toContain('> "How does surface moisture retention differ across tree species in this park?"');
    });
  });

  describe("formatReportJson", () => {
    it("produces valid JSON containing protocol and report data", () => {
      const jsonStr = formatReportJson(sampleProtocol, sampleReport);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toBeTypeOf("object");
      expect(parsed.studyId).toBe(sampleProtocol.id);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.protocol).toEqual(sampleProtocol);
      expect(parsed.report).toEqual(sampleReport);
    });

    it("formats with 2-space indentation", () => {
      const jsonStr = formatReportJson(sampleProtocol, sampleReport);
      // Validates 2-space indentation by checking for line starting with 2 spaces
      expect(jsonStr).toMatch(/\n  "studyId":/);
      expect(jsonStr).toMatch(/\n  "protocol":/);
    });
  });

  describe("browser download handlers", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("safely does nothing in SSR when window is undefined", () => {
      expect(() => downloadFile("test.md", "content", "text/markdown")).not.toThrow();
    });

    it("triggers client-side anchor click with generated ObjectURL for Markdown", () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();

      const mockAnchor = {
        href: "",
        download: "",
        click: mockClick,
      };

      const originalWindow = (globalThis as unknown as { window: unknown }).window;
      const originalDocument = (globalThis as unknown as { document: unknown }).document;

      try {
        (globalThis as unknown as { window: unknown }).window = {
          URL: {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevokeObjectURL,
          },
        };
        (globalThis as unknown as { document: unknown }).document = {
          createElement: vi.fn().mockReturnValue(mockAnchor),
          body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          },
        };

        exportReportMarkdown(sampleProtocol, sampleReport);

        expect(mockCreateObjectURL).toHaveBeenCalledOnce();
        expect(mockAnchor.download).toBe(`openfield-report-${sampleProtocol.id}.md`);
        expect(mockClick).toHaveBeenCalledOnce();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
      } finally {
        (globalThis as unknown as { window: unknown }).window = originalWindow;
        (globalThis as unknown as { document: unknown }).document = originalDocument;
      }
    });

    it("triggers client-side anchor click with generated ObjectURL for JSON", () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url-json");
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();

      const mockAnchor = {
        href: "",
        download: "",
        click: mockClick,
      };

      const originalWindow = (globalThis as unknown as { window: unknown }).window;
      const originalDocument = (globalThis as unknown as { document: unknown }).document;

      try {
        (globalThis as unknown as { window: unknown }).window = {
          URL: {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevokeObjectURL,
          },
        };
        (globalThis as unknown as { document: unknown }).document = {
          createElement: vi.fn().mockReturnValue(mockAnchor),
          body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          },
        };

        exportReportJson(sampleProtocol, sampleReport);

        expect(mockCreateObjectURL).toHaveBeenCalledOnce();
        expect(mockAnchor.download).toBe(`openfield-report-${sampleProtocol.id}.json`);
        expect(mockClick).toHaveBeenCalledOnce();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url-json");
      } finally {
        (globalThis as unknown as { window: unknown }).window = originalWindow;
        (globalThis as unknown as { document: unknown }).document = originalDocument;
      }
    });
  });
});
