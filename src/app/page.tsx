"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyMinutes, StudyType } from "@/lib/schemas";
import { saveProtocol } from "@/lib/storage";
import { StageTrail } from "@/components/ui/StageTrail";
import { TextField } from "@/components/ui/TextField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { RadioRow } from "@/components/ui/RadioRow";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { ElapsedLoader } from "@/components/ui/ElapsedLoader";

const TIME_OPTIONS: { value: StudyMinutes; label: string }[] = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

const TYPE_OPTIONS: { value: StudyType; label: string; desc: string }[] = [
  { value: "nature", label: "Nature", desc: "Plants, birds, insects and flora" },
  { value: "environment", label: "Environment", desc: "Sunlight, soil, wind and shade" },
  { value: "sound", label: "Sound", desc: "Bird calls, street soundscapes and silence" },
  { value: "neighborhood", label: "Neighborhood", desc: "Architecture, pathways and footpaths" },
  { value: "photography", label: "Photography", desc: "Textures, natural lighting and contrast" },
];

export default function CreateStudyPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [place, setPlace] = useState("");
  const [minutes, setMinutes] = useState<StudyMinutes>(30);
  const [type, setType] = useState<StudyType>("nature");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !place.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // AI calls happen exclusively on the server route /api/study
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          place: place.trim(),
          minutes,
          type,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorInfo = data.error;
        let userMsg = errorInfo?.message || "Failed to generate field study.";
        if (errorInfo?.code === "OLLAMA_UNREACHABLE") {
          userMsg = "Cannot connect to local Ollama. Please make sure Ollama is running (`ollama serve`).";
        } else if (errorInfo?.code === "MODEL_NOT_FOUND") {
          userMsg = "Requested local model not found. Check OPENFIELD_MODEL or run `ollama pull`.";
        } else if (errorInfo?.code === "INVALID_MODEL_OUTPUT") {
          userMsg = "The local model returned unexpected output. Please retry or simplify the question.";
        } else if (errorInfo?.code === "TIMEOUT") {
          userMsg = "Protocol generation timed out. Local hardware may be under heavy load.";
        }
        setErrorMessage(userMsg);
        setIsLoading(false);
        return;
      }

      // Save protocol to browser localStorage
      saveProtocol(data.protocol);

      // Transition to Screen 2 (Field Protocol)
      router.push(`/study/${data.protocol.id}`);
    } catch (err) {
      setErrorMessage(
        `Network or server error: ${err instanceof Error ? err.message : String(err)}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 4-Stage Survey Progress Trail */}
      <StageTrail currentStage="plan" />

      {/* Two columns from lg up (5/12 left, 7/12 right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column (5/12) */}
        <div className="lg:col-span-5 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#101613] leading-tight">
            Create Field Study
          </h1>
          <p className="text-[17px] text-[#44504A] leading-relaxed">
            Ask a question about the real world. Local Gemma will turn it into a short,
            safe outdoor investigation so you can step outside with your screen off.
          </p>

          <div className="pt-4 border-t border-[#D3D9D3] space-y-2 text-[13px] text-[#44504A] font-mono">
            <p>SURVEY SHEET: 01</p>
            <p>ENGINE: LOCAL GEMMA</p>
            <p>DATA RETENTION: ON DEVICE ONLY</p>
          </div>
        </div>

        {/* Right Column (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          {errorMessage && (
            <Callout
              role="alert"
              title="Could not generate protocol"
              variant="signal"
            >
              {errorMessage}
            </Callout>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Research Question */}
            <TextField
              id="question-input"
              label="What do you want to investigate?"
              required
              disabled={isLoading}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which trees on my street have begun shedding leaves?"
            />

            {/* Place */}
            <TextField
              id="place-input"
              label="Where will you go? (free text)"
              required
              disabled={isLoading}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g. Local park footpath, sidewalk block, backyard"
              helperText="Keep it accessible and legal. No trespassing, water edges, or busy roads."
            />

            {/* Time Budget */}
            <div className="space-y-2 text-left">
              <label className="block text-[15px] font-medium text-[#101613]">
                Time budget
              </label>
              <SegmentedControl
                name="Time budget"
                options={TIME_OPTIONS}
                value={minutes}
                onChange={(val) => setMinutes(val)}
                disabled={isLoading}
              />
            </div>

            {/* Study Type */}
            <div className="space-y-2 text-left">
              <label className="block text-[15px] font-medium text-[#101613]">
                Study type
              </label>
              <RadioRow
                options={TYPE_OPTIONS}
                value={type}
                onChange={(val) => setType(val)}
                disabled={isLoading}
              />
            </div>

            {/* Submit Action or Honest Elapsed Loader */}
            <div className="pt-2">
              {isLoading ? (
                <ElapsedLoader
                  label="Gemma is writing your protocol"
                  subtext="Local models are slow. This usually takes about a minute."
                />
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  disabled={!question.trim() || !place.trim()}
                  className="w-full"
                >
                  Create Field Study
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
