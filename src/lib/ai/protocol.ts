import { randomUUID } from "node:crypto";
import {
  FieldProtocol,
  FieldProtocolSchema,
  StudyInput,
  AppError,
} from "../schemas";
import { ollama, getModelName, mapOllamaError } from "./ollama";
import {
  PROTOCOL_SYSTEM_PROMPT,
  PROTOCOL_JSON_SCHEMA,
  buildProtocolUserPrompt,
  buildProtocolRetryPrompt,
} from "./prompts";
import { validateProtocolQuality } from "./quality";

export type CreateProtocolResult =
  | { success: true; protocol: FieldProtocol }
  | { success: false; error: AppError };

/**
 * Attempts to parse and validate raw model text output against the FieldProtocol schema
 * AND deterministic quality rules (time budget and SPEC Section 6 safety).
 * Enriches the object with server-generated metadata (id, minutes, type).
 */
export function validateRawProtocol(
  rawText: string,
  input: StudyInput
): { success: true; data: FieldProtocol } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(rawText);

    // Merge user-provided fixed parameters with model-generated steps
    const candidate = {
      id: randomUUID(),
      title: parsed.title,
      researchQuestion: parsed.researchQuestion || input.question,
      minutes: input.minutes,
      type: input.type,
      // Ensure step IDs are assigned if the model provided indices or partial IDs
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.map((step: Record<string, unknown>, idx: number) => ({
            id: String(step.id || `step-${idx + 1}`),
            instruction: String(step.instruction || ""),
            evidence: step.evidence,
            required: Boolean(step.required ?? true),
          }))
        : [],
      evidenceNeeded: Array.isArray(parsed.evidenceNeeded)
        ? parsed.evidenceNeeded.map(String)
        : [],
      safetyNote: String(parsed.safetyNote || ""),
      audioScript: String(parsed.audioScript || ""),
    };

    // 1. Zod schema structural validation (e.g. 4-6 steps, valid enums)
    const result = FieldProtocolSchema.safeParse(candidate);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      return { success: false, error: issueDetails };
    }

    // 2. Deterministic Quality checks: Time budget & SPEC Section 6 safety rules
    // Why: LLMs can sometimes hallucinate lengthy instructions or overlook outdoor hazards;
    // this lightweight check catches violations deterministically and prompts a single retry.
    const qualityCheck = validateProtocolQuality(result.data, input.minutes);
    if (!qualityCheck.ok) {
      return { success: false, error: qualityCheck.reason };
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
 * Generates a structured Field Protocol using the local Gemma model via Ollama.
 * Enforces Zod validation, time budget checks, and safety rules,
 * executing exactly one retry if the first output is invalid.
 */
export async function createProtocol(
  input: StudyInput
): Promise<CreateProtocolResult> {
  const model = getModelName();
  const userPrompt = buildProtocolUserPrompt(input);

  // Recommended Ollama options from ARCHITECTURE.md:
  // Protocol generation disables thinking tags for maximum response speed.
  const options = {
    temperature: 1.0,
    top_p: 0.95,
    top_k: 64,
  };

  try {
    // Attempt 1: Initial call with structured JSON schema format
    const firstResponse = await ollama.chat({
      model,
      messages: [
        { role: "system", content: PROTOCOL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      format: PROTOCOL_JSON_SCHEMA,
      options,
    });

    const firstRaw = firstResponse.message?.content || "";
    const firstCheck = validateRawProtocol(firstRaw, input);

    if (firstCheck.success) {
      return { success: true, protocol: firstCheck.data };
    }

    // Attempt 2 (Retry once): Feed the validation / quality error back to the model
    // Hard rule: "On failure: retry once with the validation error in the prompt, then return a typed error."
    const retryPrompt = buildProtocolRetryPrompt(
      userPrompt,
      firstRaw,
      firstCheck.error
    );

    const retryResponse = await ollama.chat({
      model,
      messages: [
        { role: "system", content: PROTOCOL_SYSTEM_PROMPT },
        { role: "user", content: retryPrompt },
      ],
      format: PROTOCOL_JSON_SCHEMA,
      options,
    });

    const retryRaw = retryResponse.message?.content || "";
    const retryCheck = validateRawProtocol(retryRaw, input);

    if (retryCheck.success) {
      return { success: true, protocol: retryCheck.data };
    }

    // Both attempts failed validation
    return {
      success: false,
      error: {
        code: "INVALID_MODEL_OUTPUT",
        message: "The model generated a response that failed validation or quality checks.",
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
