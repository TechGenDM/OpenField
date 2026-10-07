"use client";

import { useEffect, useState } from "react";
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">Loading field report...</p>
      </div>
    );
  }

  if (!protocol || !report) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-zinc-900">Report Not Found</h1>
        <p className="text-sm text-zinc-600">
          We could not find a field report for study &ldquo;{id}&rdquo; in this browser.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          {protocol && (
            <Link
              href={`/study/${id}/return`}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 transition"
            >
              Submit Evidence on Return Screen
            </Link>
          )}
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Create New Study
          </Link>
        </div>
      </div>
    );
  }

  const confidenceBadge = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            High Confidence
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            Medium Confidence
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
            Low Confidence
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 print:py-0 print:space-y-4">
      {/* Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>Screen 5 of 5 &bull; Field Report</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            ID: {protocol.id.slice(0, 8)}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
          {protocol.title}
        </h1>
        <p className="text-base text-zinc-700 font-medium">
          Research Question: &ldquo;{protocol.researchQuestion}&rdquo;
        </p>
      </div>

      {/* Meta + Evidence Summary Pill */}
      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-zinc-600">
          <span>{protocol.minutes} Minutes</span>
          <span>&bull;</span>
          <span className="capitalize">{protocol.type} Study</span>
        </div>

        <div className="flex items-center gap-3 font-medium text-zinc-800">
          <span className="inline-flex items-center gap-1">
            <strong>{report.evidenceSummary.photos}</strong> photos
          </span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1">
            <strong>{report.evidenceSummary.notes}</strong> notes
          </span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1">
            <strong>{report.evidenceSummary.measurements}</strong> measurements
          </span>
        </div>
      </div>

      {/* Section 1: Findings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Key Findings &amp; Evidence Citations
          </h2>
          <span className="text-xs text-zinc-500">
            {report.findings.length} findings
          </span>
        </div>

        <div className="space-y-3">
          {report.findings.map((finding, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-950 flex-1">
                  {finding.claim}
                </p>
                {confidenceBadge(finding.confidence)}
              </div>

              {/* Citations */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-500 font-medium mr-1">
                  Cited Evidence:
                </span>
                {finding.evidenceRefs.map((ref, rIdx) => (
                  <span
                    key={rIdx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200/60"
                  >
                    #{ref}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: The Three Honest AI Pillars */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Honest Evidence Breakdown
          </h2>
          <p className="text-xs text-zinc-500">
            OpenField strictly separates observed reality from AI reasoning and unanswered gaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Observed */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Observed
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] text-emerald-800 leading-tight">
              Directly witnessed, counted, or recorded by the user during the study.
            </p>
            <ul className="space-y-2 text-xs text-emerald-950 flex-1 pt-1 list-disc list-inside">
              {report.observed.length > 0 ? (
                report.observed.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-emerald-800/80 list-none">
                  No direct observations recorded.
                </li>
              )}
            </ul>
          </div>

          {/* Pillar 2: Inferred */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Inferred
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-[11px] text-blue-800 leading-tight">
              AI deductions and hypotheses based on collected patterns.
            </p>
            <ul className="space-y-2 text-xs text-blue-950 flex-1 pt-1 list-disc list-inside">
              {report.inferred.length > 0 ? (
                report.inferred.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-blue-800/80 list-none">
                  No inferences drawn.
                </li>
              )}
            </ul>
          </div>

          {/* Pillar 3: Uncertain */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Uncertain
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Missing measurements, gaps in evidence, and unverified elements.
            </p>
            <ul className="space-y-2 text-xs text-amber-950 flex-1 pt-1 list-disc list-inside">
              {report.uncertain.length > 0 ? (
                report.uncertain.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-amber-800/80 list-none">
                  No uncertainties recorded.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Next Research Question */}
      <div className="p-5 rounded-2xl bg-zinc-950 text-white space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span>Next Investigation</span>
        </div>
        <h3 className="text-base font-bold text-white">
          &ldquo;{report.nextQuestion}&rdquo;
        </h3>
        <p className="text-xs text-zinc-400">
          Suggested follow-up study based on the uncertainties and evidence gathered during this study.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print / Save Report</span>
          </button>
          <Link
            href={`/study/${protocol.id}`}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-medium text-zinc-700 transition"
          >
            View Protocol
          </Link>
        </div>

        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition shadow-sm"
        >
          Start a New Study &rarr;
        </Link>
      </div>
    </div>
  );
}
