/**
 * Robustly extracts a JSON object substring from raw model output.
 * Handles markdown code fences (```json ... ```) and conversational preambles
 * without confusing braces inside JSON string literals.
 */
export function extractJsonObject(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return rawText;

  // 1. Fast path: directly valid JSON
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Continue to fence and brace extraction
  }

  // 2. Strip markdown code fences if present
  let unfenced = trimmed;
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;
  const match = fenceRegex.exec(trimmed);
  if (match && match[1]) {
    unfenced = match[1].trim();
    try {
      JSON.parse(unfenced);
      return unfenced;
    } catch {
      // Continue to brace extraction on unfenced text
    }
  }

  // 3. Balanced brace scanner that accounts for quotes and escape characters
  const firstBrace = unfenced.indexOf("{");
  if (firstBrace === -1) {
    return unfenced;
  }

  let inString = false;
  let escape = false;
  let depth = 0;
  let endBrace = -1;

  for (let i = firstBrace; i < unfenced.length; i++) {
    const char = unfenced[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          endBrace = i;
          break;
        }
      }
    }
  }

  if (endBrace !== -1) {
    const candidate = unfenced.slice(firstBrace, endBrace + 1).trim();
    return candidate;
  }

  return unfenced;
}
