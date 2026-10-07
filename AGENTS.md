# AGENTS.md — Rules for every AI coding agent on OpenField

OpenField is a local-AI "field study" engine: the user asks a question about the real world,
a local Gemma model turns it into a short outdoor investigation, the user goes outside with the
screen mostly off, then comes back with photos + notes and Gemma writes an honest field report.

## Read first (every new chat, every agent)
1. `SPEC.md` — what we are building and what we are NOT building
2. `ARCHITECTURE.md` — folders, data shapes, AI rules
3. `DECISIONS.md` — choices already made (do not re-debate them)
4. `TASKS.md` — do only the section called **CURRENT TASK**

## Hard rules
1. **Scope.** Do only the current task. If an idea is not in `SPEC.md`, do not build it. Suggest it in your summary instead.
2. **Stack is fixed:** Next.js (App Router) + TypeScript (strict) + Tailwind + Zod + official `ollama` JS client. No database. No new dependency without asking me first. Before installing any package, confirm it exists on npm and check its current version. Never invent package names or APIs. If unsure, say so.
3. **AI calls happen only on the server** inside `src/lib/ai/`. Never call a model from a React component. Model name always comes from `OPENFIELD_MODEL` in env.
4. **Never trust raw model output.** Every model response is parsed with a Zod schema from `src/lib/schemas.ts`. On failure: retry once with the validation error in the prompt, then return a typed error. Never `JSON.parse` and hope.
5. **Honesty rule (core of the product).** The report must keep three things separate: *observed* (user saw/recorded it), *inferred* (AI reasoning), *uncertain* (not enough evidence). The AI must never invent measurements, locations, species, or numbers the user did not provide.
6. **Privacy.** No secrets in code (use `.env.local`, never commit it). Strip EXIF/GPS from photos before using them. No analytics, no tracking. Photos go only to the local Ollama server.
7. **Safety.** Generated studies must follow the safety rules in `SPEC.md` section 6. Do not weaken them.
8. **Small steps.** One feature per commit. Conventional commit messages (`feat:`, `fix:`, `docs:`). Before saying "done", run `npm run lint`, `npm run typecheck` and `npm test`. If a script is missing, tell me instead of skipping it.
9. **No risky commands** (`rm -rf`, `git push --force`, editing `.env*` or git history) without asking.
10. **UI:** calm, minimal, mobile-first, large text, high contrast (it is used outdoors). Fewer screens beats more features.

## How to finish every task
End with a short summary:
- Files changed
- How I can test it myself (exact commands/clicks)
- Anything you were unsure about or assumed

Add a short comment explaining *why* at any tricky piece of code. I am a student and want to understand the code I ship.
