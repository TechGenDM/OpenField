# OpenField 🌿

> **Ask a question about the real world. OpenField turns it into an honest field study.**

> *"AI plans. You observe. The world supplies the data. AI helps you make sense of it."*

OpenField is a local-AI field study engine built on **local Gemma via Ollama**. It converts human curiosity into structured, real-world investigations, encourages screen-minimized observation, and synthesizes returned notes and photos into an honest Field Report that strictly distinguishes empirical facts from AI reasoning and unanswered questions.

Built for the **DEV Hacktoberfest 2026** challenge.

---

## 🧭 What OpenField Is (and What It Is Not)

| What OpenField Is | What OpenField Is NOT |
|---|---|
| **An empirical field study engine** for systematic inquiry into nature, acoustics, lighting, microclimates, and neighborhoods. | **Not a generic walk planner** or turn-by-turn navigation guide. |
| **A structured protocol generator** that schedules 4–6 concrete observation steps within an exact time budget. | **Not a scavenger hunt** or gamified checklist with badges, streaks, and points. |
| **An honest evidence synthesizer** evaluating only user-supplied observations and photos. | **Not a black-box species identifier** that guesses binomial names with unverified confidence. |
| **Strictly local-first AI** running directly on your computer via Ollama. | **Not a cloud AI wrapper** with recurring API subscriptions or data collection. |

OpenField supports both outdoor investigations (e.g., urban tree canopies, pavement temperatures, bird activity) and indoor studies (e.g., room acoustic reverberation, household drafts, indoor plant light gradients).

---

## 🔄 The 5-Step Empirical Loop

```
1. Create Study  ──>  2. Field Protocol  ──>  3. Field Mode  ──>  4. Return & Evidence  ──>  5. Field Report
  (Question, Time,      (4-6 Concrete Steps,     (Screen-Minimizing      (Notes, Photo Upload,      (Findings, Observed,
   Place & Category)     Safety, Audio Script)    Timer & Navigation)     Canvas EXIF Stripping)     Inferred, Uncertain)
```

1. **Create Study (`/`)**: You pose a question about your surroundings, choose a time budget (15, 30, 45, or 60 minutes), specify a location, and pick a domain (*Nature*, *Environment*, *Sound*, *Neighborhood*, or *Photography*).
2. **Field Protocol (`/study/[id]`)**: Local Gemma generates a structured investigation plan containing 4–6 observational steps, evidence types (notes, photos, counts, measurements), a safety note, and a printable Field Card.
3. **Field Mode (`/study/[id]/field`)**: A low-attention, screen-minimizing interface with near-black background, high-contrast typography, large countdown timer, step navigation, and optional audio briefing. Designed to reduce screen immersion while you observe.
4. **Return & Evidence (`/study/[id]/return`)**: Upon returning, you record what you observed per step and attach photos. Photos are automatically resized to 1024px with all EXIF and GPS metadata stripped directly in browser canvas before analysis.
5. **Field Report (`/study/[id]/report`)**: Local Gemma analyzes only the provided evidence and generates an honest report enforcing the three core pillars.

---

## ⚖️ The Honest Field Report

OpenField enforces strict truth-in-evidence guardrails in both its AI prompts and post-generation schemas:

- **Key Findings with Evidence Citations**: Every claim in the report must explicitly cite at least one specific step ID (`step-1`) or photo ID (`photo-1`). Uncited assertions are rejected by quality validators.
- **Observed**: Strictly what the user directly witnessed, counted, or recorded during the study. The model is forbidden from inventing measurements or counts.
- **Inferred**: Explicit AI hypotheses and deductions derived from patterns in the evidence.
- **Uncertain**: Explicitly highlights missing measurements, gaps in evidence, uncompleted steps, and unanswered questions. If evidence is lacking, OpenField states "not enough evidence."
- **Next Investigation**: A logical follow-up research question suggested by the uncertainties discovered.

---

## 🖥️ Local AI Architecture

OpenField requires no cloud AI or third-party inference APIs. All language understanding and multimodal vision debriefing are executed locally by Google Gemma using the official `ollama` client.

