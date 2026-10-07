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
 * Helper to format Ollama runtime telemetry into a safe diagnostic string.
 * Never includes user input, prompt text, or model output.
 */
function formatOllamaStats(res: Record<string, unknown>): string {
  const loadMs = typeof res.load_duration === "number" ? Math.round(res.load_duration / 1e6) : 0;
  const promptEvalMs = typeof res.prompt_eval_duration === "number" ? Math.round(res.prompt_eval_duration / 1e6) : 0;
  const evalMs = typeof res.eval_duration === "number" ? Math.round(res.eval_duration / 1e6) : 0;
  const evalTokens = typeof res.eval_count === "number" ? res.eval_count : 0;
  const tps = evalMs > 0 ? ((evalTokens / evalMs) * 1000).toFixed(1) : "N/A";

  return `load: ${loadMs}ms, prompt_eval: ${promptEvalMs}ms, eval: ${evalMs}ms, generated: ${evalTokens} tokens @ ${tps} t/s`;
}

/**
 * Attempts to parse and validate raw model text output against the FieldProtocol schema
 * AND deterministic quality rules (time budget and SPEC Section 6 safety).
 * Instruments precise execution timing for both validation phases.
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
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.map((step: Record<string, unknown>, idx: number) => ({
            id:
              typeof step.id === "string" && /^[a-zA-Z0-9_-]+$/.test(step.id.trim())
                ? step.id.trim()
                : `step-${idx + 1}`,
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

    // 1. Measure Zod schema structural validation
    const schemaStart = performance.now();
    const result = FieldProtocolSchema.safeParse(candidate);
    const schemaDuration = (performance.now() - schemaStart).toFixed(2);
    console.log(`[OpenField] schema validation: ${schemaDuration}ms`);

    if (!result.success) {
      const issueDetails = result.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      return { success: false, error: issueDetails };
    }

    // 2. Measure Deterministic Quality checks: Time budget & SPEC Section 6 safety rules
    const qualityStart = performance.now();
    const qualityCheck = validateProtocolQuality(result.data, input.minutes);
    const qualityDuration = (performance.now() - qualityStart).toFixed(2);
    console.log(`[OpenField] quality validation: ${qualityDuration}ms`);

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
 * Enforces Zod validation, time budget checks, and safety rules with full timing logs.
 */
export async function createProtocol(
  input: StudyInput
): Promise<CreateProtocolResult> {
  const model = getModelName();
  const userPrompt = buildProtocolUserPrompt(input);

  const options = {
    temperature: 1.0,
    top_p: 0.95,
    top_k: 64,
  };

  try {
    // Attempt 1
    console.log(`[OpenField] ollama attempt 1 started (model: ${model})`);
    const attempt1Start = performance.now();

    const firstResponse = await ollama.chat({
      model,
      messages: [
        { role: "system", content: PROTOCOL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      format: PROTOCOL_JSON_SCHEMA,
      options,
    });

    const attempt1Duration = Math.round(performance.now() - attempt1Start);
    const firstStats = formatOllamaStats(firstResponse as unknown as Record<string, unknown>);
    console.log(`[OpenField] ollama attempt 1 completed in ${attempt1Duration}ms (${firstStats})`);

    const firstRaw = firstResponse.message?.content || "";
    const firstCheck = validateRawProtocol(firstRaw, input);

    if (firstCheck.success) {
      console.log(`[OpenField] attempt 1 validation succeeded, no retry needed`);
      return { success: true, protocol: firstCheck.data };
    }

    // Attempt 2 (Retry once): Feed the validation / quality error back to the model
    console.log(`[OpenField] retry required: ${firstCheck.error}`);
    console.log(`[OpenField] ollama attempt 2 (retry) started`);

    const retryPrompt = buildProtocolRetryPrompt(
      userPrompt,
      firstRaw,
      firstCheck.error
    );

    const attempt2Start = performance.now();
    const retryResponse = await ollama.chat({
      model,
      messages: [
        { role: "system", content: PROTOCOL_SYSTEM_PROMPT },
        { role: "user", content: retryPrompt },
      ],
      format: PROTOCOL_JSON_SCHEMA,
      options,
    });

    const attempt2Duration = Math.round(performance.now() - attempt2Start);
    const retryStats = formatOllamaStats(retryResponse as unknown as Record<string, unknown>);
    console.log(`[OpenField] ollama attempt 2 completed in ${attempt2Duration}ms (${retryStats})`);

    const retryRaw = retryResponse.message?.content || "";
    const retryCheck = validateRawProtocol(retryRaw, input);

    if (retryCheck.success) {
      console.log(`[OpenField] attempt 2 validation succeeded`);
      return { success: true, protocol: retryCheck.data };
    }

    console.log(`[OpenField] attempt 2 validation failed: ${retryCheck.error}`);
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
