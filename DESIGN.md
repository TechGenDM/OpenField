# DESIGN.md — OpenField Design Specification ("Field Instrument")

## 1. Design Read (Brief Inference)
> **Reading this as:** an outdoor field-investigation instrument (5-screen tool) for curious people stepping away from screens into the physical world, with a calm field-notebook and honest survey-sheet visual language (ink on cool paper, ruled lines, monospace data, single signal-flag accent), leaning toward bespoke Tailwind v4 semantic variables, Geist typography, and disciplined low motion.

---

## 2. Dials
* **`DESIGN_VARIANCE: 4`** — Structured and disciplined for rapid scannability in the field, with deliberate asymmetrical breathing room (e.g. 5/12 + 7/12 layout on desktop, stacked honesty sections on report) without visual fragmentation.
* **`MOTION_INTENSITY: 3`** — Quiet, purposeful micro-transitions (150-200ms ease, subtle 0.98 active press scale, 8px fade-up mount). Zero decorative motion in Field Mode except the drift-free timer. Full `prefers-reduced-motion` compliance.
* **`VISUAL_DENSITY: 3`** — Airy spacing, generous tap targets (minimum 48px), and large body typography (17px-18px minimum) to guarantee immediate legibility in bright sunlight and while moving.

---

## 3. Tokens & Palette (Verified WCAG AA / AAA Contrast)

### Core Theme (Screens 1, 2, 4, 5 — Light / Cool Survey Paper)
* `--paper`: `#F2F4F1` — Primary page canvas (cool survey paper, never warm beige or yellow)
* `--sheet`: `#FAFBF9` — Elevated surface for cards, inputs, and printable field cards
* `--ink`: `#101613` — Primary text, prominent headings, and structural rules (16.56:1 AAA on paper, 17.65:1 AAA on sheet)
* `--ink-2`: `#44504A` — Secondary text, labels, and muted metadata (7.62:1 AAA on paper, 8.12:1 AAA on sheet)
* `--rule`: `#D3D9D3` — 1px structural dividing lines (replaces nested card boxes)
* `--signal`: `#B8461A` — Single accent flag color for primary actions, active indicators, and focus rings (4.83:1 AA on paper, 5.15:1 AA with `--on-signal`)
* `--on-signal`: `#FAFBF9` — High-contrast text on signal-colored buttons

### Documented Exception: Field Mode (Screen 3 — Low-Distraction Night Sheet)
* `--field-bg`: `#0B0F0D` — Deep off-black field environment (never `#000000`)
* `--field-text`: `#F2F4F1` — Primary step instructions and timer display (17.44:1 AAA on field-bg)
* `--field-dim`: `#98A39C` — Subdued metadata and secondary step controls (7.40:1 AAA on field-bg)
* `--field-signal`: `#F0804A` — Warm radiant signal color for active controls (7.25:1 AAA on field-bg)
* `--field-rule`: `#232B26` — Minimal dark divider rule

### Palette Restrictions
* **ONE accent only:** `--signal` (`#B8461A`). No green, blue, purple, or amber status badges.
* **No pure black (`#000000`) and no pure white (`#FFFFFF`).**

---

## 4. Typography Scale
* **Display / UI Sans:** `Geist Sans` (`next/font`)
  * Page Title: `clamp(28px, 4vw, 36px)` font-semibold tracking-tight
  * Section Headers: `20px` font-semibold
  * Body Text: `17px` to `18px` leading-relaxed (exceeds outdoor legibility requirements)
  * Field Mode Step: `clamp(28px, 5vw, 34px)` font-medium leading-snug
* **Monospace / Instrumentation:** `Geist Mono` (`next/font`)
  * Giant Field Timer: `clamp(72px, 18vw, 180px)` font-medium tabular-nums
  * Metadata, Evidence tags, Step indices, Plural counters: `13px` to `15px` font-mono uppercase tracking-wider
* **No Inter. No serif.**

---

## 5. Geometry & Radius System
* **ONE radius everywhere:** `4px` (`rounded-[4px]`).
* Strict ban on pill buttons, rounded tags, circular icon badges, and multi-radius mixtures.
* Structure is established through `1px` `--rule` lines and generous white space rather than nested card containers.