```
┌─────────────────────────────────────────────────────────────┐
│                       Your Computer                         │
│                                                             │
│   Next.js App Router (localhost:3000)                       │
│    ├── Client: Local browser canvas (EXIF/GPS stripping)    │
│    ├── Client: LocalStorage (studies, notes, cached photos) │
│    └── Server: /api/study & /api/debrief                    │
│                     │                                       │
│                     ▼ HTTP (localhost:11434)                │
│   Ollama Server (Local Gemma 4)                             │
│    ├── Protocol generation (JSON schema-constrained)        │
│    └── Multimodal vision debrief (notes + base64 images)    │
└─────────────────────────────────────────────────────────────┘
```

### Supported Models

| Model | Role | Resource Profile |
|---|---|---|
| **`gemma4:e4b`** | **Recommended Default** | Balanced latency and multimodal vision accuracy for everyday laptops. |
| **`gemma4:e2b`** | **Fallback** | Fast and lightweight; recommended for machines with 8 GB RAM or CPU-only setups. |
| **`gemma4:12b`** | **Optional Benchmark** | Higher-capacity reasoning for systems with dedicated GPUs and high VRAM. |

### How Mobile & Field Observation Works
- **The phone does NOT need to run Ollama.** Ollama runs on your primary workstation/laptop.
- **Option A (Zero-Tech Field Card)**: On the protocol page, click *Save / Print Field Card* to take a physical paper printout or offline PDF with you into the field.
- **Option B (Local LAN Access)**: Start the server with `npm run dev -- -H 0.0.0.0` and open your computer's local IP address on your phone over home Wi-Fi before stepping out. The Field Mode timer and step navigation run client-side in the browser; no connection to Ollama is needed during field observation. Return to your computer to debrief.

### Screen-Minimizing Field Mode
Field Mode is **not** an OS-level forced screen lock. Rather, it is a deliberate, calm, low-distraction user interface featuring a near-black palette, high-contrast text, a large timer, and a spoken briefing option designed to encourage pocketing the device and engaging directly with physical surroundings.

---

## 🔒 Privacy & Local-First Guarantees

- **No Remote AI Calls**: Photos and notes are never transmitted to external cloud providers.
- **Client-Side EXIF & GPS Stripping**: All uploaded photos are processed locally in an off-screen HTML5 `<canvas>` element before transmission to local Ollama. Camera metadata, timestamps, and GPS coordinates are discarded.
- **No Remote Database or Tracking**: OpenField uses browser `localStorage`. No analytics, cookies, trackers, or telemetry SDKs are loaded.

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org) (v18.18+ or v20+)
- [Ollama](https://ollama.com) installed and running

### 1. Pull the Model
```bash
ollama pull gemma4:e4b
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
*(The default configuration points to `http://localhost:11434` with model `gemma4:e4b`.)*

### 3. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

OpenField includes comprehensive automated tests covering schema validation, safety rules, prompt quality, citation checking, and client image processing:

```bash
# Run unit & quality test suite (72 tests)
npm test

# Run ESLint checks
npm run lint

# Run strict TypeScript typecheck
npm run typecheck

# Verify production build
npm run build
```

---

## ⚠️ Current MVP Limitations

- **Local Storage Quota**: Photos and studies are stored in browser `localStorage`. To prevent quota overflows, attached photos are downscaled to 1024px, and storage quota exceptions are caught gracefully.
- **Inference Latency**: Generation latency depends heavily on hardware, model size, and workload. Lower-resource machines can use `gemma4:e2b`.
- **Single Active Session**: The MVP stores studies locally per browser profile; there is no cloud synchronization across disparate devices.

---

## 🎃 Hacktoberfest 2026 & Contributing

OpenField participates in **Hacktoberfest 2026**. We welcome community contributions that improve accessibility, print formatting, test coverage, and documentation without expanding architectural bloat.

Please review [CONTRIBUTING.md](CONTRIBUTING.md) for development rules, scope guardrails, and conventional commit guidelines before opening a pull request.

---

## 📄 License

OpenField is licensed under the [MIT License](LICENSE).
