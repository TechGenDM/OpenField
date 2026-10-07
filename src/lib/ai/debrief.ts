import {
  FieldProtocol,
  Observation,
  FieldReport,
  FieldReportSchema,
  AppError,
} from "../schemas";
import { ollama, getModelName, mapOllamaError, formatOllamaStats } from "./ollama";
import {
  DEBRIEF_SYSTEM_PROMPT,
  REPORT_JSON_SCHEMA,
  buildDebriefUserPrompt,
  buildDebriefRetryPrompt,
} from "./prompts";

import { extractJsonObject } from "./json";

export interface DebriefPhotoInput {
  id: string;
  dataUrl: string;
}

export interface CreateReportParams {
  protocol: FieldProtocol;
  observations: Observation[];
  photos?: DebriefPhotoInput[];
}

export type CreateReportResult =
  | { success: true; report: FieldReport }
  | { success: false; error: AppError };

/**
 * Strips the data URI prefix (e.g. "data:image/jpeg;base64,") leaving only
 * the raw base64 string required by Ollama's vision API.
 */
export function stripBase64Header(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex !== -1) {
    return dataUrl.slice(commaIndex + 1);
  }
  return dataUrl;
}

/**
 * Deterministically validates that every evidence citation in the report
 * strictly points to a real step ID or photo ID from the study.
 * (ARCHITECTURE.md Rule 77 & SPEC.md Section 5)
 */
export function validateReportQuality(
  report: FieldReport,
  validStepIds: string[],
  validPhotoIds: string[]
): { ok: true } | { ok: false; reason: string } {
  const validIds = new Set([...validStepIds, ...validPhotoIds]);

  for (const finding of report.findings) {
    if (!finding.claim || !finding.claim.trim()) {
      return {
        ok: false,
        reason: "Finding contains an empty claim string.",
      };
    }

    if (!Array.isArray(finding.evidenceRefs) || finding.evidenceRefs.length === 0) {
      return {
        ok: false,
        reason: `Finding "${finding.claim}" does not cite any evidence references. Every claim must cite at least one step or photo ID.`,
      };
    }

    for (const ref of finding.evidenceRefs) {
      if (!validIds.has(ref)) {
        return {
          ok: false,
          reason: `Invalid evidence reference "${ref}" cited in claim "${finding.claim}". Must be a valid step ID (${validStepIds.join(", ")}) or photo ID (${validPhotoIds.join(", ") || "none"}).`,
        };
      }
    }
  }

  // Ensure next question is meaningful
  if (!report.nextQuestion || !report.nextQuestion.trim()) {
    return {
      ok: false,
      reason: "Report missing a follow-up research question.",
    };
  }

  return { ok: true };
}

/**
 * Parses and validates raw model debrief output against schema and citation rules.
 * Uses extractJsonObject to handle markdown code fences without corrupting braces in strings.
 */
