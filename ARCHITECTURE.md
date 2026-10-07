# ARCHITECTURE.md — OpenField Architecture

## 1. System Flow

```
Browser (Next.js Client)
   │
   ├─► POST /api/study (question, place, minutes, type)
   │     │
   │     ▼
   │   Server Route ──► src/lib/ai/protocol.ts ──► Ollama (Gemma) ──► Zod Validate ──► FieldProtocol
   │
   ├─► Field Mode (screen-minimizing timer + step navigation in browser; zero Ollama calls during observation)
   │   (or physical offline Field Card printout)
   │
   ├─► Evidence Capture (client-side 1024px downscaling + canvas EXIF/GPS stripping)
   │
   └─► POST /api/debrief (protocol, observations, base64 photos)
         │
         ▼
       Server Route ──► src/lib/ai/debrief.ts ──► Ollama (Gemma Vision) ──► Zod Validate ──► FieldReport
```

---

## 2. Where Does the Phone Fit?

- **Ollama runs exclusively on your computer/laptop.** The phone does not run Ollama.
- OpenField requires no cloud AI/API. Ollama runs locally on the user's computer.
- The field phase can be conducted in two ways:
  1. **Offline Field Card**: Click *Print / Save Field Card* on the protocol screen and take paper or an offline PDF into the field.
  2. **Local LAN Access**: Run `npm run dev -- -H 0.0.0.0` and open your laptop's local network IP on your phone while on home Wi-Fi before heading out.
- **Client-Side Field Mode**: Once loaded, Field Mode timer and step navigation execute client-side in the browser. No active connection to Ollama is required during field observation. The user returns to the laptop to upload evidence and trigger the debrief.

---

## 3. Repository Structure

```
OpenField/
├── AGENTS.md                  # Rules for AI pair programmers
├── ARCHITECTURE.md            # Architectural design & data contracts (this file)
├── CONTRIBUTING.md            # Hacktoberfest & open-source contributor guide
├── DECISIONS.md               # Architectural decision record (ADR)
├── LICENSE                    # MIT License
├── README.md                  # Primary public documentation
├── SPEC.md                    # Product specification & anti-scope
├── TASKS.md                   # Task roadmap & verification status
├── .env.example               # Environment variables template
├── package.json               # Dependencies & scripts
│
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Screen 1: Create Study
│   │   ├── layout.tsx                    # Root layout with font & metadata
│   │   ├── globals.css                   # Tailwind styles
│   │   ├── study/[id]/page.tsx           # Screen 2: Field Protocol & Field Card
│   │   ├── study/[id]/field/page.tsx     # Screen 3: Screen-Minimizing Field Mode
│   │   ├── study/[id]/return/page.tsx    # Screen 4: Return & Evidence Collection
│   │   ├── study/[id]/report/page.tsx    # Screen 5: Honest Field Report
│   │   └── api/
│   │       ├── study/route.ts            # Server route for protocol generation
│   │       └── debrief/route.ts          # Server route for multimodal debrief
│   │       └── (future: speak/route.ts)  # Planned P1 extension: ElevenLabs audio
│   │
│   ├── components/
│   │   └── AppShell.tsx                  # Consistent header/footer wrapper
│   │
│   └── lib/
│       ├── schemas.ts                    # Zod schemas for all data entities
│       ├── storage.ts                    # LocalStorage abstraction with quota handling
│       ├── image.ts                      # Off-screen canvas resizing (1024px) & EXIF stripping
│       ├── timer.ts                      # Drift-free timestamp timer calculations
│       │
│       └── ai/
│           ├── ollama.ts                 # Configured Ollama client singleton
│           ├── prompts.ts                # System/user prompts & Ollama JSON schemas
│           ├── protocol.ts               # Protocol generation orchestrator with retry
│           ├── debrief.ts                # Multimodal report generator with citation checks
│           ├── quality.ts                # Deterministic time budget & safety validator
│           └── json.ts                   # Robust balanced-brace JSON extractor
│
└── tests/
    ├── debrief.test.ts                   # Debrief generation & citation validation tests
    ├── field-mode.test.ts                # Timer, step clamping & layout isolation tests
    ├── image.test.ts                     # Canvas resizing & metadata stripping unit tests
    ├── protocol-error.test.ts            # Error typing & network failure tests
    ├── protocol-quality.test.ts          # Protocol time budget & safety constraint tests
    └── protocol-schema.test.ts           # Protocol schema parsing & step range tests
```

