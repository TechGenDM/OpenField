"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FieldProtocol } from "@/lib/schemas";
import { getProtocol } from "@/lib/storage";
import { formatTimer, calculateRemainingSeconds, clampStepIndex } from "@/lib/timer";

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
  const [isTimeUp, setIsTimeUp] = useState(false);
  const targetEndTimeRef = useRef<number | null>(null);

  // Audio SpeechSynthesis state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // 1. Load protocol from browser storage
  useEffect(() => {
    if (id) {
      const loaded = getProtocol(id);
      setProtocol(loaded);
      if (loaded) {
        const totalSec = loaded.minutes * 60;
        setRemainingSeconds(totalSec);
        // Set target end time from now
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
      utterance.rate = 0.95; // slightly slower, calm cadence
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  if (!hasLoaded) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center p-6 text-base">
        Loading Field Mode...
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Study Not Found</h1>
        <p className="text-zinc-400 text-sm max-w-sm">
          No saved protocol found on this device with ID &quot;{id}&quot;.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const steps = protocol.steps;
  const currentStep = steps[clampStepIndex(currentStepIdx, steps.length)];
  const isFirstStep = currentStepIdx === 0;
  const isLastStep = currentStepIdx === steps.length - 1;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between px-4 py-6 sm:py-8 max-w-xl mx-auto selection:bg-zinc-800">
      {/* Top Banner: Put Phone Away Notice */}
      <header className="space-y-4 text-center border-b border-zinc-900 pb-5">
        <div className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 uppercase tracking-widest font-semibold">
          Field Mode &bull; Screen Off
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your study is ready. Put your phone away.
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Use your Field Card or audio briefing. Always come to a complete, safe stop
            before looking at this screen.
          </p>
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          {protocol.title} &bull; {protocol.minutes} Minute Budget
        </div>
      </header>

      {/* Main Outdoor Display: Big Timer & Current Step */}
      <main className="my-auto py-8 space-y-8">
        {/* Large Prominent Countdown Timer */}
        <section
          aria-label="Study Timer"
          className="text-center py-4 bg-zinc-950/80 rounded-2xl border border-zinc-900/90 p-6"
        >
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-1">
            {isTimeUp ? "Planned Time Ended" : "Time Remaining"}
          </div>

          <div
            className={`font-mono text-6xl sm:text-7xl font-bold tracking-tight ${
              isTimeUp ? "text-amber-400" : "text-white"
            }`}
          >
            {formatTimer(remainingSeconds)}
          </div>

          {isTimeUp ? (
            <p className="mt-2 text-xs text-amber-300 font-medium">
              Planned study time has finished. Take your time or return when ready.
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              Total Budget: {protocol.minutes} minutes
            </p>
          )}
        </section>

        {/* Current Investigation Step */}
        <section
          aria-label="Current Step"
          className="bg-zinc-950 rounded-2xl border border-zinc-800 p-6 space-y-4"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-900 px-2.5 py-1 rounded-full">
              Step {currentStepIdx + 1} of {steps.length}
            </span>

            <span className="text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 capitalize">
              Evidence: {currentStep.evidence} ({currentStep.required ? "Required" : "Optional"})
            </span>
          </div>

          {/* Large, high-contrast step instruction */}
          <p className="text-xl sm:text-2xl font-semibold text-white leading-snug">
            {currentStep.instruction}
          </p>

          {/* Minimal Step Navigation Controls */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isFirstStep}
              onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
              className="py-3.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              &larr; Previous Step
            </button>

            <button
              type="button"
              disabled={isLastStep}
              onClick={() => setCurrentStepIdx((prev) => Math.min(steps.length - 1, prev + 1))}
              className="py-3.5 px-4 rounded-xl border border-zinc-700 bg-zinc-100 text-zinc-950 font-bold text-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next Step &rarr;
            </button>
          </div>
        </section>

        {/* Audio Briefing Section */}
        {protocol.audioScript && (
          <section
            aria-label="Spoken Briefing"
            className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-semibold uppercase tracking-wider">
                Audio Briefing
              </span>

              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-medium transition flex items-center gap-1.5"
                >
                  <span>{isPlayingAudio ? "Stop Audio" : "Listen to Briefing"}</span>
                </button>
              )}
            </div>

            <p className="text-zinc-300 italic leading-relaxed">
              &ldquo;{protocol.audioScript}&rdquo;
            </p>
          </section>
        )}
      </main>

      {/* Footer Navigation: Secondary "I'm back" & Return to Protocol */}
      <footer className="border-t border-zinc-900 pt-5 space-y-3">
        <button
          type="button"
          onClick={() => router.push(`/study/${protocol.id}/return`)}
          className="w-full py-4 px-4 rounded-xl bg-zinc-800 text-white font-semibold text-base hover:bg-zinc-700 transition flex items-center justify-center gap-2 border border-zinc-700"
        >
          <span>I&apos;m back (Finish Study)</span>
          <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
            Next: Return
          </span>
        </button>

        <div className="text-center">
          <Link
            href={`/study/${protocol.id}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            &larr; View Protocol &amp; Field Card
          </Link>
        </div>
      </footer>
    </div>
  );
}
