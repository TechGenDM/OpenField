"use client";

import React, { useEffect, useState, useTransition } from "react";
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
import { sanitizeDisplayText, formatPlural } from "@/lib/ui/sanitize";
import { StageTrail } from "@/components/ui/StageTrail";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { ElapsedLoader } from "@/components/ui/ElapsedLoader";
import { Tag } from "@/components/ui/Tag";
import { Camera, Trash, ArrowLeft } from "@phosphor-icons/react";

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
      <div className="py-16 text-center text-[#44504A] font-mono text-[15px]">
        Loading study protocol...
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#101613]">Protocol Not Found</h1>
        <p className="text-[15px] text-[#44504A]">
          We could not find protocol &ldquo;{id}&rdquo; in your browser storage.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary">Create a New Study</Button>
          </Link>
        </div>
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

    // Reset previous file picker input value
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
  const totalMeasurementsCount = Object.values(measuredFlags).filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      {/* 4-Stage Survey Progress Trail */}
      <StageTrail currentStage="return" />

      {/* Screen Header */}
      <div className="space-y-3 border-b border-[#D3D9D3] pb-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/study/${protocol.id}/field`}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#44504A] hover:text-[#101613] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Field Mode</span>
          </Link>
          <span className="text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
            EVIDENCE RETURN
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#101613]">
          Record Field Evidence
        </h1>
        <p className="text-[17px] text-[#44504A] leading-relaxed">
          Welcome back. Enter what you observed, heard, or counted during the study.
          Attach any photos: they are automatically resized to 1024px with all EXIF and GPS coordinates stripped before analysis.
        </p>

        {/* Study Context Quote */}
        <blockquote className="border-l-[3px] border-l-[#B8461A] pl-4 py-1 mt-4">
          <span className="block text-[12px] font-mono uppercase tracking-wider text-[#44504A]">
            Investigation Question
          </span>
          <p className="text-[17px] font-medium text-[#101613] mt-0.5">
            &ldquo;{sanitizeDisplayText(protocol.researchQuestion)}&rdquo;
          </p>
        </blockquote>
      </div>

      {/* Alerts */}
      {uploadError && (
        <Callout
          variant="signal"
          title="Photo Upload Notice"
        >
          <div className="flex justify-between items-start">
            <span>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="text-[#B8461A] font-semibold text-sm ml-2"
              type="button"
            >
              Dismiss
            </button>
          </div>
        </Callout>
      )}

      {quotaWarning && (
        <Callout
          variant="signal"
          title="Browser Storage Quota"
        >
          {quotaWarning}
        </Callout>
      )}

      {error && (
        <Callout
          variant="signal"
          title="Report Generation Error"
        >
          <p>{error.message}</p>
          {error.details && (
            <p className="text-[13px] font-mono text-[#44504A] mt-1">{error.details}</p>
          )}
        </Callout>
      )}

      {/* Observation Steps Form: Ruled list of 5 evidence entries */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="divide-y divide-[#D3D9D3] border-y border-[#D3D9D3]">
          {protocol.steps.map((step, idx) => {
            const stepPhotos = photos.filter((p) => p.stepId === step.id);
            const isProcessingThisStep = processingStepId === step.id;

            return (
              <div key={step.id} className="py-6 space-y-4">
                {/* Step header: Big numeral + Tag */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-semibold text-[#44504A] select-none">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] font-mono uppercase tracking-wider text-[#44504A]">
                      STEP
                    </span>
                  </div>

                  <Tag variant={step.required ? "signal" : "default"}>
                    {step.evidence.toUpperCase()}
                    {step.required ? ", required" : ", optional"}
                  </Tag>
                </div>

                {/* Instruction in dim 16px */}
                <p className="text-[16px] text-[#44504A] leading-relaxed">
                  {sanitizeDisplayText(step.instruction)}
                </p>

                {/* Textarea labeled: "What you saw, counted or measured" */}
                <Textarea
                  id={`note-${step.id}`}
                  label="What you saw, counted or measured"
                  placeholder="Record factual observations..."
                  value={notes[step.id] || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNoteChange(step.id, e.target.value)}
                  disabled={isSubmitting}
                />

                {/* Measurement Checkbox with accessible SVG icon for regression test suite */}
                {(step.evidence === "measurement" || step.evidence === "count") && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      id={`measured-${step.id}`}
                      role="checkbox"
                      aria-checked={measuredFlags[step.id] || false}
                      onClick={() => handleMeasuredToggle(step.id)}
                      className={`w-6 h-6 rounded-[4px] border flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#B8461A] focus-visible:outline-offset-2 ${
                        measuredFlags[step.id]
                          ? "bg-[#101613] border-[#101613]"
                          : "bg-[#FAFBF9] border-[#D3D9D3] hover:border-[#101613]"
                      }`}
                    >
                      {measuredFlags[step.id] && (
                        <svg
                          className="w-4 h-4 text-[#FAFBF9]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <label
                      htmlFor={`measured-${step.id}`}
                      onClick={() => handleMeasuredToggle(step.id)}
                      className="cursor-pointer text-[15px] text-[#101613] select-none"
                    >
                      Physical measurement or structured count recorded in this step
                    </label>
                  </div>
                )}

                {/* Attached Photos Thumbnail Grid with caption BELOW thumbnail */}
                {stepPhotos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[13px] font-mono uppercase tracking-wider text-[#44504A]">
                      Attached Photos ({stepPhotos.length}):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {stepPhotos.map((photo) => (
                        <div key={photo.id} className="space-y-1.5">
                          <div className="relative rounded-[4px] border border-[#D3D9D3] overflow-hidden bg-[#FAFBF9] aspect-square group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.dataUrl}
                              alt={`Field photo for ${step.id}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              aria-label={`Remove photo ${photo.id}`}
                              className="absolute top-2 right-2 p-1.5 bg-[#FAFBF9] border border-[#D3D9D3] text-[#B8461A] rounded-[4px] hover:bg-[#B8461A] hover:text-[#FAFBF9] transition-colors shadow-sm"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                          {/* Caption strictly BELOW thumbnail */}
                          <div className="text-[12px] font-mono text-[#44504A] space-y-0.5">
                            <div className="truncate">{photo.id}</div>
                            <div className="text-[#101613] font-medium">EXIF removed</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Photo Action */}
                <div className="pt-1">
                  <label
                    htmlFor={`photo-input-${step.id}`}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] border border-[#D3D9D3] bg-[#FAFBF9] hover:bg-[#F2F4F1] hover:border-[#101613] text-[14px] font-medium text-[#101613] cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-[#B8461A] ${
                      isProcessingThisStep ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Camera size={16} />
                    <span>
                      {isProcessingThisStep ? "Processing photo..." : "Attach Photo"}
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

        {/* Evidence Tally as one plain line with correct plurals */}
        <div className="py-3 px-4 rounded-[4px] bg-[#FAFBF9] border border-[#D3D9D3] text-[14px] font-mono text-[#44504A]">
          <span>
            EVIDENCE TALLIED: {formatPlural(totalNotesCount, "note")}, {formatPlural(totalPhotosCount, "photo")}
            {totalMeasurementsCount > 0 ? `, ${formatPlural(totalMeasurementsCount, "measurement")}` : ""}
          </span>
        </div>

        {/* Finish Action with Calm Elapsed Timer */}
        <div className="pt-2">
          {isSubmitting ? (
            <ElapsedLoader
              label="Gemma is analyzing observations"
              subtext="Synthesizing multi-photo evidence and writing honest report. This usually takes about a minute."
            />
          ) : (
            <Button
              type="submit"
              size="lg"
              className="w-full"
            >
              Generate Honest Field Report
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
