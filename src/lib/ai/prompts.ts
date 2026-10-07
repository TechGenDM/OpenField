import { StudyInput, FieldProtocol, Observation } from "../schemas";

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
 * JSON Schema for Ollama structured output (Protocol)
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

/**
 * Debrief System Prompt setting OpenField honesty, evidence analysis, and citation rules
 * based on SPEC.md Section 5 and ARCHITECTURE.md.
 */
export const DEBRIEF_SYSTEM_PROMPT = `You are OpenField Debrief, a local field-study research analyst powered by local Gemma.
Your job is to analyze the user's completed outdoor field investigation based ONLY on the evidence they provided (notes, counts, measurements, and photos).

CRITICAL HONESTY RULES (SPEC SECTION 5 & AGENTS.md):
1. SEPARATE THREE CATEGORIES STRICTLY:
   - "observed": Things the user recorded, saw, heard, counted, or photographed directly in the field.
   - "inferred": AI interpretations, logical deductions, or hypotheses derived from the observations. Clearly state this is inference.
   - "uncertain": Gaps in the evidence, missing measurements, unconfirmed identifications, or unanswerable aspects of the research question.
2. REFUSE TO INVENT EVIDENCE:
   - Never invent measurements (temperatures, decibels, distances, weights), weather readings, counts, or exact species names that the user did not record.
   - If no real measurements were taken, you MUST explicitly state so in the "uncertain" section (e.g., "No instrumented temperature, sound, or physical measurements recorded").
   - It is correct, honest, and expected to state "Not enough evidence" whenever observations are insufficient.
3. FINDINGS AND CITATIONS:
   - For every finding in "findings", provide a concrete claim, a confidence level ("low", "medium", or "high"), and an "evidenceRefs" array.
   - "evidenceRefs" MUST ONLY contain valid IDs from the investigation: either a step ID (e.g., "step-1") or a photo ID (e.g., "photo-1"). Do not invent non-existent IDs.
4. EVIDENCE SUMMARY:
   - Count the total photos, notes, and measurements provided by the user in "evidenceSummary".
5. NEXT QUESTION:
   - Suggest a single, compelling follow-up research question (nextQuestion) that builds directly upon what was learned and what remains uncertain.

Output must strictly adhere to the requested JSON schema.`;

/**
 * Builds the user prompt for debrief analysis with clear steps, observations, and attached photo IDs.
 */
export function buildDebriefUserPrompt({
  protocol,
  observations,
  photos = [],
}: {
  protocol: FieldProtocol;
  observations: Observation[];
  photos?: { id: string }[];
}): string {
  const stepsText = protocol.steps
    .map(
      (s) =>
        `- Step ID: ${s.id} | Instruction: "${s.instruction}" | Expected Evidence: ${s.evidence}`
    )
    .join("\n");

  const observationsText = observations
    .map((obs) => {
      const parts = [`- Step ID: ${obs.stepId}`];
      if (obs.note && obs.note.trim()) parts.push(`Note: "${obs.note.trim()}"`);
      if (obs.photoIds && obs.photoIds.length > 0)
        parts.push(`Attached Photos: ${obs.photoIds.join(", ")}`);
      if (obs.measured !== undefined)
        parts.push(`Measured/Counted: ${obs.measured ? "Yes" : "No"}`);
      return parts.join(" | ");
    })
    .join("\n");

  const photosListText =
    photos.length > 0
      ? photos.map((p, i) => `- Photo ${i + 1} ID: "${p.id}"`).join("\n")
      : "No photos provided.";

  return `Please evaluate the following completed outdoor field study:
Research Question: "${protocol.researchQuestion}"
Location / Setting: "${protocol.title}"
Duration: ${protocol.minutes} minutes
Study Type: ${protocol.type}

INVESTIGATION PROTOCOL STEPS:
${stepsText}

USER FIELD OBSERVATIONS & EVIDENCE:
${observationsText || "No user notes recorded."}

ATTACHED PHOTOS (${photos.length} total):
${photosListText}

Please write an honest Field Report adhering to all rules:
- Only cite valid step IDs (${protocol.steps.map((s) => s.id).join(", ")}) or photo IDs (${photos.map((p) => p.id).join(", ") || "none"}) in evidenceRefs.
- Separate observed facts from AI inferences from uncertainties.
- If measurements were missing, state this clearly in "uncertain".`;
}

/**
 * Builds the retry prompt if the model's debrief output failed validation or citation checks.
 * Enforces Requirement D: output only one JSON object, no markdown/fences, exact canonical IDs,
 * no hallucinated citations or measurements, and includes the exact validation error.
 */
export function buildDebriefRetryPrompt(
  originalUserPrompt: string,
  validationError: string,
  canonicalStepIds: string[],
  photoIds: string[] = []
): string {
  const allowedCitations = [
    ...canonicalStepIds,
    ...(photoIds.length > 0 ? photoIds : []),
  ].join(", ");

  return `${originalUserPrompt}

IMPORTANT: Your previous output failed validation or citation checks:
${validationError}

CORRECTION REQUIREMENTS:
1. Output ONLY one valid JSON object. Do not include markdown formatting, code fences (\`\`\`json or \`\`\`), or commentary.
2. Every evidence reference in "evidenceRefs" MUST EXACTLY match one of the supplied canonical IDs: [${allowedCitations}].
3. Do NOT cite IDs that do not exist (such as non-existent step or photo IDs).
4. Do NOT invent observations, temperatures, decibels, counts, or measurements that were not recorded.
5. Adhere strictly to the honesty rules (separate observed vs inferred vs uncertain, and state missing evidence in uncertain).`;
}

/**
 * JSON Schema for Ollama structured output (Debrief / Report)
 */
export const REPORT_JSON_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          evidenceRefs: {
            type: "array",
            items: { type: "string" },
          },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
        required: ["claim", "evidenceRefs", "confidence"],
      },
    },
    observed: {
      type: "array",
      items: { type: "string" },
    },
    inferred: {
      type: "array",
      items: { type: "string" },
    },
    uncertain: {
      type: "array",
      items: { type: "string" },
    },
    evidenceSummary: {
      type: "object",
      properties: {
        photos: { type: "integer" },
        notes: { type: "integer" },
        measurements: { type: "integer" },
      },
      required: ["photos", "notes", "measurements"],
    },
    nextQuestion: { type: "string" },
  },
  required: [
    "findings",
    "observed",
    "inferred",
    "uncertain",
    "evidenceSummary",
    "nextQuestion",
  ],
};
