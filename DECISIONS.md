# DECISIONS.md — choices already made (add new ones at the bottom)

| # | Decision | Why |
|---|---|---|
| 1 | Product = "field study" engine, not an outdoor recommender | The #hf26challenge feed is crowded with walk planners, identifiers and scavenger hunts |
| 2 | Local Gemma via Ollama is the core (P0) | Remove the AI and the product stops working; strong privacy story |
| 3 | Default model `gemma4:e4b`, never `:cloud` tags | Runs on normal laptops; cloud tags are not local |
| 4 | Next.js + TypeScript + Zod, no database | Fastest path; data stays in the browser |
| 5 | "Screen-off" = near-black Field Mode + audio + printable Field Card | A web page cannot turn the phone screen off; honest wording matters |
| 6 | Phone is used on home Wi-Fi only; outside = audio + card | Ollama runs on the laptop |
| 7 | ElevenLabs audio is generated once before leaving and saved as mp3 | Needs internet; must not be needed outside |
| 8 | Mastra is added AFTER the core flow works, as a wrapper | A framework must never block the product |
| 9 | Sentry: metadata only, never photos/notes/locations | Privacy |
| 10 | Skipped: TabPFN, Tinker, Arduino, MongoDB, Temporal, Tiger Data, Backboard | No genuine use; forcing them hurts the article |
| 11 | Report separates observed / inferred / uncertain | Our honest-AI differentiator and the article's best story |

## Cut order if time runs out (cut first at the top)
SerpApi/Render -> Mastra -> Sentry -> ElevenLabs. Never cut: Gemma, real outdoor test, README, article.

## Open questions (fill in)
- Laptop RAM/GPU (decides which Gemma size): ____
- Exact official submission cutoff time + timezone: ____
