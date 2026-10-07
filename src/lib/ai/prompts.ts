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
/**
 * Debrief System Prompt setting OpenField honesty, evidence analysis, and citation rules
 * based on SPEC.md Section 5, ARCHITECTURE.md, and TASK #4.2 latency/reliability requirements.
 */
export const DEBRIEF_SYSTEM_PROMPT = `You are OpenField Debrief, a local field-study research analyst powered by local Gemma.
Analyze the user's outdoor study based ONLY on the evidence provided (notes, counts, measurements, and photos).

CRITICAL RULES:
1. FINDINGS vs UNCERTAIN:
   - "findings" contains ONLY positive facts directly backed by user evidence. Every finding MUST contain at least one valid ID in "evidenceRefs".
   - NEVER create a finding for uncompleted steps or missing observations. If evidence is lacking or a step was not performed, place that statement under "uncertain" ONLY.
   - Every "evidenceRefs" entry MUST be an exact match to a provided Step ID (step-1 ... step-N) or Photo ID. Never cite an unlisted ID.
2. HONESTY SECTIONS:
   - "observed": Concise list of what the user recorded or photographed (no speculation).
   - "inferred": Concise logical hypotheses derived from observations (labelled as inference).
   - "uncertain": Gaps, uncompleted steps, missing measurements, and unverified aspects.
   - Refuse to invent measurements (temperatures, decibels, counts), exact species, or locations.
3. CONCISENESS & FORMAT:
   - Output ONLY one valid JSON object. No markdown fences, no text commentary.
   - "findings": 2-4 short claims (1 sentence each).
   - "observed": 1-4 concise bullet points.
   - "inferred": 1-3 concise hypotheses.
   - "uncertain": 1-3 concise limitation statements.
   - "nextQuestion": 1 concise follow-up research question.
   - Do NOT write long essays. Keep each statement concise.`;

/**
 * Builds the user prompt for debrief analysis with explicit citation mapping,
 * clear distinction between findings and uncertain, and strict conciseness constraints.
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
  const allowedStepIds = protocol.steps.map((s) => s.id);
  const allowedPhotoIds = photos.map((p) => p.id);
  const allowedIdsText = [...allowedStepIds, ...allowedPhotoIds].join(", ");

  const stepsText = protocol.steps
    .map((s) => `- ${s.id}: "${s.instruction}" (evidence: ${s.evidence})`)
    .join("\n");

  const observationsText = observations
    .map((obs) => {
      const parts = [`- ${obs.stepId}`];
      if (obs.note && obs.note.trim()) parts.push(`Note: "${obs.note.trim()}"`);
      if (obs.photoIds && obs.photoIds.length > 0)
        parts.push(`Photos: [${obs.photoIds.join(", ")}]`);
      if (obs.measured !== undefined)
        parts.push(`Measured/Counted: ${obs.measured ? "Yes" : "No"}`);
      return parts.join(" | ");
    })
    .join("\n");

  const photosListText =
    photos.length > 0
      ? photos.map((p) => `- Photo ID: "${p.id}"`).join("\n")
      : "None";

  return `STUDY DETAILS:
- Question: "${protocol.researchQuestion}"
- Location: "${protocol.title}"
- Duration: ${protocol.minutes} min | Type: ${protocol.type}

PROTOCOL STEPS:
${stepsText}

USER EVIDENCE COLLECTED:
${observationsText || "No user notes recorded."}

ATTACHED PHOTOS:
${photosListText}

ALLOWED EVIDENCE CITATION IDS (evidenceRefs):
[${allowedIdsText}]

TASK:
Generate a concise Field Report JSON adhering strictly to the schema:
1. Every claim in "findings" MUST have evidenceRefs citing one or more allowed IDs from [${allowedIdsText}].
2. If any step was not completed or evidence is missing, do NOT create a finding; record it under "uncertain" instead.
3. Keep findings to 2-4 short 1-sentence claims. Keep observed, inferred, and uncertain to 1-3 concise statements each.`;
}

/**
 * Builds the retry prompt if the model's debrief output failed validation or citation checks.
 * Enforces Requirement D & TASK #4.2: explicit allowed IDs, no raw text dump,
 * directing uncompleted steps to uncertain instead of empty findings.
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

IMPORTANT: Your previous output failed validation:
${validationError}

CORRECTION REQUIREMENTS:
1. Output ONLY one valid JSON object. Do not include markdown formatting, code fences (\`\`\`json or \`\`\`), or commentary.
2. Every finding in "findings" MUST contain at least one valid evidence reference from: [${allowedCitations}].
3. NEVER create a finding with empty evidenceRefs. If a step was not performed or evidence is lacking, place that statement in "uncertain" ONLY.
4. Do NOT cite IDs that do not exist (such as non-existent step or photo IDs).
5. Do NOT invent observations, temperatures, decibels, counts, or measurements that were not recorded.
6. Keep findings to 2-4 short claims. Keep observed, inferred, and uncertain concise (1-3 bullets each).`;
}

/**
 * JSON Schema for Ollama structured output (Debrief / Report)
 * Uses minItems: 1 on evidenceRefs to prevent empty citation arrays.
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
            minItems: 1,
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