---

## 6. Shared Component Rules
1. **Button:**
   * Primary: `--signal` background, `--on-signal` text, 4px radius, min 48px tap height. Active press `scale-[0.98]`.
   * Secondary / Outline: `--sheet` background, 1px `--rule` or `--ink` border, `--ink` text.
   * Ghost: transparent background, `--ink` or `--ink-2` text, subtle hover.
2. **TextField & Textarea:**
   * Label above input in `--ink` (14px-15px font-medium).
   * Input in `--sheet` background, 1px `--rule` border, 4px radius, 17px text size.
   * Focus ring: 2px `--signal` border with 2px offset.
   * Error text rendered below input in `--signal`.
3. **SegmentedControl:**
   * Flat 4-segment horizontal bar divided by 1px rules.
   * Selected segment: `--ink` fill with `--paper` text.
   * Unselected segments: `--sheet` fill with `--ink-2` text.
4. **RadioRow:**
   * List of selectable option rows separated by 1px `--rule` lines (no separate boxed cards).
   * Selected item: solid 3px `--signal` left border with subtle `--sheet` highlight.
5. **Tag:**
   * Geist Mono, 12px-13px uppercase, 4px radius, 1px border. Outlined, never pill-shaped.
6. **Callout:**
   * 1px solid `--rule` container with solid 3px `--signal` left indicator. No pastel yellow boxes.
7. **StageTrail:**
   * Replaces "Screen X of 5" with a quiet 4-stage survey trail at the top of screens 1, 2, 4, 5: `Plan`, `Field`, `Return`, `Report`.
   * Current stage in `--ink` with a 2px `--signal` underline. Inactive stages in `--ink-2` / dim.
8. **ElapsedLoader:**
   * Honest loading state during Gemma inference (takes 20-60s locally).
   * Live elapsed timer in Geist Mono (`00:23`), calm message: "Local models are slow. This usually takes about a minute."
   * No fake percentages or arbitrary progress bars.
9. **Disclosure:**
   * Clean collapsible accordion for secondary information (e.g., spoken briefing script).
10. **PageShell:**
    * Single top bar with wordmark "OpenField" in Geist semibold (tight tracking) and small mono "LOCAL AI" tag.
    * Omits header in Field Mode for complete screen-off immersion.

---

## 7. Signature Honesty Encoding (Screen 5 Report)
To ensure honesty is legible even in monochrome or under direct sunlight, the three report sections differ by **border line style, icon, and structural note** (not by color alone):
1. **OBSERVED (Facts recorded by user):**
   * Solid 2px `--ink` left border
   * Phosphor check icon (`CheckSquare` or `Check`)
   * Note: "You saw or counted this"
   * Layout: Full width
2. **INFERRED (AI reasoning from observations):**
   * Dashed 2px `--ink` left border
   * Phosphor lightbulb icon (`Lightbulb`)
   * Note: "The AI reasoned this from your evidence"
   * Layout: Stacked or 2-column with Uncertain
3. **UNCERTAIN (Evidence gaps & unverified claims):**
   * Dotted 2px `--ink` left border + faint diagonal hatch pattern background
   * Phosphor question icon (`Question`)
   * Note: "Missing or unverified"
   * Layout: Stacked or 2-column with Inferred

---

## 8. Pluralization & Grammar Rules
* Strict correct plurals:
  * `1 photo` vs `X photos`
  * `1 note` vs `X notes`
  * `1 measurement` vs `X measurements`
* Captions on photos: File name and `EXIF removed` placed **below** thumbnails, never overlaid on top of images.

---

## 9. Zero Em-Dash & En-Dash Rule
* Absolutely zero em dashes (`—`) or en dashes (`–`) anywhere in user-visible text (headlines, body, buttons, tags, or AI output).
* A pure utility function `sanitizeDisplayText(text: string): string` in `src/lib/ui/sanitize.ts` cleans all visible output at display time without altering underlying database / model payloads.
