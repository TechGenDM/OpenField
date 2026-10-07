# DECISIONS.md — Architectural Decision Record (ADR)

| # | Decision | Why |
|---|---|---|
| 1 | Product = "field study" engine, not an outdoor recommender | The challenge feed is crowded with walk planners, identifiers, and scavenger hunts. OpenField focuses on systematic inquiry. |
| 2 | Local Gemma via Ollama is the core (P0) | Eliminates cloud dependencies and API costs; guarantees strict privacy; local execution is the product's identity. |
| 3 | Default model `gemma4:e4b`, never `:cloud` tags | Balanced multimodal vision debriefing that runs on consumer laptops without transmitting data externally. |
| 4 | Next.js + TypeScript + Zod, no database | Eliminates backend setup overhead; state stays in browser localStorage; fastest path to reliable MVP. |
| 5 | "Screen-minimizing" Field Mode + printable Field Card | A web application cannot forcibly lock phone hardware; honest terminology describes a low-attention UI designed to reduce screen usage. |
| 6 | Phone field use via local Wi-Fi or offline Field Card | Ollama runs on the laptop. Phone does not need Ollama installed; timer runs client-side during field observation. |
| 7 | ElevenLabs audio generated once before leaving and saved as mp3 | Requires internet connection; must never block or be required during offline field observation. |
| 8 | Mastra is added AFTER core flow works, as an optional wrapper | Workflow abstractions must never delay or destabilize working core logic. |
| 9 | Sentry: metadata only, never photos/notes/locations | Preserves privacy and zero-leakage principles. |
| 10 | Skipped: TabPFN, Tinker, Arduino, MongoDB, Temporal, Tiger Data, Backboard | No genuine alignment with product requirements; forced integrations dilute architectural clarity. |
| 11 | Report separates Observed / Inferred / Uncertain | Core differentiator: ensures model honesty, forbids hallucinated measurements, and provides transparent scientific value. |
| 12 | Schema grammar constraints (`minItems: 1`) & balanced-brace JSON extraction | Enforces valid citations at token generation time and recovers valid JSON payloads even when models emit conversational prefixes. |
| 13 | Indoor & outdoor versatile study phrasing | Expands utility to domestic acoustics, lighting gradients, and home microclimates without compromising calm focus. |
| 14 | Client-side EXIF/GPS stripping via HTML5 Canvas | Discards location coordinates and camera metadata before images reach the server route or local Ollama. |
| 15 | Strict anti-scope: No auth, no cloud DB, no live GPS | Prevents bloat; keeps the codebase accessible, secure, and maintainable for open-source contributors. |

---

## Cut Order If Time Runs Out
SerpApi/Render → Mastra → Sentry → ElevenLabs.
**Never cut:** Local Gemma, real empirical test, README, test suites.
