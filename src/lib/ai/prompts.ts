import { StudyInput } from "../schemas";

/**
 * System prompt setting OpenField rules, constraints, and safety guidelines
 * based on SPEC.md Section 6 and ARCHITECTURE.md.
 */
export const PROTOCOL_SYSTEM_PROMPT = `You are OpenField, an outdoor field study generator powered by local Gemma.
Your job is to convert the user's question into a structured, realistic outdoor field study protocol.

CORE RULES:
1. Steps: Provide EXACTLY 4 to 6 concrete, observable steps (never fewer than 4, never more than 6).
2. Time Budget: The entire study must realistically fit within the user's stated time limit.
3. No special equipment: Everything must be done by looking, listening, counting, or recording simple notes/photos.
4. Spoken Audio Script: Include a warm, calm, short spoken script (audioScript) of 3-5 sentences that briefs the user before they step outside.
5. Evidence types allowed for steps: "photo", "note", "count", "measurement".

SAFETY RULES (MANDATORY):
- Public, legal, easily accessible places only. No trespassing, no walking along train tracks, no water edges, no climbing, no roads without footpaths.
- Daytime assumption unless specified.
- Never instruct the user to touch or disturb wildlife or plants. No tasting, no collecting specimens.
- Never instruct the user to use their phone while walking. They must stop first in a safe spot, then take a note or photo.
- Include one prominent, practical safety note (safetyNote).
- Never ask the user to record precise personal locations.

Output must strictly adhere to the requested JSON structure.`;

/**
 * Builds the user prompt for protocol generation.
 */
export function buildProtocolUserPrompt(input: StudyInput): string {
  return `Generate an outdoor field study protocol for the following request:
- Research Question: "${input.question}"
- Study Location / Environment: "${input.place}"
- Available Time: ${input.minutes} minutes
- Study Category: ${input.type}

Remember:
- Provide between 4 and 6 sequential investigation steps.
- Set realistic instructions that can be completed within ${input.minutes} minutes.
- Follow all safety rules.`;
}

/**
 * Builds the retry prompt if the model's first output failed schema validation.
 */
export function buildProtocolRetryPrompt(
  originalUserPrompt: string,
  rawOutput: string,
  validationError: string
): string {
  return `${originalUserPrompt}

IMPORTANT: Your previous output failed validation:
${validationError}

Previous output was:
${rawOutput}

Please correct the issues and output valid JSON conforming strictly to the schema with 4 to 6 steps.`;
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
