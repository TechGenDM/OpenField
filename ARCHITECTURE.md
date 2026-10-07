# ARCHITECTURE.md

## Flow
```
Browser (Next.js UI)
   |  POST /api/study            (question, place, minutes, type)
   v
Server route -> src/lib/ai/protocol.ts -> Ollama (Gemma) -> Zod validate -> FieldProtocol
   |
   |  (optional) POST /api/speak -> ElevenLabs -> mp3 saved in browser storage
   v
User goes outside (Field Mode + audio + printed Field Card)
   |
   |  POST /api/debrief          (protocol, notes, resized photos)
   v
Server route -> src/lib/ai/debrief.ts -> Ollama (Gemma vision) -> Zod validate -> FieldReport
```

## Reality check: where does the phone fit?
Ollama runs on the laptop. The phone can open the app only on the same Wi-Fi
(run `next dev -H 0.0.0.0`, open the laptop's LAN address on the phone). So:
1. At home: create the study, download the audio and the Field Card.
2. Outside: audio + card only. No internet needed.
3. Back home: upload photos and notes, get the report.
Do not build offline/PWA features. This flow is the product.

## Folder structure
```
openfield/
  AGENTS.md SPEC.md ARCHITECTURE.md DECISIONS.md TASKS.md README.md .env.example
  src/
    app/
      page.tsx                      # Screen 1 Create Study
      study/[id]/page.tsx           # Screen 2 Protocol
      study/[id]/field/page.tsx     # Screen 3 Field Mode
      study/[id]/return/page.tsx    # Screen 4 Return
      study/[id]/report/page.tsx    # Screen 5 Report
      api/study/route.ts
      api/debrief/route.ts
      api/speak/route.ts            # P1 only
    lib/
      schemas.ts                    # all Zod schemas + inferred types
      storage.ts                    # browser storage for studies (no DB)
      image.ts                      # resize to ~1024px + strip EXIF
      telemetry.ts                  # Sentry spans (P2)
      ai/
        ollama.ts                   # one configured client
        prompts.ts                  # all prompt text lives here
        protocol.ts                 # createProtocol()
        debrief.ts                  # createReport()
  tests/
```

## Data shapes (Zod, in src/lib/schemas.ts)
```ts
StudyInput    = { question: string, place: string, minutes: 15|30|45|60,
                  type: 'nature'|'environment'|'sound'|'neighborhood'|'photography' }

FieldProtocol = { id, title, researchQuestion, minutes, type,
                  steps: { id: string, instruction: string,
                           evidence: 'photo'|'note'|'count'|'measurement',
                           required: boolean }[],            // 4-6 steps
                  evidenceNeeded: string[],
                  safetyNote: string,
                  audioScript: string }                      // for ElevenLabs

Observation   = { stepId: string, note?: string, photoIds?: string[], measured?: boolean }

FieldReport   = { findings: { claim: string, evidenceRefs: string[],
                              confidence: 'low'|'medium'|'high' }[],
                  observed: string[],      // things the user recorded
                  inferred: string[],      // AI reasoning, labelled as such
                  uncertain: string[],     // gaps, missing measurements
                  evidenceSummary: { photos: number, notes: number, measurements: number },
                  nextQuestion: string }
```
Rule: every `evidenceRefs` entry must match a real step id or photo id. Validate this in code, not in the prompt.

## Gemma / Ollama settings (verified on the Ollama gemma4 page)
- Default model: `gemma4:e4b`. If too slow, `gemma4:e2b`. If hardware allows, `gemma4:12b`.
- **Never use `:cloud` tags.** They are not local and break the privacy story.
- Recommended sampling: temperature 1.0, top_p 0.95, top_k 64.
- Thinking mode is switched on by `<|think|>` at the start of the system prompt. Protocol generation: thinking off (speed). Debrief: try thinking on, keep it off if too slow.
- In multi-turn calls, never put earlier thinking text back into history.
- For image input, put the images BEFORE the text in the message.
- Use Ollama's structured output (JSON schema in the `format` option) and still validate with Zod. Check the current `ollama` JS docs for exact options before coding.
- Resize photos (about 1024px longest side) before sending, for speed.

## AI behavior contracts (put in prompts.ts)
Protocol prompt must: stay inside the time budget, give 4-6 concrete steps a person can do by looking
and counting (no special equipment), follow SPEC section 6 safety rules, and write a short spoken `audioScript`.
Debrief prompt must: use only the given notes/photos, label observed vs inferred vs uncertain,
refuse to invent numbers, and say "not enough evidence" when true.

## Errors
Typed errors: `OLLAMA_UNREACHABLE`, `MODEL_NOT_FOUND`, `INVALID_MODEL_OUTPUT`, `TIMEOUT`.
UI shows a plain message and a retry button. No raw stack traces to users.

## Observability (P2)
One Sentry span per Gemma call with: model name, step (protocol|debrief), latency, retry count, success/fail.
Do not send photos, notes, or locations to Sentry.
