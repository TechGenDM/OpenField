# OpenField

> Ask a question about the real world. OpenField turns it into a field study.

OpenField uses a **local open model (Gemma via Ollama)** to turn a question into a short outdoor
investigation, then writes an honest report from your photos and notes, separating what you
**observed** from what the AI **inferred** and what is still **uncertain**.

Built for the DEV Hacktoberfest 2026 Week 1 "Touch Grass" challenge.

## Run it locally
1. Install [Ollama](https://ollama.com) and run `ollama pull gemma4:e4b`
2. `cp .env.example .env.local`
3. `npm install && npm run dev`
4. Open http://localhost:3000

## How it works
See [SPEC.md](SPEC.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Privacy
Photos and notes stay on your machine. The AI runs locally.

## License
MIT (add LICENSE file)
