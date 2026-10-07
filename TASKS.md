# TASKS.md — OpenField Development Roadmap

## CURRENT TASK: #6 Open-Source / Hacktoberfest Polish

**Goal:** Complete documentation polish, create open-source contributor onboarding guides, align project specifications with the completed MVP, and prepare OpenField for Hacktoberfest 2026.

**Status:** IN PROGRESS
- [x] Complete documentation/repository audit.
- [x] Add standard MIT `LICENSE` (Copyright 2026 OpenField Contributors).
- [x] Create `CONTRIBUTING.md` with development setup, PR expectations, and strict anti-scope guardrails.
- [x] Update `.env.example` with detailed model selection documentation (`gemma4:e4b`, `gemma4:e2b`, `gemma4:12b`).
- [x] Rewrite `README.md` as primary public-facing guide covering philosophy, 5-step loop, local AI architecture, honest reports, and quickstart.
- [x] Synchronize `SPEC.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `package.json`.
- [x] Verify all automated checks pass (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).

---

## Completed Tasks

### [x] Task #1: Create Study → Local Gemma → Structured Field Protocol
- Next.js App Router, strict TypeScript, Tailwind CSS, Zod, and official `ollama` client.
- Implemented `/api/study` server route calling local Gemma with schema-constrained JSON output.
- Screen 1 (Create Study) and Screen 2 (Field Protocol display with printable Field Card).
- Protocol validation with single automatic retry on malformed outputs.

### [x] Task #2: Protocol Quality & Safety Enforcement
- Deterministic quality validation rules in `src/lib/ai/quality.ts`: time budget validation, 4–6 steps constraint, public accessibility checks, and mandatory safety note.
- Added comprehensive unit tests in `tests/protocol-quality.test.ts`.

### [x] Task #3: Field Mode Experience
- Screen 3 (`/study/[id]/field`): High-contrast, near-black, screen-minimizing UI.
- Large countdown timer without interval drift (`src/lib/timer.ts`).
- Step navigation controls and Web Speech API audio briefing fallback.

### [x] Task #3.1: Polish Field Mode & Layout Isolation
- Fixed layout isolation so Field Mode stays immersive and distinct from standard app navigation.
- Accessible SVG iconography and responsive timer controls.

### [x] Task #4: Return Screen → Evidence Processing → Multimodal Vision Debrief → Field Report
- Screen 4 (`/study/[id]/return`): Observation recording per step and multi-photo upload.
- Client-side image canvas processing in `src/lib/image.ts`: resizing to 1024px and stripping EXIF/GPS metadata before saving to localStorage or sending to server.
- Server route `/api/debrief`: Multi-photo local multimodal inference with Gemma.
- Screen 5 (`/study/[id]/report`): Honest Field Report rendering the 5 distinct sections:
  1. Key Findings with mandatory evidence citations (`evidenceRefs`)
  2. Observed (facts recorded directly by user)
  3. Inferred (AI reasoning)
  4. Uncertain (missing evidence, incomplete steps, unverified assertions)
  5. Next Investigation (suggested follow-up question)

### [x] Task #4.1: Fix Real E2E Debrief Failures & Protocol Step IDs
- Harmonized step IDs across protocol generator and prompt templates (`step-1`, `step-2`, ...).
- Implemented robust balanced-brace JSON extraction (`src/lib/ai/json.ts`) to avoid parsing errors on model conversational wrappers.

### [x] Task #4.2: Debrief Reliability & Latency Optimization
- Added `minItems: 1` constraint on `evidenceRefs` in Ollama structured output schema to prevent empty citation arrays.
- Reinforced system prompt to route incomplete steps to `uncertain` rather than generating uncited findings.
- Enforced concise report generation (2–4 findings, 1–3 bullets per section) to eliminate latency inflation on local hardware.

---

## Current Verification Status
- **Unit & Quality Tests (`npm test`)**: 72/72 tests passing across 6 test suites.
- **Code Quality (`npm run lint`)**: ESLint clean, 0 errors.
- **TypeScript (`npm run typecheck`)**: Strict mode passing, 0 errors.
- **Production Build (`npm run build`)**: Compiled and optimized successfully.
- **Manual Verification**: Full end-to-end loop tested and verified with local `gemma4:e4b`.
- **MVP State**: Application code is FROZEN.

---

## Future Backlog (Post-Hacktoberfest / Optional Extensions)
- Voice briefing generation using ElevenLabs (generate once before study, cache as mp3).
- Telemetry tracing for local Ollama calls using Sentry spans (metadata only, no photos/notes).
- Workflow orchestration wrapping via Mastra.
