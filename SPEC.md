# SPEC.md — OpenField

> Ask a question about the real world. OpenField turns it into a field study.

OpenField is **not** an outdoor recommender, walk planner or identifier app.
It is a local-AI engine that turns curiosity into a short, real investigation, then honestly
reports what the evidence does and does not show.

## 1. The loop
Question -> Gemma writes a Field Protocol -> (optional voice briefing) -> go outside, screen mostly off
-> come back with photos + notes -> Gemma writes a Field Report (observed / inferred / uncertain).

## 2. Who it is for
Anyone curious about their surroundings who wants a reason to leave the screen.
Demo user: the builder, testing it outside.

## 3. MVP screens (build ONLY these)
| # | Screen | What it does |
|---|---|---|
| 1 | Create Study | Inputs: question, place (free text), time (15/30/45/60 min), study type (Nature, Environment, Sound, Neighborhood, Photography). Button: Create Field Study |
| 2 | Field Protocol | Shows research question, 4-6 steps, evidence needed, safety note, time estimate. Buttons: Start Field Study, Save Field Card (print-friendly) |
| 3 | Field Mode | Near-black calm screen: "Your study is ready. Put your phone away." Big timer, current step, optional audio briefing, one small "I'm back" button |
| 4 | Return | Upload photos, type observations per step, Finish Study |
| 5 | Field Report | Findings, Evidence, Uncertain, Next question. Clear badge showing what was observed vs inferred |

## 4. Out of scope (do NOT build)
Accounts/login, database, social features, maps, live GPS, species/plant identification, gamification,
scores, history analytics, push notifications, offline PWA, multi-user, payments, cloud AI models.

## 5. Honesty design
- Report sections are fixed: **Findings, Observed, Inferred, Uncertain, Next question.**
- Every finding must cite evidence (a step id, a photo, or a user note).
- If the user gave no real measurements, the report must say so (example: "No actual temperature readings").
- It is correct and good for the report to say "not enough evidence".

## 6. Safety rules for generated studies
- Public, legal, easily accessible places only. No trespassing, no water edges, no climbing, no roads without footpaths.
- Daytime assumption unless the user says otherwise. Shorter study if user says it is hot/rainy/late.
- Do not touch or disturb wildlife or plants. No tasting, no collecting.
- No instruction may need the phone while walking. Stop first, then note.
- Include one plain safety note in every protocol.
- Never ask the user to share precise personal location in the report.

## 7. Partner/tech priority (cut from the bottom if time runs out)
| Priority | Tech | Role | Rule |
|---|---|---|---|
| P0 | Gemma via Ollama (local) | Protocol + multimodal debrief | Must work. This is the product |
| P1 | ElevenLabs | Voice briefing for Field Mode (generate once, before leaving, save as mp3) | Only if P0 flow works |
| P2 | Sentry | Trace Gemma calls (latency, errors) and show a real trace in the article | Add after core flow works |
| P3 | Mastra | Wrap the existing steps as a workflow: create -> validate -> prepare -> analyze -> report | Only wrap working code, never block on it |
| P4 | SerpApi, Render | Optional | Skip unless everything above is done |

## 8. Done means
- [ ] Question to protocol in under 60 seconds on my laptop
- [ ] One real study done outside, with real photos and notes
- [ ] Report clearly separates observed vs inferred vs uncertain
- [ ] README lets a stranger run it locally in under 10 minutes
- [ ] Demo video (about 2 min) + DEV article with real field-test story
- [ ] Submitted before the official deadline (confirm exact time and timezone on the official challenge page)
