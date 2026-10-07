import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudyInput } from "../src/lib/schemas";
import { createProtocol, validateRawProtocol } from "../src/lib/ai/protocol";
import {
  validateTimeBudget,
  validateSafety,
  validateProtocolQuality,
} from "../src/lib/ai/quality";
import { ollama } from "../src/lib/ai/ollama";

describe("Protocol Quality: Time-Budget and Safety Enforcement", () => {
  describe("Deterministic Time Budget Validator", () => {
    it("accepts steps within the time budget", () => {
      const steps = [
        { id: "s1", instruction: "Stop at the entrance and observe for 3 minutes.", evidence: "note" as const, required: true },
        { id: "s2", instruction: "Walk to the bench and rest for 4 minutes.", evidence: "photo" as const, required: true },
        { id: "s3", instruction: "Count birds in the canopy for 3 minutes.", evidence: "count" as const, required: true },
        { id: "s4", instruction: "Conclude notes for 2 minutes before leaving.", evidence: "note" as const, required: true },
      ];
      const res = validateTimeBudget(steps, 15);
      expect(res.ok).toBe(true);
    });

    it("rejects when a single step exceeds the total budget", () => {
      const steps = [
        { id: "s1", instruction: "Stop and observe for 20 minutes.", evidence: "note" as const, required: true },
        { id: "s2", instruction: "Take a photo.", evidence: "photo" as const, required: true },
        { id: "s3", instruction: "Count fallen leaves.", evidence: "count" as const, required: true },
        { id: "s4", instruction: "Summarize findings.", evidence: "note" as const, required: true },
      ];
      const res = validateTimeBudget(steps, 15);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("exceeds the total study budget of 15 minutes");
      }
    });

    it("rejects when the sum of explicit durations exceeds total budget", () => {
      const steps = [
        { id: "s1", instruction: "Observe tree bark for 10 minutes.", evidence: "note" as const, required: true },
        { id: "s2", instruction: "Inspect soil moisture for 10 minutes.", evidence: "note" as const, required: true },
        { id: "s3", instruction: "Record leaf canopy for 15 minutes.", evidence: "photo" as const, required: true },
        { id: "s4", instruction: "Review notes for 5 minutes.", evidence: "note" as const, required: true },
      ];
      // Total = 40 minutes, but budget is 30 minutes
      const res = validateTimeBudget(steps, 30);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("exceed the requested 30-minute study budget");
      }
    });
  });

  describe("Deterministic Safety Validator", () => {
    const safeProtocolBase = {
      id: "safe-1",
      title: "Safe Study",
      researchQuestion: "What lichens grow on north-facing oak bark?",
      minutes: 15 as const,
      type: "nature" as const,
      evidenceNeeded: ["Photo of trunk", "Note of texture"],
      safetyNote: "Stay on marked paved footpaths and remain mindful of other pedestrians.",
      audioScript: "Step outside calmly. Find a safe tree near the public path.",
      steps: [
        { id: "s1", instruction: "Walk to an oak tree, come to a complete stop, and observe.", evidence: "note" as const, required: true },
        { id: "s2", instruction: "Remain stationary and take a clear photo of the bark.", evidence: "photo" as const, required: true },
        { id: "s3", instruction: "Count lichen patches from eye level without touching.", evidence: "count" as const, required: true },
        { id: "s4", instruction: "Record observations before moving to the next spot.", evidence: "note" as const, required: true },
      ],
    };

    it("accepts a fully compliant protocol", () => {
      const res = validateSafety(safeProtocolBase);
      expect(res.ok).toBe(true);
    });

    it("rejects if safety note is missing or too brief", () => {
      const invalid = { ...safeProtocolBase, safetyNote: "Be safe" };
      const res = validateSafety(invalid);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("insufficient safety note");
      }
    });

    it("rejects instructions that require phone while walking", () => {
      const invalid = {
        ...safeProtocolBase,
        steps: [
          ...safeProtocolBase.steps.slice(0, 3),
          { id: "s4", instruction: "Keep your eyes on the phone screen while walking down the path.", evidence: "note" as const, required: true },
        ],
      };
      const res = validateSafety(invalid);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("while walking");
      }
    });

    it("rejects instructions suggesting touching or tasting plants or wildlife", () => {
      const invalid = {
        ...safeProtocolBase,
        steps: [
          ...safeProtocolBase.steps.slice(0, 3),
          { id: "s4", instruction: "Pick leaves from the branch and taste the berries.", evidence: "note" as const, required: true },
        ],
      };
      const res = validateSafety(invalid);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("touching, tasting, or collecting");
      }
    });

    it("rejects climbing, trespassing, or water hazards", () => {
      const invalid = {
        ...safeProtocolBase,
        steps: [
          ...safeProtocolBase.steps.slice(0, 3),
          { id: "s4", instruction: "Climb the tree or wade into the stream for a closer view.", evidence: "photo" as const, required: true },
        ],
      };
      const res = validateSafety(invalid);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("climbing, water hazards, or trespassing");
      }
    });
  });

  describe("5 Representative Study Types (Mocked Ollama Flow)", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    const representativeCases: { name: string; input: StudyInput; mockResponse: object }[] = [
      {
        name: "1. Nature Study (15 min)",
        input: {
          question: "Which deciduous trees on my block have begun turning yellow or red?",
          place: "Maple Avenue pedestrian sidewalk",
          minutes: 15,
          type: "nature",
        },
        mockResponse: {
          title: "Autumn Foliage Transition on Maple Avenue",
          researchQuestion: "Which deciduous trees on my block have begun turning yellow or red?",
          steps: [
            { id: "s1", instruction: "Stand safely on the sidewalk near the corner and scan tree crowns.", evidence: "note", required: true },
            { id: "s2", instruction: "Stop at the first mature tree and take a clear photo of leaf canopy coloration.", evidence: "photo", required: true },
            { id: "s3", instruction: "Count how many distinct trees have over 25% turned leaves from your stationary viewpoint.", evidence: "count", required: true },
            { id: "s4", instruction: "Record a final comparison note while safely stopped at the crosswalk bench.", evidence: "note", required: true },
          ],
          evidenceNeeded: ["Canopy photo", "Leaf color estimate count", "Block transition summary note"],
          safetyNote: "Stay on public sidewalks at all times. Do not touch traffic or walk into roadways.",
          audioScript: "Step outside onto Maple Avenue. Keep your eyes on the trees above, pausing in safe spots to take in the changing colors.",
        },
      },
      {
        name: "2. Environment Study (30 min)",
        input: {
          question: "How does air temperature and shade differ between asphalt and grass?",
          place: "Community park boundary and parking lot edge",
          minutes: 30,
          type: "environment",
        },
        mockResponse: {
          title: "Microclimate Contrast: Asphalt vs Grass Canopy",
          researchQuestion: "How does air temperature and shade differ between asphalt and grass?",
          steps: [
            { id: "s1", instruction: "Stop at the paved walkway edge for 4 minutes and note radiant surface warmth.", evidence: "note", required: true },
            { id: "s2", instruction: "Capture a wide photo showing direct sunlight exposure on the asphalt.", evidence: "photo", required: true },
            { id: "s3", instruction: "Move to a shaded grassy lawn, stop for 5 minutes, and record perceived breeze and cooling.", evidence: "note", required: true },
            { id: "s4", instruction: "Take a ground-level photo comparing lawn shade with open ground.", evidence: "photo", required: true },
            { id: "s5", instruction: "Record an overall 5-minute debrief note while stationary on a park bench.", evidence: "note", required: true },
          ],
          evidenceNeeded: ["Sunlit asphalt photo", "Lawn shade photo", "Sensory microclimate notes"],
          safetyNote: "Remain on designated park walkways and avoid active vehicle movement zones in the parking area.",
          audioScript: "Step outside to explore how shade shapes our environment. Feel the air transition as you move between paved paths and open grass.",
        },
      },
      {
        name: "3. Sound Study (45 min)",
        input: {
          question: "What is the ratio of bird vocalizations to traffic hum during late morning?",
          place: "Neighborhood perimeter walking trail",
          minutes: 45,
          type: "sound",
        },
        mockResponse: {
          title: "Acoustic Mapping: Avian Chorus vs Traffic Hum",
          researchQuestion: "What is the ratio of bird vocalizations to traffic hum during late morning?",
          steps: [
            { id: "s1", instruction: "Stand still by the trail marker for 5 minutes with eyes gently resting and screen off.", evidence: "note", required: true },
            { id: "s2", instruction: "Count how many discrete bird calls you hear during a stationary 4-minute interval.", evidence: "count", required: true },
            { id: "s3", instruction: "Stop near the road buffer for 5 minutes and count passing vehicle acoustic events.", evidence: "count", required: true },
            { id: "s4", instruction: "Take a wide photo of the tree canopy creating the sound buffer.", evidence: "photo", required: true },
            { id: "s5", instruction: "Spend 5 stationary minutes noting which sound predominates before returning.", evidence: "note", required: true },
          ],
          evidenceNeeded: ["Bird call tally", "Traffic noise frequency tally", "Soundscape description notes"],
          safetyNote: "Remain alert to bicyclists and trail runners. Always step completely off the center line when listening.",
          audioScript: "Head out toward the perimeter trail. Turn your attention to sound, letting your ears pick out bird songs from the background hum of the town.",
        },
      },
      {
        name: "4. Neighborhood Study (30 min)",
        input: {
          question: "Where are the pedestrian pathway pinch-points and sidewalk curb ramps located?",
          place: "4th Street commercial and residential strip",
          minutes: 30,
          type: "neighborhood",
        },
        mockResponse: {
          title: "Pedestrian Infrastructure Accessibility Audit",
          researchQuestion: "Where are the pedestrian pathway pinch-points and sidewalk curb ramps located?",
          steps: [
            { id: "s1", instruction: "Stop at the start of the block and inspect the tactile paving and curb ramp angle.", evidence: "note", required: true },
            { id: "s2", instruction: "Take a photo of any walkway constriction such as utility poles or sandwich boards.", evidence: "photo", required: true },
            { id: "s3", instruction: "Count how many accessible curb ramps exist across the 4 corners of the intersection.", evidence: "count", required: true },
            { id: "s4", instruction: "Stop safely at the mid-block crossing and photograph the sidewalk surface condition.", evidence: "photo", required: true },
          ],
          evidenceNeeded: ["Curb ramp photo", "Pinch-point constriction photo", "Sidewalk ramp count"],
          safetyNote: "Only cross streets at marked crosswalks with pedestrian signals. Do not step into vehicle lanes.",
          audioScript: "Step outside to examine how our streets are designed for walking. Notice how curb ramps and sidewalk widths support movement.",
        },
      },
      {
        name: "5. Photography Study (60 min)",
        input: {
          question: "How do late afternoon shadows interact with architectural textures and brick surfaces?",
          place: "Historic downtown brick square",
          minutes: 60,
          type: "photography",
        },
        mockResponse: {
          title: "Late Afternoon Shadow Geometry on Brick Textures",
          researchQuestion: "How do late afternoon shadows interact with architectural textures and brick surfaces?",
          steps: [
            { id: "s1", instruction: "Walk to the square plaza and come to a halt to observe where building shadows fall.", evidence: "note", required: true },
            { id: "s2", instruction: "Take a high-contrast photo capturing the shadow boundary cutting across mortar joints.", evidence: "photo", required: true },
            { id: "s3", instruction: "Pause by an archway and document how glancing sunlight reveals masonry texture.", evidence: "photo", required: true },
            { id: "s4", instruction: "Count how many window lintels cast defined diagonal shadow lines across the facade.", evidence: "count", required: true },
            { id: "s5", instruction: "Take a concluding compositional photo framing the contrast between light and shade.", evidence: "photo", required: true },
            { id: "s6", instruction: "Sit on a public bench and write a 5-minute reflection on surface depth.", evidence: "note", required: true },
          ],
          evidenceNeeded: ["Facade shadow boundary photo", "Masonry texture detail photo", "High contrast arch photo"],
          safetyNote: "Remain in open public pedestrian plazas. Do not lean over ledges or step backwards into stairs without looking.",
          audioScript: "Step into the square with your camera ready. Watch how the low sun sculpts brick walls and carve deep shadows across the pavement.",
        },
      },
    ];

    for (const testCase of representativeCases) {
      it(`reliably creates a valid, safe protocol for: ${testCase.name}`, async () => {
        // Mock Ollama chat response
        vi.spyOn(ollama, "chat").mockResolvedValueOnce({
          message: {
            role: "assistant",
            content: JSON.stringify(testCase.mockResponse),
          },
        } as never);

        const result = await createProtocol(testCase.input);

        // Verification criteria:
        expect(result.success).toBe(true);
        if (!result.success) return;

        const protocol = result.protocol;

        // 1. Has 4-6 steps
        expect(protocol.steps.length).toBeGreaterThanOrEqual(4);
        expect(protocol.steps.length).toBeLessThanOrEqual(6);

        // 2. Contains safety note
        expect(typeof protocol.safetyNote).toBe("string");
        expect(protocol.safetyNote.length).toBeGreaterThanOrEqual(10);

        // 3. Contains evidence requirements
        expect(protocol.evidenceNeeded.length).toBeGreaterThan(0);
        protocol.steps.forEach((step) => {
          expect(["photo", "note", "count", "measurement"]).toContain(step.evidence);
        });

        // 4. Has the correct requested time
        expect(protocol.minutes).toBe(testCase.input.minutes);
        expect(protocol.type).toBe(testCase.input.type);

        // 5. Does not contain obviously unsafe instructions
        const qualityResult = validateProtocolQuality(protocol, testCase.input.minutes);
        expect(qualityResult.ok).toBe(true);

        // 6. Does not require the phone while walking
        protocol.steps.forEach((step) => {
          expect(step.instruction.toLowerCase()).not.toMatch(/while walking.*phone/);
          expect(step.instruction.toLowerCase()).not.toMatch(/phone.*while walking/);
        });
      });
    }
  });

  describe("Retry Flow on Quality Violations", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("triggers retry once when initial output violates safety, and succeeds on second compliant attempt", async () => {
      const input: StudyInput = {
        question: "Which bird species are calling?",
        place: "Public park trail",
        minutes: 15,
        type: "sound",
      };

      // Call 1: Unsafe step (instructs looking at phone while walking)
      const unsafeResponse = {
        title: "Bird Sound Study",
        researchQuestion: input.question,
        steps: [
          { id: "s1", instruction: "Listen for birds.", evidence: "note", required: true },
          { id: "s2", instruction: "Record bird songs on your phone while walking along the path.", evidence: "note", required: true },
          { id: "s3", instruction: "Count chirps.", evidence: "count", required: true },
          { id: "s4", instruction: "Take photo of tree.", evidence: "photo", required: true },
        ],
        evidenceNeeded: ["Bird note"],
        safetyNote: "Stay on trail.",
        audioScript: "Listen to the birds outside.",
      };

      // Call 2: Corrected safe step (instructs stopping first)
      const safeResponse = {
        ...unsafeResponse,
        steps: [
          { id: "s1", instruction: "Stop at the trailhead and listen quietly.", evidence: "note", required: true },
          { id: "s2", instruction: "Stand stationary and record bird song notes safely.", evidence: "note", required: true },
          { id: "s3", instruction: "Count distinct calls from your position.", evidence: "count", required: true },
          { id: "s4", instruction: "Take a photo of the tree canopy from the bench.", evidence: "photo", required: true },
        ],
        safetyNote: "Remain on the public trail and step aside for bicycles.",
      };

      const chatSpy = vi
        .spyOn(ollama, "chat")
        .mockResolvedValueOnce({ message: { role: "assistant", content: JSON.stringify(unsafeResponse) } } as never)
        .mockResolvedValueOnce({ message: { role: "assistant", content: JSON.stringify(safeResponse) } } as never);

      const result = await createProtocol(input);

      // Verify that chat was called twice (attempt 1 + retry attempt 2)
      expect(chatSpy).toHaveBeenCalledTimes(2);

      // Verify second call prompt contained the safety violation instruction
      const secondCallPrompt = chatSpy.mock.calls[1]?.[0]?.messages?.[1]?.content ?? "";
      expect(secondCallPrompt).toContain("Safety violation");

      // Final result succeeded with safe protocol
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.protocol.steps[1].instruction).toContain("Stand stationary");
      }
    });

    it("returns typed INVALID_MODEL_OUTPUT error when both attempts fail quality checks", async () => {
      const input: StudyInput = {
        question: "Which plants are growing?",
        place: "Park footpath",
        minutes: 15,
        type: "nature",
      };

      // Both attempts contain a time budget violation (e.g. 30 minutes in a 15-minute study)
      const overBudgetResponse = {
        title: "Plant Study",
        researchQuestion: input.question,
        steps: [
          { id: "s1", instruction: "Observe plants for 25 minutes.", evidence: "note", required: true },
          { id: "s2", instruction: "Examine moss for 10 minutes.", evidence: "note", required: true },
          { id: "s3", instruction: "Count ferns.", evidence: "count", required: true },
          { id: "s4", instruction: "Take a photo of the canopy.", evidence: "photo", required: true },
        ],
        evidenceNeeded: ["Plant notes"],
        safetyNote: "Stay on marked park footpaths.",
        audioScript: "Explore the flora around you.",
      };

      vi.spyOn(ollama, "chat").mockResolvedValue({
        message: { role: "assistant", content: JSON.stringify(overBudgetResponse) },
      } as never);

      const result = await createProtocol(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_MODEL_OUTPUT");
        expect(result.error.details).toContain("exceeds the total study budget of 15 minutes");
      }
    });
  });
});
