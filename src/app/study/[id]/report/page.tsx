"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FieldProtocol,
  FieldReport,
} from "@/lib/schemas";
import {
  getProtocol,
  getReport,
} from "@/lib/storage";
import { sanitizeDisplayText, formatPlural } from "@/lib/ui/sanitize";
import { StageTrail } from "@/components/ui/StageTrail";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import {
  Printer,
  CheckSquare,
  Lightbulb,
  Question,
  ArrowRight,
  ArrowLeft,
} from "@phosphor-icons/react";

export default function FieldReportPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [protocol, setProtocol] = useState<FieldProtocol | null>(null);
  const [report, setReport] = useState<FieldReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadedProtocol = getProtocol(id);
    const loadedReport = getReport(id);

    setProtocol(loadedProtocol);
    setReport(loadedReport);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-[#44504A] font-mono text-[15px]">
        Loading field report...
      </div>
    );
  }

  if (!protocol || !report) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#101613]">Report Not Found</h1>
        <p className="text-[15px] text-[#44504A]">
          We could not find a field report for study &ldquo;{id}&rdquo; in this browser.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          {protocol && (
            <Link href={`/study/${id}/return`}>
              <Button variant="primary">Submit Evidence</Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="secondary">Create New Study</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatConfidenceLabel = (confidence: "low" | "medium" | "high") => {
    switch (confidence) {
      case "high":
        return "High confidence";
      case "medium":
        return "Medium confidence";
      case "low":
        return "Low confidence";
    }
  };

  const photoCount = report.evidenceSummary?.photos ?? 0;
  const noteCount = report.evidenceSummary?.notes ?? 0;
  const measurementCount = report.evidenceSummary?.measurements ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16 print:py-0 print:space-y-6">
      {/* 4-Stage Survey Progress Trail */}
      <StageTrail currentStage="report" />

      {/* Screen Header */}
      <header className="space-y-4 border-b border-[#D3D9D3] pb-6">
        <div className="flex items-center justify-between no-print">
          <Link
            href={`/study/${id}`}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#44504A] hover:text-[#101613] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>View Protocol</span>
          </Link>
          <span className="text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
            FIELD REPORT
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#101613] leading-tight">
          Field Investigation Report: {sanitizeDisplayText(protocol.title)}
        </h1>

        {/* Question as quote */}
        <blockquote className="border-l-[3px] border-l-[#B8461A] pl-4 py-1">
          <span className="block text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
            Research Question
          </span>
          <p className="text-[18px] sm:text-[19px] font-medium text-[#101613] mt-0.5 leading-snug">
            &ldquo;{sanitizeDisplayText(protocol.researchQuestion)}&rdquo;
          </p>
        </blockquote>

        {/* Metadata line with correct plurals */}
        <div className="text-[13px] font-mono text-[#44504A] uppercase tracking-wider pt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{protocol.minutes} MIN STUDY</span>
          <span aria-hidden="true">/</span>
          <span>{formatPlural(photoCount, "photo")}</span>
          <span aria-hidden="true">/</span>
          <span>{formatPlural(noteCount, "note")}</span>
          <span aria-hidden="true">/</span>
          <span>{formatPlural(measurementCount, "measurement")}</span>
        </div>
      </header>

      {/* Findings: Ruled list (not cards) */}
      <section aria-labelledby="findings-heading" className="space-y-4">
        <h2
          id="findings-heading"
          className="text-[14px] font-mono uppercase tracking-wider text-[#44504A]"
        >
          Key Empirical Findings
        </h2>

        <ol className="divide-y divide-[#D3D9D3] border-y border-[#D3D9D3] list-none p-0 m-0">
          {report.findings.map((f, i) => (
            <li key={i} className="py-5 space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[14px] text-[#44504A] select-none">
                  FINDING {String(i + 1).padStart(2, "0")}
                </span>
                {/* Confidence as a plain text label, no colored pills or bars */}
                <span className="text-[13px] font-mono text-[#44504A]">
                  {formatConfidenceLabel(f.confidence)}
                </span>
              </div>

              {/* Claim at 18-20px */}
              <p className="text-[18px] sm:text-[20px] font-medium text-[#101613] leading-snug">
                {sanitizeDisplayText(f.claim)}
              </p>

              {/* Evidence references as mono outlined tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[12px] font-mono text-[#44504A] uppercase tracking-wider">
                  Cited Evidence:
                </span>
                {f.evidenceRefs.map((ref) => (
                  <Tag key={ref} variant="dim">
                    {ref}
                  </Tag>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Signature Honesty Section: Three stacked blocks differing by line style, icon, and structural note */}
      <section aria-labelledby="honesty-heading" className="space-y-6 pt-4">
        <div className="border-b border-[#D3D9D3] pb-3">
          <h2
            id="honesty-heading"
            className="text-[14px] font-mono uppercase tracking-wider text-[#101613] font-semibold"
          >
            Evidence Honesty Analysis
          </h2>
          <p className="text-[14px] text-[#44504A] mt-1">
            Separating recorded facts, synthetic deductions, and empirical gaps.
          </p>
        </div>

        <div className="space-y-6">
          {/* OBSERVED: Solid 2px ink left border, check icon, full width */}
          <div className="p-5 sm:p-6 bg-[#FAFBF9] border border-[#D3D9D3] border-l-[3px] border-l-[#101613] rounded-[4px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#101613] font-semibold text-[16px]">
                <CheckSquare size={20} weight="bold" />
                <span className="font-mono uppercase tracking-wider text-[14px]">OBSERVED</span>
              </div>
              <span className="text-[12px] font-mono text-[#44504A] italic">
                You saw or counted this
              </span>
            </div>
            {report.observed.length > 0 ? (
              <ul className="space-y-2 list-none p-0 text-[16px] text-[#101613] leading-relaxed">
                {report.observed.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-[#44504A] select-none text-[13px] mt-1">
                      -
                    </span>
                    <span>{sanitizeDisplayText(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-[#44504A] italic">No direct factual observations were recorded.</p>
            )}
          </div>

          {/* INFERRED & UNCERTAIN: Side by side on wide screens, stacked on small */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INFERRED: Dashed 2px ink border, lightbulb icon */}
            <div className="p-5 sm:p-6 bg-[#FAFBF9] border border-dashed border-[#101613] border-l-[3px] rounded-[4px] space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 text-[#101613] font-semibold text-[16px]">
                  <Lightbulb size={20} weight="bold" />
                  <span className="font-mono uppercase tracking-wider text-[14px]">INFERRED</span>
                </div>
                <span className="text-[12px] font-mono text-[#44504A] italic">
                  The AI reasoned this from your evidence
                </span>
              </div>
              {report.inferred.length > 0 ? (
                <ul className="space-y-2 list-none p-0 text-[15px] text-[#101613] leading-relaxed">
                  {report.inferred.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-[#44504A] select-none text-[13px] mt-1">
                        -
                      </span>
                      <span>{sanitizeDisplayText(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-[#44504A] italic">No inferences were derived.</p>
              )}
            </div>

            {/* UNCERTAIN: Dotted 2px ink border + faint diagonal hatch, question icon */}
            <div className="p-5 sm:p-6 bg-[#FAFBF9] bg-hatch border border-dotted border-[#101613] border-l-[3px] rounded-[4px] space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 text-[#101613] font-semibold text-[16px]">
                  <Question size={20} weight="bold" />
                  <span className="font-mono uppercase tracking-wider text-[14px]">UNCERTAIN</span>
                </div>
                <span className="text-[12px] font-mono text-[#44504A] italic">
                  Missing or unverified
                </span>
              </div>
              {report.uncertain.length > 0 ? (
                <ul className="space-y-2 list-none p-0 text-[15px] text-[#101613] leading-relaxed">
                  {report.uncertain.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-[#44504A] select-none text-[13px] mt-1">
                        -
                      </span>
                      <span>{sanitizeDisplayText(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-[#44504A] italic">All claimed steps had verifiable evidence.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Next Investigation as a quiet large-type quote with a signal rule */}
      {report.nextQuestion && (
        <section aria-labelledby="next-investigation-heading" className="pt-4">
          <div className="border-l-[3px] border-l-[#B8461A] pl-5 py-2 space-y-1">
            <h2
              id="next-investigation-heading"
              className="text-[12px] font-mono uppercase tracking-wider text-[#44504A]"
            >
              Suggested Next Investigation
            </h2>
            <p className="text-[19px] sm:text-[21px] font-medium text-[#101613] leading-snug">
              &ldquo;{sanitizeDisplayText(report.nextQuestion)}&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* Actions: Print / Save Report, View Protocol, Start a New Study */}
      <footer className="pt-8 border-t border-[#D3D9D3] no-print">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => window.print()}
            className="flex-1"
          >
            <Printer size={18} />
            <span>Print / Save Report</span>
          </Button>

          <Link href={`/study/${id}`} className="flex-1">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <span>View Protocol</span>
            </Button>
          </Link>

          <Link href="/" className="flex-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
            >
              <span>Start New Study</span>
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
