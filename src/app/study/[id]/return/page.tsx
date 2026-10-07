"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FieldProtocol,
  Observation,
  AppError,
} from "@/lib/schemas";
import {
  getProtocol,
  savePhoto,
  deletePhoto,
  saveReport,
} from "@/lib/storage";
import {
  processImageFile,
  validateImageFile,
} from "@/lib/image";

interface LoadedPhoto {
  id: string;
  stepId: string;
  dataUrl: string;
  width: number;
  height: number;
}

export default function ReturnPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [protocol, setProtocol] = useState<FieldProtocol | null>(null);
  const [loadingProtocol, setLoadingProtocol] = useState(true);

  // Observations keyed by stepId
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [measuredFlags, setMeasuredFlags] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<LoadedPhoto[]>([]);

  // Processing state per step
  const [processingStepId, setProcessingStepId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  // Debrief submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [, startTransition] = useTransition();

  // Load protocol from browser localStorage
  useEffect(() => {
    if (!id) return;
    const loaded = getProtocol(id);
    setProtocol(loaded);
    setLoadingProtocol(false);
  }, [id]);

  if (loadingProtocol) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">Loading study protocol...</p>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-zinc-900">Protocol Not Found</h1>
        <p className="text-sm text-zinc-600">
          We could not find protocol &ldquo;{id}&rdquo; in your browser storage.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 transition"
        >
          Create a New Study
        </Link>
      </div>
    );
  }

  // Handle single-pass image selection and processing
  const handlePhotoSelect = async (
    stepId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous file picker input value so re-selecting same file triggers change
    event.target.value = "";
    setUploadError(null);

    const validation = validateImageFile(file);
    if (!validation.ok) {
      setUploadError(validation.reason);
      return;
    }

    setProcessingStepId(stepId);

    try {
      const result = await processImageFile(file, 1024);
      if (!result.ok) {
        setUploadError(result.reason);
        setProcessingStepId(null);
        return;
      }

      // Generate a stable photo ID referencing the step
      const photoId = `photo-${stepId}-${Date.now().toString(36)}`;

      // Attempt to save to browser storage with graceful quota error handling
      const storageRes = savePhoto(photoId, result.dataUrl);
      if (!storageRes.ok && storageRes.error === "QUOTA_EXCEEDED") {
        setQuotaWarning(
          "Browser storage quota reached. Your photo is retained in memory for this session so you can generate your Field Report, but could not be cached to offline storage."
        );
      }

      const newPhoto: LoadedPhoto = {
        id: photoId,
        stepId,
        dataUrl: result.dataUrl,
        width: result.width,
        height: result.height,
      };

      setPhotos((prev) => [...prev, newPhoto]);
    } catch (err) {
      setUploadError(
        `Failed to process photo: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setProcessingStepId(null);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleNoteChange = (stepId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [stepId]: value }));
  };

  const handleMeasuredToggle = (stepId: string) => {
    setMeasuredFlags((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Submit collected evidence to the local Gemma debrief endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocol || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Format observations per protocol step
    const formattedObservations: Observation[] = protocol.steps.map((step) => {
      const stepPhotos = photos.filter((p) => p.stepId === step.id);
      return {
        stepId: step.id,
        note: notes[step.id]?.trim() || undefined,
        photoIds: stepPhotos.length > 0 ? stepPhotos.map((p) => p.id) : undefined,
        measured: measuredFlags[step.id] ?? false,
      };
    });

    const payload = {
      protocol,
      observations: formattedObservations,
      photos: photos.map((p) => ({
        id: p.id,
        dataUrl: p.dataUrl,
      })),
    };

    try {
      const res = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || {
            code: "INVALID_MODEL_OUTPUT",
            message: "Failed to generate field report.",
          }
        );
        setIsSubmitting(false);
        return;
      }

      // Persist the generated FieldReport to browser storage
      const saveRes = saveReport(protocol.id, data.report);
      if (!saveRes.ok && saveRes.error === "QUOTA_EXCEEDED") {
        console.warn("Storage quota exceeded while saving report to localStorage.");
      }

      startTransition(() => {
        router.push(`/study/${protocol.id}/report`);
      });
    } catch (err) {
      setError({
        code: "OLLAMA_UNREACHABLE",
        message:
          "Unable to connect to the debrief server. Please verify your connection.",
        details: err instanceof Error ? err.message : String(err),
      });
      setIsSubmitting(false);
    }
  };

  const totalNotesCount = Object.values(notes).filter((n) => n && n.trim().length > 0).length;
  const totalPhotosCount = photos.length;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Return Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <svg
            className="w-4 h-4 text-emerald-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Screen 4 of 5 &bull; Return from the Field</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">
          Record Field Evidence
        </h1>
        <p className="text-sm text-zinc-600">
          Welcome back. Enter what you observed, heard, or measured during the study.
          Attach any photos—they are automatically resized to 1024px with all EXIF and GPS coordinates stripped before analysis.
        </p>
      </div>

      {/* Protocol Summary Card */}
      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">{protocol.title}</span>
          <span>{protocol.minutes} min &bull; {protocol.type}</span>
        </div>
        <p className="text-sm font-semibold text-zinc-900">
          &ldquo;{protocol.researchQuestion}&rdquo;
        </p>
      </div>

      {/* Alerts */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start justify-between">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
            type="button"
          >
            &times;
          </button>
        </div>
      )}

      {quotaWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 space-y-1">
          <p className="font-semibold">Notice: Browser Storage Quota</p>
          <p>{quotaWarning}</p>
        </div>
      )}

      {/* Observation Steps Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {protocol.steps.map((step, idx) => {
            const stepPhotos = photos.filter((p) => p.stepId === step.id);
            const isProcessingThisStep = processingStepId === step.id;

            return (
              <div
                key={step.id}
                className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4 transition hover:border-zinc-300"
              >
                {/* Step header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      {step.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium">
                      Evidence: {step.evidence}
                    </span>
                    {step.required && (
                      <span className="text-amber-800 font-medium">Required</span>
                    )}
                  </div>
                </div>

                {/* Instruction */}
                <p className="text-sm font-medium text-zinc-900">
                  {step.instruction}
                </p>

                {/* Observation Note Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`note-${step.id}`}
                    className="block text-xs font-medium text-zinc-700"
                  >
                    Your Observations & Notes
                  </label>
                  <textarea
                    id={`note-${step.id}`}
                    rows={2}
                    value={notes[step.id] || ""}
                    onChange={(e) => handleNoteChange(step.id, e.target.value)}
                    placeholder="Describe what you actually saw, heard, or counted..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition resize-y"
                  />
                </div>

                {/* Optional Measured Toggle */}
                {(step.evidence === "measurement" || step.evidence === "count") && (
                  <div className="flex items-center gap-2 text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      id={`measured-${step.id}`}
                      checked={measuredFlags[step.id] || false}
                      onChange={() => handleMeasuredToggle(step.id)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    <label htmlFor={`measured-${step.id}`} className="cursor-pointer">
                      Physical measurement or structured count recorded in this step
                    </label>
                  </div>
                )}

                {/* Attached Photos List */}
                {stepPhotos.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-medium text-zinc-600">
                      Attached Photos ({stepPhotos.length}):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {stepPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-square flex flex-col"
                        >
                          {/* Thumbnail preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.dataUrl}
                            alt={`Field photo for ${step.id}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                            <span className="truncate">{photo.id}</span>
                            <span className="text-emerald-300 font-mono">EXIF clean</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Upload Input */}
                <div className="pt-1">
                  <label
                    htmlFor={`photo-input-${step.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 cursor-pointer transition ${
                      isProcessingThisStep ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-zinc-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {isProcessingThisStep ? "Stripping EXIF & Resizing..." : "Add Photo"}
                    </span>
                  </label>
                  <input
                    type="file"
                    id={`photo-input-${step.id}`}
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isProcessingThisStep || isSubmitting}
                    onChange={(e) => handlePhotoSelect(step.id, e)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Evidence Tally Card */}
        <div className="p-4 rounded-xl bg-zinc-100/70 text-xs text-zinc-600 flex items-center justify-between">
          <span>
            Evidence tallied: <strong className="text-zinc-900">{totalNotesCount} notes</strong>,{" "}
            <strong className="text-zinc-900">{totalPhotosCount} photos</strong>
          </span>
          <span className="text-zinc-500">Local Gemma Multimodal Vision</span>
        </div>

        {/* Error Card */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900 space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <span>Debrief Generation Failed ({error.code})</span>
            </div>
            <p>{error.message}</p>
            {error.details && (
              <p className="text-xs font-mono bg-red-100/60 p-2 rounded text-red-800 break-words">
                {error.details}
              </p>
            )}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-zinc-950 text-white font-semibold text-base shadow-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center justify-center"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
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
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Analyzing Field Evidence with Local Gemma...</span>
              </span>
            ) : (
              <span>Finish Study &amp; Generate Field Report</span>
            )}
          </button>

          {isSubmitting && (
            <p className="text-center text-xs text-zinc-500 animate-pulse">
              Running honest debriefing on your machine. Local Gemma is strictly categorizing observed vs. inferred findings.
            </p>
          )}

          <div className="flex justify-between items-center text-xs text-zinc-500 pt-2">
            <Link
              href={`/study/${protocol.id}/field`}
              className="hover:text-zinc-900 transition underline underline-offset-4"
            >
              &larr; Back to Field Mode
            </Link>
            <Link
              href={`/study/${protocol.id}`}
              className="hover:text-zinc-900 transition underline underline-offset-4"
            >
              View Field Card
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
