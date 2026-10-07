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

import {
  Clock,
  Leaf,
  Sun,
  Waveform,
  House,
  Camera,
  MapPin,
  Article,
  Gear,
  Database,
  ArrowRight,
} from "@phosphor-icons/react";

const TIME_OPTIONS: { value: StudyMinutes; label: string; icon: React.ReactNode }[] = [
  { value: 15, label: "15 min", icon: <Clock size={16} weight="regular" /> },
  { value: 30, label: "30 min", icon: <Clock size={16} weight="regular" /> },
  { value: 45, label: "45 min", icon: <Clock size={16} weight="regular" /> },
  { value: 60, label: "60 min", icon: <Clock size={16} weight="regular" /> },
];

const TYPE_OPTIONS: {
  value: StudyType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "nature",
    label: "Nature",
    desc: "Plants, birds, insects and flora",
    icon: <Leaf size={22} weight="regular" />,
  },
  {
    value: "environment",
    label: "Environment",
    desc: "Sunlight, soil, wind and shade",
    icon: <Sun size={22} weight="regular" />,
  },
  {
    value: "sound",
    label: "Sound",
    desc: "Bird calls, street soundscapes and silence",
    icon: <Waveform size={22} weight="regular" />,
  },
  {
    value: "neighborhood",
    label: "Neighborhood",
    desc: "Architecture, pathways and footpaths",
    icon: <House size={22} weight="regular" />,
  },
  {
    value: "photography",
    label: "Photography",
    desc: "Textures, natural lighting and contrast",
    icon: <Camera size={22} weight="regular" />,
  },
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
    if (!question.trim() || !place.trim()) {
      setErrorMessage("Please enter both an investigation question and a location.");
      return;
    }

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
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center">
      {/* Left Landscape Background positioned in bottom-left below metadata */}
      <div
        className="pointer-events-none absolute -left-4 sm:-left-8 bottom-0 w-full sm:w-[52%] lg:w-[48%] h-[54%] overflow-hidden z-0 select-none hidden sm:block"
        aria-hidden="true"
      >
        <div
          className="w-full h-full"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, black 35%, rgba(0,0,0,0.7) 65%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, black 35%, rgba(0,0,0,0.7) 65%, transparent 100%)",
          }}
        >
          <div
            className="w-full h-full bg-no-repeat bg-left-bottom bg-cover"
            style={{
              backgroundImage: "url('/images/landscape.jpg')",
              WebkitMaskImage:
                "linear-gradient(to top, black 35%, rgba(0,0,0,0.7) 70%, transparent 95%)",
              maskImage:
                "linear-gradient(to top, black 35%, rgba(0,0,0,0.7) 70%, transparent 95%)",
            }}
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10 py-1 sm:py-2">
        {/* Left Column (5/12) */}
        <div className="lg:col-span-5 space-y-5 pt-1">
          {/* Progress Breadcrumbs */}
          <StageTrail currentStage="plan" />

          {/* Headline */}
          <div className="space-y-0.5">
            <h1 className="text-4xl sm:text-[44px] font-extrabold tracking-tight text-[#111815] leading-[1.08]">
              Create<br />
              <span className="text-[#C0562F]">Field Study</span>
            </h1>
          </div>

          {/* Description */}
          <p className="text-[15px] sm:text-[16px] text-[#444D47] leading-relaxed max-w-[400px]">
            Ask a question about the real world. Local Gemma will turn it into a short,
            safe outdoor investigation so you can step outside with your screen off.
          </p>

          {/* Technical Specifications */}
          <div className="pt-2 space-y-2 text-[12px] font-mono tracking-wider text-[#3D4540] font-medium">
            <div className="flex items-center gap-2.5">
              <Article size={18} weight="regular" className="text-[#3D4540] shrink-0" />
              <span>SURVEY SHEET: 01</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Gear size={18} weight="regular" className="text-[#3D4540] shrink-0" />
              <span>ENGINE: LOCAL GEMMA</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Database size={18} weight="regular" className="text-[#3D4540] shrink-0" />
              <span>DATA RETENTION: ON DEVICE ONLY</span>
            </div>
          </div>
        </div>

        {/* Right Column (7/12): Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-[#DFE2DC] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <Callout
                role="alert"
                title="Could not generate protocol"
                variant="signal"
              >
                {errorMessage}
              </Callout>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Research Question */}
              <TextField
                id="question-input"
                label="What do you want to investigate?"
                required
                disabled={isLoading}
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                placeholder="e.g. Which trees on my street have begun shedding leaves?"
                leftIcon={<Leaf size={18} weight="regular" />}
                counter={`${question.length} / 200`}
                highlighted
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
                leftIcon={<MapPin size={18} weight="regular" />}
                helperText="Keep it accessible and legal. No trespassing, water edges, or busy roads."
              />

              {/* Time Budget */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[14px] font-semibold text-[#18201B]">
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
              <div className="space-y-1.5 text-left">
                <label className="block text-[14px] font-semibold text-[#18201B]">
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
              <div className="pt-1">
                {isLoading ? (
                  <ElapsedLoader
                    label="Gemma is writing your protocol"
                    subtext="Local models are slow. This usually takes about a minute."
                  />
                ) : (
                  <button
                    type="submit"
                    className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-[#C0562F] hover:bg-[#AB4924] active:bg-[#973F1E] text-white font-medium text-[15px] flex items-center justify-center gap-2 transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-[#C0562F] focus-visible:outline-offset-2 cursor-pointer"
                  >
                    <span>Create Field Study</span>
                    <ArrowRight size={18} weight="bold" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
