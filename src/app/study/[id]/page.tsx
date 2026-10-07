"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FieldProtocol } from "@/lib/schemas";
import { getProtocol } from "@/lib/storage";

export default function ProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [protocol, setProtocol] = useState<FieldProtocol | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      const loaded = getProtocol(id);
      setProtocol(loaded);
      setHasLoaded(true);
    }
  }, [id]);

  if (!hasLoaded) {
    return (
      <div className="py-12 text-center text-zinc-500 text-base">
        Loading protocol...
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Protocol not found</h2>
        <p className="text-zinc-600 text-sm max-w-md mx-auto">
          No saved protocol found on this device with ID &quot;{id}&quot;. Protocols are stored
          locally in your browser.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition"
        >
          Create New Study
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation header (hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition"
        >
          &larr; Back to Create Study
        </Link>
        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
          Screen 2: Field Protocol
        </span>
      </div>

      {/* Main Field Card container (print-friendly) */}
      <article className="field-card bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <header className="border-b border-zinc-100 pb-5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 text-white">
              {protocol.type}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
              {protocol.minutes} Minutes
            </span>
            <span className="text-xs text-zinc-500 ml-auto">
              {protocol.steps.length} Steps
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            {protocol.title}
          </h1>

          <div className="pt-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Research Question
            </h2>
            <p className="text-lg font-medium text-zinc-900 mt-0.5">
              {protocol.researchQuestion}
            </p>
          </div>
        </header>

        {/* Safety Note (Mandatory SPEC Section 6) */}
        <section
          aria-labelledby="safety-heading"
          className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-950 text-sm space-y-1"
        >
          <div className="flex items-center gap-2 font-bold text-amber-900" id="safety-heading">
            <svg
              className="w-4 h-4 text-amber-700 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Outdoor Safety Note</span>
          </div>
          <p className="text-amber-900 leading-relaxed">
            {protocol.safetyNote}
          </p>
        </section>

        {/* Concrete Steps (4 to 6 steps) */}
        <section aria-labelledby="steps-heading" className="space-y-3">
          <h2
            id="steps-heading"
            className="text-base font-bold text-zinc-950 uppercase tracking-wider"
          >
            Investigation Protocol
          </h2>

          <ol className="space-y-3 list-none p-0">
            {protocol.steps.map((step, idx) => (
              <li
                key={step.id || idx}
                className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-start gap-3.5"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 text-white text-sm font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>

                <div className="flex-1 space-y-2">
                  <p className="text-base text-zinc-900 leading-snug font-medium">
                    {step.instruction}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-semibold">
                      Evidence: {step.evidence}
                    </span>
                    {step.required ? (
                      <span className="text-emerald-800 font-medium">
                        Required
                      </span>
                    ) : (
                      <span className="text-zinc-600">Optional</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Evidence Needed Checklist */}
        <section aria-labelledby="evidence-heading" className="space-y-2 pt-2 border-t border-zinc-100">
          <h2
            id="evidence-heading"
            className="text-xs font-bold text-zinc-600 uppercase tracking-wider"
          >
            Evidence Checklist
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-800">
            {protocol.evidenceNeeded.map((ev, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded border border-zinc-400 inline-block shrink-0" />
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Spoken Briefing Script Preview */}
        {protocol.audioScript && (
          <section aria-labelledby="briefing-heading" className="space-y-1.5 pt-2 border-t border-zinc-100">
            <h2
              id="briefing-heading"
              className="text-xs font-bold text-zinc-600 uppercase tracking-wider"
            >
              Spoken Audio Briefing Script
            </h2>
            <p className="text-sm italic text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-200/80 leading-relaxed">
              &ldquo;{protocol.audioScript}&rdquo;
            </p>
          </section>
        )}
      </article>

      {/* Action Buttons (Screen 2 MVP: Start Study & Save Field Card) */}
      <div className="space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-3.5 px-4 rounded-xl border-2 border-zinc-900 bg-white text-zinc-900 font-semibold text-base hover:bg-zinc-100 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg
              className="w-5 h-5 text-zinc-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Save Field Card (Print / PDF)</span>
          </button>

          <Link
            href={`/study/${protocol.id}/field`}
            className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 text-white font-semibold text-base hover:bg-zinc-800 transition flex items-center justify-center gap-2 shadow-sm text-center"
          >
            <span>Start Field Study (Field Mode)</span>
            <span className="text-xs bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full font-medium">
              Screen 3
            </span>
          </Link>
        </div>

        <p className="text-xs text-center text-zinc-500">
          Before heading outside: print or save your Field Card. No internet needed outdoors.
        </p>
      </div>
    </div>
  );
}