export function validateRawReport(
  rawText: string,
  validStepIds: string[],
  validPhotoIds: string[]
): { success: true; data: FieldReport } | { success: false; error: string } {
  try {
    const cleanJson = extractJsonObject(rawText);
    const parsed = JSON.parse(cleanJson);

    // 1. Zod schema validation
    const schemaStart = performance.now();
    const result = FieldReportSchema.safeParse(parsed);
    const schemaDuration = (performance.now() - schemaStart).toFixed(2);
    console.log(`[OpenField] debrief schema validation: ${schemaDuration}ms`);

    if (!result.success) {
      const issues = result.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      return { success: false, error: issues };
    }

    // 2. Deterministic evidence reference validation
    const qualityStart = performance.now();
    const quality = validateReportQuality(result.data, validStepIds, validPhotoIds);
    const qualityDuration = (performance.now() - qualityStart).toFixed(2);
    console.log(`[OpenField] debrief quality validation: ${qualityDuration}ms`);

    if (!quality.ok) {
      return { success: false, error: quality.reason };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Generates an honest Field Report using local Gemma (and vision if photos are provided).
 * Enforces canonical step IDs, Zod validation, deterministic citation checking, and 1 retry.
 */
export async function createReport(
  params: CreateReportParams
): Promise<CreateReportResult> {
  const { protocol, observations, photos = [] } = params;
  const model = getModelName();

  // Enforce canonical step IDs (step-1 ... step-N) across protocol and observations
  const canonicalSteps = protocol.steps.map((s, idx) => ({
    ...s,
    id: `step-${idx + 1}`,
  }));
  const canonicalProtocol: FieldProtocol = {
    ...protocol,
    steps: canonicalSteps,
  };
  const validStepIds = canonicalSteps.map((s) => s.id);
  const validPhotoIds = photos.map((p) => p.id);

  const canonicalObservations: Observation[] = observations.map((obs, idx) => {
    const matchedIdx = protocol.steps.findIndex((s) => s.id === obs.stepId);
    const targetStepId = matchedIdx !== -1 ? `step-${matchedIdx + 1}` : (canonicalSteps[idx]?.id || obs.stepId);
    return {
      ...obs,
      stepId: targetStepId,
    };
  });

  const userPrompt = buildDebriefUserPrompt({
    protocol: canonicalProtocol,
    observations: canonicalObservations,
    photos,
  });

  const rawImages = photos
    .map((p) => stripBase64Header(p.dataUrl))
    .filter((b64) => Boolean(b64 && b64.trim()));

  const options = {
    temperature: 1.0,
    top_p: 0.95,
    top_k: 64,
  };

  const userMessage: { role: string; content: string; images?: string[] } = {
    role: "user",
    content: userPrompt,
  };
  if (rawImages.length > 0) {
    userMessage.images = rawImages;
  }

  try {
    // Attempt 1
    console.log(
      `[OpenField] ollama debrief attempt 1 started (model: ${model}, photos: ${rawImages.length})`
    );
    const attempt1Start = performance.now();

    const firstResponse = await ollama.chat({
      model,
      messages: [
        { role: "system", content: DEBRIEF_SYSTEM_PROMPT },
        userMessage,
      ],
      format: REPORT_JSON_SCHEMA,
      options,
    });

    const attempt1Duration = Math.round(performance.now() - attempt1Start);
    const firstStats = formatOllamaStats(firstResponse as unknown as Record<string, unknown>);
    console.log(
      `[OpenField] ollama debrief attempt 1 completed in ${attempt1Duration}ms (${firstStats})`
    );

    const firstRaw = firstResponse.message?.content || "";
    const firstCheck = validateRawReport(firstRaw, validStepIds, validPhotoIds);

    if (firstCheck.success) {
      console.log(`[OpenField] debrief attempt 1 validation succeeded, no retry needed`);
      return { success: true, report: firstCheck.data };
    }

    // Attempt 2 (Retry once): Provide the citation or validation failure to the model
    console.log(`[OpenField] debrief retry required: ${firstCheck.error}`);
    console.log(`[OpenField] ollama debrief attempt 2 (retry) started`);

    const retryPrompt = buildDebriefRetryPrompt(
      userPrompt,
      firstCheck.error,
      validStepIds,
      validPhotoIds
    );

    const retryUserMessage: { role: string; content: string; images?: string[] } = {
      role: "user",
      content: retryPrompt,
    };
    if (rawImages.length > 0) {
      retryUserMessage.images = rawImages;
    }

    const attempt2Start = performance.now();
    const retryResponse = await ollama.chat({
      model,
      messages: [
        { role: "system", content: DEBRIEF_SYSTEM_PROMPT },
        retryUserMessage,
      ],
      format: REPORT_JSON_SCHEMA,
      options,
    });

    const attempt2Duration = Math.round(performance.now() - attempt2Start);
    const retryStats = formatOllamaStats(retryResponse as unknown as Record<string, unknown>);
    console.log(
      `[OpenField] ollama debrief attempt 2 completed in ${attempt2Duration}ms (${retryStats})`
    );

    const retryRaw = retryResponse.message?.content || "";
    const retryCheck = validateRawReport(retryRaw, validStepIds, validPhotoIds);

    if (retryCheck.success) {
      console.log(`[OpenField] debrief attempt 2 validation succeeded`);
      return { success: true, report: retryCheck.data };
    }

    console.log(`[OpenField] debrief attempt 2 validation failed: ${retryCheck.error}`);
    return {
      success: false,
      error: {
        code: "INVALID_MODEL_OUTPUT",
        message: "The model generated a debrief report that failed validation or citation checks.",
        details: `First error: ${firstCheck.error} | Retry error: ${retryCheck.error}`,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: mapOllamaError(err),
    };
  }
}
