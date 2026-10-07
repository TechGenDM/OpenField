import { StudyInput } from "../schemas";

/**
 * System prompt setting OpenField rules, constraints, and safety guidelines
 * based on SPEC.md Section 6 and ARCHITECTURE.md.
 */
export const PROTOCOL_SYSTEM_PROMPT = `You are OpenField, an outdoor field study generator powered by local Gemma.
Your job is to convert the user's question into a structured, realistic outdoor field study protocol.

CORE RULES:
1. Steps: Provide EXACTLY 4 to 6 concrete, observable steps (never fewer than 4, never more than 6).
2. Time Budget: The entire study must realistically fit within the user's stated time limit (15, 30, 45, or 60 minutes). Never generate steps with durations that exceed or sum to more than the requested time budget.
3. No special equipment: Everything must be done by looking, listening, counting, or recording simple notes/photos.
4. Spoken Audio Script: Include a warm, calm, short spoken script (audioScript) of 3-5 sentences that briefs the user before they step outside.
5. Evidence types allowed for steps: "photo", "note", "count", "measurement".

SAFETY RULES (SPEC SECTION 6 - STRICTLY ENFORCED):
- Public, legal, easily accessible places only. No trespassing, no walking along train tracks, no water edges, no climbing trees/rocks/structures, no roads without footpaths.
- Daytime assumption unless specified. Shorter studies if user notes hot/rainy/late conditions.
- Do not touch or disturb wildlife or plants. Non-invasive observation only. No tasting, no collecting leaves, flowers, or samples.
- No instruction may require using the phone while walking. The user walks with the screen off. Always instruct the user to come to a safe stop before taking a note or photo.
- Include one prominent, practical outdoor safety note (safetyNote).
- Never ask the user to record precise personal locations.

Output must strictly adhere to the requested JSON structure.`;

/**
 * Builds the user prompt for protocol generation with explicit time and safety guidance.
 */
export function buildProtocolUserPrompt(input: StudyInput): string {
  const approxPerStep = Math.max(2, Math.floor(input.minutes / 5));

  return `Generate an outdoor field study protocol for the following request:
- Research Question: "${input.question}"
- Study Location / Environment: "${input.place}"
- Available Time: ${input.minutes} minutes (each of the 4-6 steps should take approx ${approxPerStep} minutes; do not exceed ${input.minutes} minutes total)
- Study Category: ${input.type}

Remember:
- Provide between 4 and 6 sequential investigation steps.
- Set realistic instructions that comfortably fit within ${input.minutes} minutes total.
- Ensure every step requires stopping safely first before recording notes or photos.
- Non-invasive observation only (no picking, tasting, collecting, or touching plants/animals).
- Follow all safety rules.`;
}

/**
 * Builds the retry prompt if the model's output failed schema validation, time budget, or safety checks.
 */
export function buildProtocolRetryPrompt(
  originalUserPrompt: string,
  rawOutput: string,
  validationError: string
): string {
  return `${originalUserPrompt}

IMPORTANT: Your previous output failed validation or quality checks:
${validationError}

Previous output was:
${rawOutput}

Please correct the issues and output valid JSON conforming strictly to the schema with 4 to 6 steps, adhering fully to the time budget and all SPEC Section 6 safety rules.`;
}

/**
 * JSON Schema for Ollama structured output
 */
export const PROTOCOL_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    researchQuestion: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          instruction: { type: "string" },
          evidence: {
            type: "string",
            enum: ["photo", "note", "count", "measurement"],
          },
          required: { type: "boolean" },
        },
        required: ["id", "instruction", "evidence", "required"],
      },
    },
    evidenceNeeded: {
      type: "array",
      items: { type: "string" },
    },
    safetyNote: { type: "string" },
    audioScript: { type: "string" },
  },
  required: [
    "title",
    "researchQuestion",
    "steps",
    "evidenceNeeded",
    "safetyNote",
    "audioScript",
  ],
};
