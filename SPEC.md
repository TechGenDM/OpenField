# SPEC.md — OpenField Specification

> **Ask a question about the real world. OpenField turns it into a field study.**

OpenField is **not** an outdoor recommender, walk planner, or species identifier app.
It is a local-AI engine that turns curiosity into a short, structured investigation, then honestly
reports what the evidence does and does not show.

---

## 1. The Loop
Question → Gemma writes a Field Protocol → (optional voice briefing) → conduct study with screen minimized → come back with photos + notes → Gemma writes an honest Field Report (observed / inferred / uncertain).

---

## 2. Who It Is For
Anyone curious about their surroundings (outdoors or indoors) who wants a reason to step away from screen immersion.
Demo user: the builder, conducting real studies in their neighborhood or home environment.

---

## 3. MVP Screens (Built & Frozen)
| # | Screen | What It Does |
|---|---|---|
| 1 | Create Study (`/`) | Inputs: question, place (free text), time (15/30/45/60 min), study type (Nature, Environment, Sound, Neighborhood, Photography). Button: Create Field Study. |
| 2 | Field Protocol (`/study/[id]`) | Shows research question, 4–6 steps, evidence needed, safety note, time estimate. Buttons: Start Field Study, Save / Print Field Card. |
| 3 | Field Mode (`/study/[id]/field`) | Near-black, high-contrast, screen-minimizing UI: Big timer, current step, optional audio briefing, "I'm back (Finish Study)" button. |
| 4 | Return (`/study/[id]/return`) | Attach photos (client-side EXIF/GPS stripping + 1024px resize), enter observations per step, Generate Field Report. |
| 5 | Field Report (`/study/[id]/report`) | Key findings with cited evidence, Observed, Inferred, Uncertain, Next Question. Print / Save Report. |

---

## 4. Out of Scope (Do NOT Build)
Accounts/login, external databases, social features, interactive maps, live GPS tracking, species/plant identification, gamification, scores, history analytics, push notifications, offline PWA app store bundles, multi-user sync, payments, cloud AI models.

---

## 5. Honesty Design
- Report sections are fixed: **Findings (with evidence citations), Observed, Inferred, Uncertain, Next Question.**
- Every finding must cite valid evidence (a step ID or a photo ID).
- If the user gave no real measurements, the report must say so (example: "No actual temperature readings recorded").
- It is correct and good for the report to conclude "not enough evidence."

---

## 6. Safety Rules for Generated Studies
- Public, legal, easily accessible places only. No trespassing, no hazardous water edges, no climbing, no roadways without footpaths.
- Daytime assumption unless the user states otherwise. Shorter study budget if user notes extreme weather.
- Do not touch or disturb wildlife or plants. No tasting, no collecting specimens.
- No instruction may require using the phone while walking. The protocol directs the user to stop first, then record.
- Include one plain, prominent safety note in every protocol.
- Never prompt the user to disclose precise private home locations.

---

## 7. Partner / Technology Priority (Post-MVP Extensions)
| Priority | Tech | Role | Status |
|---|---|---|---|
| **P0** | **Gemma via Ollama (local)** | Protocol generation + multimodal debrief | **Complete & Verified (Core Engine)** |
| P1 | ElevenLabs | Voice briefing for Field Mode (generate once, save as mp3) | Optional post-MVP stretch |
| P2 | Sentry | Trace Gemma calls (latency, metadata only) | Optional post-MVP stretch |
| P3 | Mastra | Wrap core steps as an orchestrated workflow | Optional post-MVP stretch |
| P4 | SerpApi, Render | Optional contextual enrichment / hosting | Backlog |

---

## 8. Done Means
- [x] Question to protocol generated reliably on local laptop
- [x] Real study executed with photos and notes
- [x] Report clearly separates observed vs. inferred vs. uncertain
- [x] README lets a stranger run it locally in under 10 minutes
- [ ] Demo video (about 2 min) + DEV article with real field-test story
- [ ] Submitted before the official challenge deadline
