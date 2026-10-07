# Contributing to OpenField 🌿

Thank you for your interest in contributing to OpenField!

OpenField is a local-AI field study engine:
> *"AI plans. You observe. The world supplies the data. AI helps you make sense of it."*

OpenField converts a real-world question into a structured field protocol using local Gemma via Ollama, offers a screen-minimizing Field Mode during observation, and synthesizes evidence (notes and photos) into an honest Field Report that strictly distinguishes between observed reality, AI inferences, and uncertainties.

---

## 🛠️ Development Setup

### Prerequisites
1. **Node.js**: `v18.18+` or `v20+`
2. **Ollama**: Installed and running locally ([ollama.com](https://ollama.com))
3. **Local Model**: Pull the default recommended model:
   ```bash
   ollama pull gemma4:e4b
   ```

### Quickstart
1. Clone your fork of the repository:
   ```bash
   git clone https://github.com/<your-username>/OpenField.git
   cd OpenField
   ```
2. Configure local environment:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Required Verification Commands

Before opening a pull request, all automated checks must pass without errors or warnings:

```bash
# 1. Run unit & quality test suites
npm test

# 2. Run ESLint checks
npm run lint

# 3. Run TypeScript typechecking in strict mode
npm run typecheck

# 4. Verify Next.js production build
npm run build
```

---

## 🛑 Strict Project Guardrails (What NOT to Build)

OpenField maintains strict architectural boundaries. The core MVP stack is deliberately lean: Next.js (App Router), TypeScript (strict), Tailwind CSS, Zod, and the official `ollama` client.

**Please DO NOT open PRs that introduce:**
- ❌ **Cloud AI Providers**: No OpenAI, Anthropic, Gemini Cloud API, or external LLM proxies. OpenField is strictly local-first via Ollama.
- ❌ **External Databases**: No PostgreSQL, MySQL, MongoDB, Firebase, Supabase, or ORMs. State is kept local in browser storage.
- ❌ **User Authentication / Accounts**: No login forms, JWTs, OAuth, or user tables.
- ❌ **GPS / Live Maps**: No background geolocation tracking or map SDKs. OpenField values privacy and spatial observation over screen navigation.
- ❌ **Social & Gamification**: No feeds, leaderboards, streaks, badges, or sharing networks.
- ❌ **New Dependencies**: Do not install new packages without prior discussion. Every added dependency increases maintenance overhead and security attack surface.

---

## 💡 Meaningful Contribution Areas

We actively welcome contributions in these high-impact areas:

1. **Accessibility (a11y)**:
   - Ensuring full keyboard navigation and focus management across all 5 screens.
   - Enhancing ARIA labels for screen readers.
   - Improving high-contrast visibility for outdoor use under bright sunlight.

2. **Print & Offline Styling**:
   - Enhancing the print stylesheet (`print:`) for the Field Card and Field Report.
   - Ensuring clean, paper-efficient multi-column printouts.

3. **Test Coverage & Edge Cases**:
   - Additional test cases for `validateReportQuality` and protocol time budgets.
   - Edge-case testing for client-side image canvas resizing and EXIF stripping.
   - Boundary tests for browser local storage quotas.

4. **Report Export Utilities**:
   - Client-side export of generated Field Reports to Markdown (`.md`) or raw JSON (`.json`) files for personal archiving.

5. **Performance & Client Optimizations**:
   - Refining canvas image downscaling performance on mobile browsers.
   - Minimizing client-side bundle size.

6. **Documentation & Real-World Examples**:
   - Documenting sample field studies (indoor microclimates, neighborhood acoustics, tree canopies).
   - Clarifying setup guides for different operating systems (macOS, Linux, Windows WSL2).

---

## 📝 Commit Conventions & Pull Request Workflow

We follow standard **Conventional Commits**:
- `feat:` for new capabilities within the approved scope.
- `fix:` for bug fixes.
- `docs:` for documentation updates.
- `test:` for adding or updating tests.
- `refactor:` for code changes that neither fix a bug nor add a feature.
- `chore:` for repository maintenance tasks.

### Pull Request Checklist
- [ ] PR branch is branched from latest `main`.
- [ ] No new dependencies added without prior approval.
- [ ] No application code modifies the core local-first privacy guarantee.
- [ ] All verification commands pass (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).
- [ ] PR description clearly explains the problem, the solution, and manual testing steps.
