# TASKS.md

## CURRENT TASK: #1 Create Study -> local Gemma -> structured Field Protocol

**Goal:** On screen 1, the user fills the form, clicks Create Field Study, and sees a validated
FieldProtocol rendered on screen 2.

**Do:**
1. Create the Next.js app (App Router, TypeScript strict, Tailwind). Add `zod` and `ollama`.
2. `src/lib/schemas.ts`: `StudyInput` and `FieldProtocol` exactly as in ARCHITECTURE.md.
3. `src/lib/ai/ollama.ts`: one client using `OLLAMA_HOST` and `OPENFIELD_MODEL`.
4. `src/lib/ai/prompts.ts` + `protocol.ts`: `createProtocol(input)` using structured output, Zod validation, one retry.
5. `POST /api/study`: validate input, call `createProtocol`, return protocol or typed error.
6. Screen 1 form + screen 2 display. Save protocol in browser storage.
7. One test: schema rejects a protocol with 2 steps or 9 steps.

**Acceptance:** works end to end with `ollama` running; clear error if Ollama is off; no AI call from components; lint + typecheck + test pass.
**Do NOT** build Field Mode, audio, photos, Mastra or Sentry yet.

### Paste this into Antigravity to start
> Read AGENTS.md, SPEC.md, ARCHITECTURE.md, DECISIONS.md and TASKS.md. Do only CURRENT TASK #1. Before writing code, show me a short plan (files you will create, packages you will install and their current versions). Wait for my "go". Then build it and finish with the summary format from AGENTS.md.

## Plan (today is Oct 7; keep one buffer day)
- [ ] **Oct 7** Task 1 above. Then Task 2: protocol quality (time budget check, safety rules, 5 test questions)
- [ ] **Oct 8** Field Mode + Field Card + ElevenLabs mp3. **Do a real outdoor test.**
- [ ] **Oct 9** Return screen, photo resize + EXIF strip, Gemma vision debrief, Report screen. Second real test
- [ ] **Oct 10** Sentry spans, Mastra wrapper, README, demo video draft, article draft with REAL results
- [ ] **Oct 11** Fix only real bugs, final video, publish article, submit early (check official cutoff)

## Backlog (only if everything above is done)
SerpApi pre-study context, Render deploy.