---

## 4. Data Shapes (Zod Schemas in `src/lib/schemas.ts`)

```ts
// Study Creation Input
StudyInput = {
  question: string;
  place: string;
  minutes: 15 | 30 | 45 | 60;
  type: "nature" | "environment" | "sound" | "neighborhood" | "photography";
}

// Generated Field Protocol
FieldProtocol = {
  id: string;
  title: string;
  researchQuestion: string;
  minutes: StudyMinutes;
  type: StudyType;
  steps: {
    id: string;               // Canonical IDs: step-1, step-2, ...
    instruction: string;
    evidence: "photo" | "note" | "count" | "measurement";
    required: boolean;
  }[];                        // Strictly 4–6 steps
  evidenceNeeded: string[];
  safetyNote: string;
  audioScript: string;
}

// User Observation Recorded on Return
Observation = {
  stepId: string;
  note?: string;
  photoIds?: string[];
  measured?: boolean;
}

// Final Honest Field Report
FieldReport = {
  findings: {
    claim: string;
    evidenceRefs: string[];   // Strictly minItems: 1; must match valid step/photo IDs
    confidence: "low" | "medium" | "high";
  }[];
  observed: string[];         // Direct facts recorded by user
  inferred: string[];         // AI deductions
  uncertain: string[];        // Evidence gaps, uncompleted steps, missing data
  evidenceSummary: {
    photos: number;
    notes: number;
    measurements: number;
  };
  nextQuestion: string;
}
```

---

## 5. Local AI & Robustness Patterns

### A. Strict Evidence Validation (`evidenceRefs`)
Every claim inside `findings` must reference at least one valid canonical step ID (`step-1`, `step-2`) or photo ID (`photo-1`). In `src/lib/ai/debrief.ts`, `validateReportQuality` verifies that citations exist and reject uncited statements. Uncompleted steps or missing measurements are guided into `uncertain`.

### B. Structured Grammar Schema Masking (`minItems: 1`)
Ollama's structured JSON output uses grammar sampling. By setting `minItems: 1` on `evidenceRefs` in `REPORT_JSON_SCHEMA`, the sampler is prevented from emitting empty citation arrays (`[]`), ensuring the model either cites evidence or shifts unverified claims to `uncertain`.

### C. Balanced-Brace JSON Recovery (`src/lib/ai/json.ts`)
Local models occasionally preface or append conversational text around JSON objects. Rather than naive string slicing that risks breaking on braces nested inside JSON string values, `extractJsonObject` tracks string escape states and balanced bracket depth to reliably extract valid JSON payloads.

### D. Single-Retry Error Feedback Loop
If raw output fails Zod parsing or deterministic quality checks, OpenField retries exactly once with a targeted prompt containing the specific error message and allowed canonical IDs, without dumping previous raw text. If the retry fails, a typed error is returned (`INVALID_MODEL_OUTPUT`, `OLLAMA_UNREACHABLE`, or `MODEL_NOT_FOUND`).

### E. Client-Side Image Privacy
Photos never enter the backend in raw format. Before any photo is sent to `/api/debrief`, `src/lib/image.ts` draws it to an off-screen HTML5 canvas, downscales it to a max bounding box of 1024px, and exports it as clean JPEG base64. All EXIF metadata and GPS coordinates are discarded in the browser.
