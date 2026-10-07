"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FieldProtocol } from "@/lib/schemas";
import { getProtocol } from "@/lib/storage";
import { sanitizeDisplayText } from "@/lib/ui/sanitize";
import { StageTrail } from "@/components/ui/StageTrail";
import { Tag } from "@/components/ui/Tag";
import { Callout } from "@/components/ui/Callout";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Printer, ArrowRight, SpeakerHigh, StopCircle } from "@phosphor-icons/react";

export default function ProtocolPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [protocol, setProtocol] = useState<FieldProtocol | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Audio SpeechSynthesis state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (id) {
      const loaded = getProtocol(id);
      setProtocol(loaded);
      setHasLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!speechSupported || !protocol?.audioScript) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(protocol.audioScript);
      utterance.rate = 0.95; // calm, unhurried cadence
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  if (!hasLoaded) {
    return (
      <div className="py-16 text-center text-[#44504A] font-mono text-[15px]">
        Loading field protocol...
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-[#101613]">Protocol not found</h2>
        <p className="text-[15px] text-[#44504A]">
          No saved protocol found on this device with ID &quot;{id}&quot;. Protocols are stored
          locally in your browser.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary">Create New Study</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 sm:pb-8">
      {/* 4-Stage Survey Progress Trail */}
      <StageTrail currentStage="plan" />

      {/* Navigation header (hidden on print) */}
      <div className="flex items-center justify-between no-print border-b border-[#D3D9D3] pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[#44504A] hover:text-[#101613] transition-colors focus-visible:outline-2 focus-visible:outline-[#B8461A]"
        >
          <ArrowLeft size={16} />
          <span>Back to Create Study</span>
        </Link>
        <span className="text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
          SURVEY PROTOCOL
        </span>
      </div>

      {/* Printable Field Card sheet */}
      <article className="field-card bg-[#FAFBF9] border border-[#D3D9D3] rounded-[4px] p-6 sm:p-8 space-y-8">
        {/* Header & Meta in Mono */}
        <header className="space-y-4 border-b border-[#D3D9D3] pb-6">
          <div className="flex flex-wrap items-center gap-3 text-[13px] font-mono text-[#44504A] uppercase tracking-wider">
            <span>{protocol.minutes} MIN</span>
            <span aria-hidden="true">/</span>
            <span className="capitalize">{protocol.type}</span>
            <span aria-hidden="true">/</span>
            <span>{protocol.steps.length} STEPS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-[#101613] tracking-tight leading-tight">
            {sanitizeDisplayText(protocol.title)}
          </h1>

          {/* Research Question as a Quote with a Signal Rule */}
          <blockquote className="border-l-[3px] border-l-[#B8461A] pl-4 py-1">
            <span className="block text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
              Research Question
            </span>
            <p className="text-[18px] sm:text-[19px] font-medium text-[#101613] mt-1 leading-snug">
              &ldquo;{sanitizeDisplayText(protocol.researchQuestion)}&rdquo;
            </p>
          </blockquote>
        </header>

        {/* Safety Note labeled "Before you go" with warning icon & signal border */}
        <section aria-labelledby="safety-heading">
          <Callout
            title="Before you go"
            variant="signal"
          >
            <p className="text-[#101613] leading-relaxed">
              {sanitizeDisplayText(protocol.safetyNote)}
            </p>
          </Callout>
        </section>

        {/* Steps as numbered ruled list with big mono numerals */}
        <section aria-labelledby="steps-heading" className="space-y-4">
          <h2
            id="steps-heading"
            className="text-[14px] font-mono uppercase tracking-wider text-[#44504A]"
          >
            Investigation Steps
          </h2>

          <ol className="divide-y divide-[#D3D9D3] border-y border-[#D3D9D3] list-none p-0 m-0">
            {protocol.steps.map((step, idx) => (
              <li
                key={step.id || idx}
                className="py-5 flex items-start gap-4 sm:gap-6"
              >
                <span className="font-mono text-2xl sm:text-3xl font-semibold text-[#44504A] shrink-0 w-8 select-none">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 space-y-2.5 text-left">
                  <p className="text-[18px] text-[#101613] leading-relaxed font-normal">
                    {sanitizeDisplayText(step.instruction)}
                  </p>

                  <div>
                    <Tag variant={step.required ? "signal" : "default"}>
                      {step.evidence.toUpperCase()}
                      {step.required ? ", required" : ", optional"}
                    </Tag>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Evidence Checklist */}
        <section aria-labelledby="evidence-heading" className="space-y-3 pt-2">
          <h2
            id="evidence-heading"
            className="text-[14px] font-mono uppercase tracking-wider text-[#44504A]"
          >
            Evidence Checklist
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[15px] text-[#101613] list-none p-0">
            {protocol.evidenceNeeded.map((ev, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-[2px] border border-[#44504A] inline-block shrink-0" />
                <span>{sanitizeDisplayText(ev)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Spoken Audio Briefing & Script Preview */}
        {protocol.audioScript && (
          <section aria-labelledby="briefing-heading" className="pt-2 no-print">
            <div className="border border-[#D3D9D3] rounded-[4px] bg-[#FAFBF9] overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D3D9D3]">
                <div className="flex items-center gap-2">
                  <SpeakerHigh size={18} className="text-[#101613]" />
                  <h2
                    id="briefing-heading"
                    className="text-[14px] font-mono uppercase tracking-wider text-[#101613] font-medium"
                  >
                    Audio Briefing
                  </h2>
                </div>

                {speechSupported && (
                  <Button
                    type="button"
                    variant={isPlayingAudio ? "primary" : "secondary"}
                    size="sm"
                    onClick={toggleSpeech}
                  >
                    {isPlayingAudio ? (
                      <>
                        <StopCircle size={16} />
                        <span>Stop briefing</span>
                      </>
                    ) : (
                      <>
                        <SpeakerHigh size={16} />
                        <span>Listen to briefing</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="p-4 bg-[#FAFBF9] space-y-1.5">
                <span className="block text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
                  Spoken Script Preview
                </span>
                <p className="text-[16px] text-[#44504A] leading-relaxed italic">
                  &ldquo;{sanitizeDisplayText(protocol.audioScript)}&rdquo;
                </p>
              </div>
            </div>
          </section>
        )}
      </article>

      {/* Action Buttons (Screen 2: Save Field Card & Start Field Study) */}
      <div className="no-print">
        {/* Desktop inline & Mobile sticky bottom bar */}
        <div className="sm:static fixed bottom-0 left-0 right-0 p-4 bg-[#FAFBF9]/95 backdrop-blur-sm sm:backdrop-blur-none border-t border-[#D3D9D3] sm:border-0 sm:p-0 sm:bg-transparent z-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              window.print();
            }}
            className="flex-1"
          >
            <Printer size={18} />
            <span>Save Field Card</span>
          </Button>

          <Link
            href={`/study/${protocol.id}/field`}
            className="flex-1"
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full"
            >
              <span>Start Field Study</span>
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>

        <p className="text-[13px] text-center text-[#44504A] mt-3 hidden sm:block">
          Before heading outside: print or save your Field Card. No internet needed outdoors.
        </p>
      </div>
    </div>
  );
}
