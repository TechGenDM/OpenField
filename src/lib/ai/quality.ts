import { FieldProtocol, ProtocolStep } from "../schemas";

/**
 * Lightweight deterministic time-budget validation.
 * Checks whether step instructions specify explicit durations that exceed
 * the user's allocated study time (15, 30, 45, or 60 minutes).
 */
export function validateTimeBudget(
  steps: ProtocolStep[],
  maxMinutes: number
): { ok: true } | { ok: false; reason: string } {
  let totalExplicitMinutes = 0;

  for (const step of steps) {
    const text = step.instruction;

    // Match explicit hour mentions (e.g., "1 hour", "1.5 hrs")
    const hourMatches = text.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/gi);
    for (const match of hourMatches) {
      const hrs = parseFloat(match[1]);
      if (!isNaN(hrs)) {
        const stepMinutes = hrs * 60;
        if (stepMinutes > maxMinutes) {
          return {
            ok: false,
            reason: `Step "${step.id}" specifies a duration of ${stepMinutes} minutes, which exceeds the total study budget of ${maxMinutes} minutes.`,
          };
        }
        totalExplicitMinutes += stepMinutes;
      }
    }

    // Match explicit minute mentions (e.g., "20 minutes", "25 mins")
    const minuteMatches = text.matchAll(/(\d+)\s*(?:minutes?|mins?)\b/gi);
    for (const match of minuteMatches) {
      const mins = parseInt(match[1], 10);
      if (!isNaN(mins)) {
        if (mins > maxMinutes) {
          return {
            ok: false,
            reason: `Step "${step.id}" specifies a duration of ${mins} minutes, which exceeds the total study budget of ${maxMinutes} minutes.`,
          };
        }
        totalExplicitMinutes += mins;
      }
    }
  }

  // If explicit minutes were specified and their sum exceeds the budget
  if (totalExplicitMinutes > maxMinutes) {
    return {
      ok: false,
      reason: `Total explicit step durations (${totalExplicitMinutes} minutes) exceed the requested ${maxMinutes}-minute study budget.`,
    };
  }

  return { ok: true };
}

/**
 * Lightweight deterministic safety validation against SPEC.md Section 6:
 * - One plain safety note required (> 10 characters).
 * - No phone usage while walking (must stop first before screen/note/photo).
 * - No touching, tasting, or collecting wildlife or plants.
 * - No trespassing, climbing trees/structures, wading into water, or walking in road traffic.
 */
export function validateSafety(
  protocol: FieldProtocol
): { ok: true } | { ok: false; reason: string } {
  // 1. Mandatory plain safety note
  if (!protocol.safetyNote || protocol.safetyNote.trim().length < 10) {
    return {
      ok: false,
      reason: "Missing or insufficient safety note. Every protocol must include a clear outdoor safety note.",
    };
  }

  // 2. Check each step instruction against SPEC Section 6 safety rules
  for (const step of protocol.steps) {
    const instruction = step.instruction.toLowerCase();

    // Check for phone use while walking
    const phoneWhileWalking =
      /(?:while|as you)\s+(?:walking|moving|strolling|jogging).*?(?:phone|screen|app|type|note|record)|(?:phone|screen|app|note|record|type).*?(?:while|as you)\s+(?:walking|moving|strolling|jogging)/i;
    if (phoneWhileWalking.test(instruction)) {
      return {
        ok: false,
        reason: `Safety violation in step "${step.id}": Instructs using phone/screen while walking. The protocol must direct the user to come to a stop before recording or taking photos.`,
      };
    }

    // Check for touching, tasting, or collecting wildlife or plants
    const harmFloraFauna =
      /\b(?:taste|eat|ingest|consume)\b|\b(?:pick|collect|pluck|harvest|gather)\s+(?:any\s+)?(?:leaves?|flowers?|plants?|berries?|mushrooms?|specimens?|samples?)\b|\b(?:touch|pet|grab|capture|catch|disturb|trap)\s+(?:any\s+)?(?:wildlife|animals?|birds?|insects?|creatures?|snakes?)\b/i;
    if (harmFloraFauna.test(instruction)) {
      return {
        ok: false,
        reason: `Safety violation in step "${step.id}": Suggests touching, tasting, or collecting plants or wildlife. OpenField studies are non-invasive observation only.`,
      };
    }

    // Check for climbing, water edges / wading, trespassing, roads without footpaths
    const dangerousHazards =
      /\b(?:trespass|private\s+property|hop\s+(?:the\s+)?fence|climb\s+over\s+fence)\b|\b(?:climb\s+(?:the\s+)?(?:trees?|rocks?|boulders?|walls?|structures?))\b|\b(?:wade|step\s+into\s+water|walk\s+into\s+(?:the\s+)?(?:water|stream|river|lake|pond|ocean|canal))\b|\b(?:walk\s+(?:in|along)\s+(?:the\s+)?(?:highway|freeway|busy\s+road\s+without\s+footpath|traffic\s+lanes?))\b/i;
    if (dangerousHazards.test(instruction)) {
      return {
        ok: false,
        reason: `Safety violation in step "${step.id}": Mentions dangerous terrain, climbing, water hazards, or trespassing. Studies must take place in safe, public, accessible areas only.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Validates protocol quality (time budget + safety rules).
 */
export function validateProtocolQuality(
  protocol: FieldProtocol,
  maxMinutes: number
): { ok: true } | { ok: false; reason: string } {
  const timeCheck = validateTimeBudget(protocol.steps, maxMinutes);
  if (!timeCheck.ok) {
    return timeCheck;
  }

  const safetyCheck = validateSafety(protocol);
  if (!safetyCheck.ok) {
    return safetyCheck;
  }

  return { ok: true };
}
