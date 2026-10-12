import { FieldProtocol, FieldReport } from "@/lib/schemas";

/**
 * Normalizes an evidence reference into standard hashtag notation (e.g. #step-1, #photo-canopy-1)
 */
export function formatEvidenceRef(ref: string): string {
  const trimmed = ref.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

/**
 * Formats a confidence level into human-readable label
 */
export function formatConfidenceLabel(confidence: "low" | "medium" | "high"): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
  }
}

/**
 * Serializes a FieldProtocol and FieldReport into clean, structured GitHub Flavored Markdown (GFM).
 */
export function formatReportMarkdown(protocol: FieldProtocol, report: FieldReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Field Investigation Report: ${protocol.title}`);
  lines.push("");

  // Research Question
  lines.push(`> **Research Question:** "${protocol.researchQuestion}"`);
  lines.push("");

  // Metadata Overview
  lines.push("## Study Overview");
  lines.push("");
  lines.push(`- **Study ID:** \`${protocol.id}\``);
  lines.push(`- **Investigation Type:** ${protocol.type}`);
  lines.push(`- **Duration Budget:** ${protocol.minutes} minutes`);
  if (protocol.safetyNote) {
    lines.push(`- **Safety Guidance:** ${protocol.safetyNote}`);
  }
  lines.push("");

  // Evidence Summary
  lines.push("### Evidence Summary");
  lines.push("");
  lines.push(`- **Photos:** ${report.evidenceSummary.photos}`);
  lines.push(`- **Notes:** ${report.evidenceSummary.notes}`);
  lines.push(`- **Measurements:** ${report.evidenceSummary.measurements}`);
  lines.push("");

  // Key Empirical Findings
  lines.push("## Key Empirical Findings");
  lines.push("");
  if (!report.findings || report.findings.length === 0) {
    lines.push("_No empirical findings recorded._");
    lines.push("");
  } else {
    report.findings.forEach((finding, index) => {
      lines.push(`### Finding ${String(index + 1).padStart(2, "0")}`);
      lines.push("");
      lines.push(`**Claim:** ${finding.claim}`);
      lines.push("");
      lines.push(`- **Confidence:** ${formatConfidenceLabel(finding.confidence)}`);
      const citations = finding.evidenceRefs.map(formatEvidenceRef).join(", ");
      lines.push(`- **Cited Evidence:** ${citations}`);
      lines.push("");
    });
  }

  // Three Honest Pillars
  lines.push("## Evidence Honesty Analysis");
  lines.push("");
  lines.push("### Observed");
  lines.push("_Direct empirical observations recorded during the study._");
  lines.push("");
  if (report.observed && report.observed.length > 0) {
    report.observed.forEach((item) => {
      lines.push(`- ${item}`);
    });
  } else {
    lines.push("_No direct factual observations were recorded._");
  }
  lines.push("");

  lines.push("### Inferred");
  lines.push("_Deductions, hypotheses, and patterns reasoned by AI from recorded evidence._");
  lines.push("");
  if (report.inferred && report.inferred.length > 0) {
    report.inferred.forEach((item) => {
      lines.push(`- ${item}`);
    });
  } else {
    lines.push("_No inferences were derived._");
  }
  lines.push("");

  lines.push("### Uncertain");
  lines.push("_Missing measurements, unverified claims, or empirical gaps._");
  lines.push("");
  if (report.uncertain && report.uncertain.length > 0) {
    report.uncertain.forEach((item) => {
      lines.push(`- ${item}`);
    });
  } else {
    lines.push("_All claimed steps had verifiable evidence._");
  }
  lines.push("");

  // Suggested Next Investigation
  if (report.nextQuestion) {
    lines.push("## Suggested Next Investigation");
    lines.push("");
    lines.push(`> "${report.nextQuestion}"`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Formats report and protocol into schema-compliant, pretty-printed JSON (2-space indent).
 */
export function formatReportJson(protocol: FieldProtocol, report: FieldReport): string {
  const data = {
    studyId: protocol.id,
    exportedAt: new Date().toISOString(),
    protocol,
    report,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Client-side file downloader using native Blob and temporary anchor element.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const urlHelper = window.URL || URL;
  const url = urlHelper.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  urlHelper.revokeObjectURL(url);
}

/**
 * Triggers download of the Field Report as a Markdown file.
 */
export function exportReportMarkdown(protocol: FieldProtocol, report: FieldReport): void {
  const markdown = formatReportMarkdown(protocol, report);
  downloadFile(`openfield-report-${protocol.id}.md`, markdown, "text/markdown;charset=utf-8");
}

/**
 * Triggers download of the Field Report as a JSON file.
 */
export function exportReportJson(protocol: FieldProtocol, report: FieldReport): void {
  const json = formatReportJson(protocol, report);
  downloadFile(`openfield-report-${protocol.id}.json`, json, "application/json;charset=utf-8");
}
