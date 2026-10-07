"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyMinutes, StudyType } from "@/lib/schemas";
import { saveProtocol } from "@/lib/storage";

const TIME_OPTIONS: { value: StudyMinutes; label: string }[] = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

const TYPE_OPTIONS: { value: StudyType; label: string; desc: string }[] = [
  { value: "nature", label: "Nature", desc: "Plants, birds, insects & flora" },
  { value: "environment", label: "Environment", desc: "Sunlight, soil, wind & shade" },
  { value: "sound", label: "Sound", desc: "Bird calls, city hum & silence" },
  { value: "neighborhood", label: "Neighborhood", desc: "Architecture, pathways & footpaths" },
  { value: "photography", label: "Photography", desc: "Textures, lighting & contrast" },
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
      // AI calls strictly happen on the server route /api/study
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
          userMsg = `Local model not found. Run "ollama pull ${process.env.NEXT_PUBLIC_MODEL || 'gemma4:e4b'}" to download it.`;
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
          Create Field Study
        </h1>
        <p className="mt-2 text-base text-zinc-700 leading-relaxed">
          Ask a question about the real world. Local Gemma will turn it into a short,
          safe outdoor investigation so you can step outside with your screen off.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-950 text-sm space-y-2"
        >
          <div className="flex items-center gap-2 font-semibold">
            <svg
              className="w-5 h-5 text-red-600 shrink-0"
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
            <span>Could not generate protocol</span>
          </div>
          <p className="text-red-900 leading-normal">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Research Question */}
        <div className="space-y-2">
          <label
            htmlFor="question-input"
            className="block text-base font-semibold text-zinc-900"
          >
            What do you want to investigate?
          </label>
          <input
            id="question-input"
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Which trees on my street have begun shedding leaves?"
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base"
          />
        </div>

        {/* Place */}
        <div className="space-y-2">
          <label
            htmlFor="place-input"
            className="block text-base font-semibold text-zinc-900"
          >
            Where will you go? (free text)
          </label>
          <input
            id="place-input"
            type="text"
            required
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Local park footpath, sidewalk block, backyard"
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base"
          />
          <p className="text-xs text-zinc-600">
            Keep it accessible and legal. No trespassing, water edges, or busy roads.
          </p>
        </div>

        {/* Time Budget */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-zinc-900">
            Time budget
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {TIME_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                disabled={isLoading}
                onClick={() => setMinutes(opt.value)}
                className={`py-3 px-2 text-center rounded-xl font-medium border text-sm transition ${
                  minutes === opt.value
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Study Type */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-zinc-900">
            Study type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TYPE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                disabled={isLoading}
                onClick={() => setType(opt.value)}
                className={`p-3 text-left rounded-xl border transition ${
                  type === opt.value
                    ? "bg-emerald-50 border-emerald-700 ring-1 ring-emerald-700"
                    : "bg-white border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="font-semibold text-zinc-950 text-sm">
                  {opt.label}
                </div>
                <div className="text-xs text-zinc-600 mt-0.5">
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !question.trim() || !place.trim()}
            className="w-full py-4 px-6 rounded-xl bg-zinc-950 text-white font-semibold text-lg tracking-wide hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3 shadow-md"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Gemma is generating protocol...</span>
              </>
            ) : (
              <span>Create Field Study</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
