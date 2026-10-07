"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FieldProtocol } from "@/lib/schemas";
import { getProtocol } from "@/lib/storage";
import { formatTimer, calculateRemainingSeconds, clampStepIndex } from "@/lib/timer";
import { sanitizeDisplayText } from "@/lib/ui/sanitize";
import { ArrowLeft, ArrowRight, SpeakerHigh, StopCircle, CaretDown } from "@phosphor-icons/react";

export default function FieldModePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [protocol, setProtocol] = useState<FieldProtocol | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Current step index
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Timer state derived from target end timestamp
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [, setIsTimeUp] = useState(false);
  const targetEndTimeRef = useRef<number | null>(null);

  // Audio SpeechSynthesis state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioScriptOpen, setAudioScriptOpen] = useState(false);

  // 1. Load protocol from browser storage
  useEffect(() => {
    if (id) {
      const loaded = getProtocol(id);
      setProtocol(loaded);
      if (loaded) {
        const totalSec = loaded.minutes * 60;
        setRemainingSeconds(totalSec);
        targetEndTimeRef.current = Date.now() + totalSec * 1000;
      }
      setHasLoaded(true);
    }
  }, [id]);

  // 2. Derive timer from timestamp to prevent background drift
  useEffect(() => {
    if (!protocol || targetEndTimeRef.current === null) return;

    const interval = setInterval(() => {
      if (targetEndTimeRef.current === null) return;
      const left = calculateRemainingSeconds(targetEndTimeRef.current, Date.now());
      setRemainingSeconds(left);
      if (left <= 0) {
        setIsTimeUp(true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [protocol]);

  // 3. Browser SpeechSynthesis check and cleanup
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
      <div className="min-h-[100dvh] bg-[#0B0F0D] text-[#98A39C] flex items-center justify-center p-6 font-mono text-[15px]">
        Loading Field Mode...
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0F0D] text-[#F2F4F1] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Protocol Not Found</h1>
        <p className="text-[15px] text-[#98A39C] max-w-sm">
          No saved study found with ID &ldquo;{id}&rdquo; in local browser memory.
        </p>
        <Link
          href="/"
          className="mt-4 px-5 py-3 rounded-[4px] bg-[#F0804A] text-[#0B0F0D] font-medium text-[16px]"
        >
          Return to Create Study
        </Link>
      </div>
    );
  }

  const stepsCount = protocol.steps.length;
  const currentStep = protocol.steps[clampStepIndex(currentStepIdx, stepsCount)];
  const isFirstStep = currentStepIdx === 0;
  const isLastStep = currentStepIdx === stepsCount - 1;

  const handlePrev = () => {
    setCurrentStepIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentStepIdx((prev) => Math.min(stepsCount - 1, prev + 1));
  };

  return (
    <div className="min-h-[100dvh] bg-[#0B0F0D] text-[#F2F4F1] flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header: Tiny mono FIELD MODE & study title dim */}
      <header className="flex items-center justify-between border-b border-[#232B26] pb-4">
        <div className="space-y-1">
          <div className="text-[12px] font-mono tracking-widest text-[#98A39C] uppercase">
            FIELD MODE
          </div>
          <div className="text-[14px] text-[#98A39C] truncate max-w-xs sm:max-w-md font-medium">
            {sanitizeDisplayText(protocol.title)}
          </div>
        </div>
        <Link
          href={`/study/${protocol.id}`}
          className="text-[13px] font-mono text-[#98A39C] hover:text-[#F2F4F1] transition-colors focus-visible:outline-2 focus-visible:outline-[#F0804A]"
        >
          Exit
        </Link>
      </header>

      {/* Center: Huge Timer & Large Current Step */}
      <main className="my-auto py-8 sm:py-12 space-y-8 text-center max-w-2xl mx-auto w-full">
        {/* Giant Monospace Timer */}
        <div>
          <div
            className="font-mono text-[#F2F4F1] font-medium leading-none tracking-tight tabular-nums select-none"
            style={{ fontSize: "clamp(72px, 18vw, 180px)" }}
            aria-label={`Time remaining: ${formatTimer(remainingSeconds)}`}
          >
            {formatTimer(remainingSeconds)}
          </div>
          <p className="text-[14px] text-[#98A39C] font-mono mt-3 uppercase tracking-wider">
            {protocol.minutes} MINUTE BUDGET
          </p>
        </div>

        <div className="border-t border-[#232B26] pt-8 space-y-4">
          {/* Step Progress in Dim Mono */}
          <div className="text-[14px] font-mono text-[#98A39C] uppercase tracking-wider">
            STEP {currentStepIdx + 1} / {stepsCount}
          </div>

          {/* Current Step Instruction Large (28px - 34px) */}
          <p className="text-[28px] sm:text-[34px] font-medium text-[#F2F4F1] leading-snug max-w-xl mx-auto">
            {sanitizeDisplayText(currentStep.instruction)}
          </p>

          <div className="text-[13px] font-mono text-[#98A39C] uppercase tracking-wider">
            EVIDENCE: {currentStep.evidence}
            {currentStep.required ? " (REQUIRED)" : " (OPTIONAL)"}
          </div>
        </div>

        {/* Step Navigation Controls: Min 56px Tall */}
        <div className="grid grid-cols-2 gap-4 pt-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="min-h-[56px] px-5 py-3 rounded-[4px] border border-[#232B26] text-[#F2F4F1] hover:border-[#98A39C] hover:bg-[#232B26]/40 transition-colors flex items-center justify-center gap-2 font-medium text-[16px] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#F0804A]"
          >
            <ArrowLeft size={18} />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isLastStep}
            className="min-h-[56px] px-5 py-3 rounded-[4px] bg-[#F0804A] text-[#0B0F0D] hover:bg-[#F0804A]/90 transition-colors flex items-center justify-center gap-2 font-semibold text-[16px] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#F0804A]"
          >
            <span>Next</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      {/* Bottom Area: Calm philosophy & I'm back primary button */}
      <footer className="space-y-4 max-w-md mx-auto w-full text-center border-t border-[#232B26] pt-6">
        {/* Calm line */}
        <p className="text-[14px] text-[#98A39C] leading-normal font-normal">
          Your study is ready. Put your phone away.
        </p>

        {/* Audio Briefing button */}
        {speechSupported && protocol.audioScript && (
          <div className="flex justify-center items-center gap-4">
            <button
              type="button"
              onClick={toggleSpeech}
              className="inline-flex items-center gap-2 text-[14px] text-[#98A39C] hover:text-[#F2F4F1] underline transition-colors focus-visible:outline-2 focus-visible:outline-[#F0804A]"
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
            </button>

            <button
              type="button"
              onClick={() => setAudioScriptOpen(!audioScriptOpen)}
              className="inline-flex items-center gap-1 text-[13px] text-[#98A39C] hover:text-[#F2F4F1] transition-colors focus-visible:outline-2 focus-visible:outline-[#F0804A]"
            >
              <span>Text</span>
              <CaretDown size={14} className={audioScriptOpen ? "rotate-180" : ""} />
            </button>
          </div>
        )}

        {/* Audio Script collapsible */}
        {audioScriptOpen && protocol.audioScript && (
          <div className="p-3 rounded-[4px] border border-[#232B26] text-left text-[14px] text-[#98A39C] italic leading-relaxed">
            &ldquo;{sanitizeDisplayText(protocol.audioScript)}&rdquo;
          </div>
        )}

        {/* Primary Completion Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            router.push(`/study/${protocol.id}/return`);
          }}
          className="w-full min-h-[52px] px-6 py-3.5 rounded-[4px] bg-[#F0804A] text-[#0B0F0D] font-semibold text-[17px] hover:bg-[#F0804A]/90 transition-colors focus-visible:outline-2 focus-visible:outline-[#F0804A]"
        >
          I&apos;m back (Finish Study)
        </button>
      </footer>
    </div>
  );
}
