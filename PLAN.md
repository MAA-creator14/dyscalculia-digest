# Dyscalculia-Friendly PM Tool — MVP Plan

## Context

Product managers with dyscalculia deal with numbers constantly — dashboard KPIs, spreadsheets, budgets, cohort/retention data — and standard tools present that data in ways that are hard to parse quickly and reliably (dense tables, symbol-only trend indicators, no contextual framing, reliance on mental math). Misreading a number in this role isn't just frustrating, it's professionally risky (wrong call in a stand-up, wrong number in an exec update).

The goal is to build a **product** (not just a personal script) that other PMs with dyscalculia can use to turn raw numeric data into a format their brains can process reliably — starting with the two highest-value, technically-overlapping pain points the user identified: **metrics/dashboards** and **spreadsheets/data tables**. Budgets/business cases and "asking the right questions of the data" (cohort/retention literacy) are real needs but are explicitly deferred to later phases so the MVP stays narrow and shippable.

This is a **dedicated solo/small effort, not yet validated with other PMs with dyscalculia** beyond the user's own experience — a real bet, not a side project, but still unproven. That status shapes several decisions below: bias toward getting a testable version in front of real people quickly, and keep things reversible/cheap where validation could change direction.

Decisions baked into this plan and why:
- **Web app first, browser extension later.** An extension needs fragile per-site DOM scraping (Jira, Amplitude, Sheets, Looker each need their own logic) before anything is demoable. A web app validates the core "does this actually help" hypothesis in weeks, and becomes the extension's backend later.
- **Metrics/dashboards + spreadsheets are one engine, not two.** Both start from tabular numeric data and need the same output: redundant-coded, plain-language restatement with anomaly flags. Building one ingestion→compute→output pipeline covers both pain points.
- **Arithmetic is never done by the LLM.** This is the single most important rule for this product: a hallucinated percentage is actively harmful to this audience. All math happens in deterministic, unit-tested TypeScript. The LLM only phrases already-computed numbers into sentences, or answers follow-up questions by calling tools that return precomputed values — never by computing its own.
- **Vercel-native stack** (Next.js App Router, AI SDK v6 via AI Gateway, Marketplace-provisioned Postgres/auth) per this session's default stack, since there's no existing infra to work around.
- **Ship Flow A + Flow B first, build the rest in parallel.** Since the idea isn't validated yet, the restate-and-summarize core is the fastest path to real feedback from other PMs with dyscalculia. Chat, screenshot input, sharing, and TTS keep being built alongside it rather than gating on validation, accepting some risk that they may need to change based on what early feedback shows.
- **Strong privacy posture from day one, without requiring accounts.** Users will paste real company metrics (revenue, growth rates, sometimes screenshots of internal dashboards). The product commits explicitly and visibly (on the upload screen) to never storing or training on raw source data, while staying account-free for the first release — trust is earned through an explicit policy and ephemeral processing, not through login gates.
- **Free/open for now.** No billing/entitlements infrastructure in the MVP; monetization is deliberately deferred until the core idea is validated.
- **Quality over cost for AI calls, pre-validation.** With no revenue yet but also negligible early usage volume, use the strongest available model (via AI Gateway) for narration, chat, and vision extraction rather than optimizing spend prematurely. Revisit cost controls once usage grows.

## Design language: "Spotify for dyscalculia"

The product-philosophy reference point is Spotify, not for its brand (don't reuse its green/logo/name), but for its *interaction* ethos: content as hero, bold and legible at a glance, card-based rather than dense-grid, audio-first, and personalized around a "library" the user curates. Translated into dyscalculia-friendly numeric design:

- **Numbers are the hero, not buried in a table.** Each metric gets its own card (like an album/track) — a scannable, swipeable stream of NumberCards, not a dense spreadsheet-style grid. One number, fully explained, per card.
- **A small, fixed, consistent color system.** A handful of colors mapped permanently to meaning (e.g. one green = "up/good", one amber/red = "down/attention", one neutral = "no change") and never reused for anything else in the UI — unlike arbitrary chart palettes that shift meaning per screen.
- **High contrast, dark-mode-first** (with a light option) to cut visual noise — a look and feel closer to Spotify's UI than a typical spreadsheet or BI dashboard.
- **Standard, highly legible numeral typography — not a niche "dyscalculia font."** Tabular figures on a well-tested system/UI face (e.g. Inter, system-ui) where digits are easy to tell apart (3/8/6 don't blur together), large default type size with a user-adjustable size control. Evidence for dedicated dyscalculia-specific fonts is thin; a proven, freely available face is the lower-risk choice.
- **Redundant coding for direction/magnitude:** icon **+** color **+** word together, never color or a symbol alone (no bare `+`/`-` or `<`/`>` as the only cue).
- **Raw number and plain-language framing shown together, always, at equal visual weight** (e.g. "+19.3%" and "about a fifth higher" side by side) — maximizes trust and verifiability; the tool never hides the exact figure behind the friendly framing.
- **Never require mental math** — pre-compute and show the answer; an inline calculator covers ad hoc comparisons.
- **Simple, redundant-coded visuals are allowed, traditional charts are not the primary vehicle.** A small sparkline or bar may sit alongside a NumberCard to reinforce the words/numbers, but direction and magnitude must always be readable from the icon+color+word+sentence alone — no chart is ever the *only* way information is conveyed, since reading axes/slopes is itself a common dyscalculia pain point.
- **Deliberate, disable-able motion.** Small count-up/transition animations for feedback (Spotify-style polish), but never the *only* cue for direction/magnitude, and off by default for users sensitive to motion.
- **Audio as a first-class action, not an afterthought.** A "listen" control on every NumberCard (see Text-to-speech below) — treat "hear this metric" the way Spotify treats "play this track."
- **A personal "Library."** Users pin/save frequently-checked metrics or datasets into a personal library/home screen (extends Flow F) rather than a flat history list — echoes Spotify's saved-playlists pattern and gives returning users a familiar, personalized home.
- **Mobile is a first-class surface, not an afterthought.** Designed and tested on phone-sized viewports alongside desktop from the start — the "listen" feature especially suits on-the-go use, even though this is an occasional-use utility rather than a daily-habit product (see Usage pattern below).
- Consistent, predictable formatting across every screen; no timed pressure on numeric tasks.

**Formal accessibility compliance:** because this is an accessibility-focused product, it commits to **WCAG 2.1/2.2 AA compliance** (screen-reader labels, full keyboard navigation, contrast ratios) as a build requirement from the first release, not a later hardening pass — the dyscalculia-specific principles above address numeric cognition, but shouldn't come at the expense of users with overlapping needs (low vision, motor impairments, screen-reader users).

## MVP scope

**First-run intake**
On first use, a single open, qualitative question — *"how would you describe your relationship with numbers?"* — is asked and stored for the founder's own learning. It does not configure any product behavior yet (no settings/personalization in the MVP); it's a listening exercise to inform what should become configurable later, once real answers come in.

**Flow A — Ingest & Restate**
1. User pastes a table, uploads a CSV, uploads/pastes a screenshot of a dashboard, or connects a Google Sheet (read-only, single sheet/range).
2. **Screenshot input specifically:** a vision-model pass extracts a table from the image, which is shown back to the user as an editable preview. The user must explicitly confirm it looks right before anything is computed — since a misread digit from an image is the single highest-risk failure mode in the whole product, this confirm-before-compute step is mandatory, not optional.
3. Deterministic engine parses into typed columns (date/percent/currency/count/ratio) and computes totals, deltas (absolute + %), rank/comparison, and rule-based anomalies (e.g. z-score outliers, sign flips, sudden zeros). Anomaly flagging defaults to **cautious/under-flag** — only surfacing anomalies with strong statistical confidence, since a false alarm undermines trust in this panel faster than an occasional missed one. Parsing assumes UK/US-style number formats (period decimal) for MVP; broader locale support is a Phase 2 concern. If a column or number format can't be confidently interpreted, the tool **fails loudly with a specific explanation** (e.g. "couldn't tell if column 3 is a percentage or a count") rather than silently guessing.
4. Output renders each key number as a **NumberCard**: large grouped numeral shown together with its plain-language sentence at equal visual weight, icon+color+word for direction, comparative framing, and an optional small redundant-coded visual (sparkline/bar).
5. Anomalies surface in a separate "Worth a second look" panel with a plain-language reason.

**Flow B — Exec summary**
6. At the top of the interpretation page, above the NumberCard stream, a synthesized summary of the whole dataset: a headline takeaway (the single biggest story, 1–2 sentences), the 2–3 largest movers stated in words, any multi-period trend/streak ("third week in a row of decline"), the most severe anomaly if one is worth leading with, a comparison to a prior period/target where available, and a data-quality caveat when relevant (e.g. rows excluded for missing data). Built with the same guardrail as everything else: `lib/compute/summarize.ts` deterministically selects/ranks what's noteworthy (top absolute movers, longest streak, worst anomaly) — the LLM only turns that selection into sentences, never decides what's important from raw numbers itself. Includes a "listen" control (Flow F) and a "copy as text" action for pasting straight into a stand-up note or exec update (copy-as-text is sufficient for MVP; styled image/PDF export is deferred).

**Flow C — Ask a follow-up question**
7. Chat input under the restated table ("which week had the biggest drop?"). The LLM answers dataset-specific questions using tool calls that return precomputed values — it never recomputes or invents a number about the dataset — and may also explain general data-literacy concepts (e.g. "what does retention mean") using its general knowledge, clearly and visibly distinguished from dataset-specific figures.

**Flow D — Inline calculator**
8. Anywhere a user might need to mentally compare two numbers, the UI shows the computed answer inline; a persistent small calculator widget covers ad hoc comparisons.

**Flow E — Session recall**
9. Recent interpretations list (computed summaries only, not raw source data) so users can return without re-uploading.

**Flow F — Hear it out loud**
10. Every NumberCard, the exec summary, and the anomaly panel get a "listen" control that sends the already-generated, already-guardrailed narration sentence (never raw numbers) to a text-to-speech provider (ElevenLabs) and plays back audio — so a user can hear "signups grew from 1,204 to 1,436, about a fifth higher" instead of (or alongside) reading it. Because TTS only ever speaks text the deterministic+LLM guardrail pipeline already produced and validated, it can't introduce a new/wrong number. Generated audio is cached (keyed by a hash of the narration text) so repeat plays don't re-hit the TTS API.

**Flow G — Share**
11. A "share" action generates a read-only link to one interpretation (the computed summary only, never raw source data) that a colleague can open without an account — a simple, always-valid, hard-to-guess link, with a manual "revoke" action available. No automatic expiry for MVP.

**No auth for the first demoable slice** (paste → restate, ephemeral). Add auth (Clerk via Vercel Marketplace) only once Google Sheets OAuth or session recall requires it.

**Usage pattern:** this is designed as an **occasional utility** PMs reach for when they specifically need to make sense of a tricky dataset — not a daily-habit product. No engagement loops (streaks, notifications, daily digests) are needed; the design goal is to be excellent in the moment it's needed, not to maximize return visits.

## Architecture

```
app/
  (marketing)/page.tsx              # landing page, includes explicit data-handling/privacy copy
  (app)/
    dashboard/page.tsx               # recent interpretations + personal "Library"
    interpret/new/page.tsx           # upload/paste/connect/screenshot flow
    interpret/[id]/page.tsx          # restated output + exec summary + chat
    share/[token]/page.tsx           # read-only shared view (no auth required)
  api/
    interpret/route.ts               # raw table -> deterministic computation (no LLM)
    extract-image/route.ts           # screenshot -> vision-model table extraction (preview only, no compute)
    narrate/route.ts                 # computed values -> LLM phrasing (streamText)
    summary/route.ts                 # summarize.ts selection -> LLM-phrased exec summary
    chat/route.ts                    # follow-up Q&A (streamText + tool calls; dataset + general concepts)
    sheets/connect/route.ts          # Google OAuth callback
    sheets/[sheetId]/route.ts        # server-side sheet fetch
    tts/route.ts                     # narration text -> ElevenLabs audio (cached)
    share/route.ts                   # create/revoke a read-only share link
lib/
  compute/
    parse-table.ts                   # CSV/paste -> normalized rows/columns, type inference (UK/US locale assumed)
    metrics.ts                       # deltas, %, rank, comparisons (pure, unit-tested)
    anomalies.ts                     # rule-based outlier flagging, cautious/under-flag default (pure, unit-tested)
    summarize.ts                     # deterministic selection: top movers, streaks, worst anomaly
    format.ts                        # numeral grouping, icon/color/word metadata
  ai/
    gateway.ts                       # AI Gateway model config (provider/model strings, highest-quality default)
    vision-extract.ts                # image -> structured table candidate (never computed on directly)
    narrate-prompt.ts                # system prompt: "phrase only, never compute"
    summary-prompt.ts                # phrases the deterministic summarize.ts selection into sentences
    chat-tools.ts                    # tool defs exposing the precomputed dataset + general-concept answering rules
  tts/
    elevenlabs-client.ts             # TTS API wrapper, only ever given pre-validated narration text
  evals/
    fixtures/                        # golden input datasets + expected computed output
    compute.eval.ts                  # deterministic engine vs. golden expected values
    narration.eval.ts                # numeral-fidelity + clarity/accessibility rubric checks
    vision-extract.eval.ts           # screenshot extraction accuracy against golden transcriptions
  db/schema.ts, queries.ts           # Drizzle/Prisma schema (audio cache, share links, intake responses)
  sheets/client.ts                   # Google Sheets API wrapper
components/
  numbers/NumberCard.tsx             # numeral+icon+color+word+comparative sentence+optional sparkline+listen button
  numbers/ExecSummary.tsx            # headline+top movers+streak+worst anomaly+listen+copy-as-text
  numbers/AnomalyPanel.tsx
  numbers/InlineCalculator.tsx
  numbers/TrendBadge.tsx
  audio/ListenButton.tsx             # per-card "play narration" control
  audio/AudioPlayer.tsx              # shared playback UI/state
  chat/FollowUpChat.tsx
  upload/PasteOrUploadTable.tsx
  upload/ConnectSheetButton.tsx
  upload/ScreenshotUpload.tsx        # image upload + editable extracted-table confirmation step
  sharing/ShareButton.tsx            # generate/copy/revoke a read-only link
  onboarding/NumbersIntake.tsx       # first-run qualitative question, stored, not yet used to configure anything
```

**Deterministic vs. LLM split (critical guardrail):**
- Deterministic (plain TS, unit-tested): parsing, all arithmetic, anomaly detection, numeral formatting, comparative-fraction framing, and exec-summary *selection* (which movers/streaks/anomalies are noteworthy enough to lead with — a ranking function, not an LLM judgment call).
- LLM (AI SDK v6, via AI Gateway `provider/model` strings, Node.js runtime): turning precomputed values (and the precomputed exec-summary selection) into fluent sentences; follow-up chat via tool calls returning precomputed values, plus general data-literacy explanations clearly separated from dataset-specific figures; vision-based table extraction from screenshots (treated as an *untrusted candidate* that a human must confirm, never fed straight into compute). System prompt explicitly forbids computing or altering numbers, or introducing a "takeaway" the deterministic layer didn't already select. Add a cheap runtime/test check that diffs numerals in LLM output against the source dataset and flags anything that doesn't trace back to a precomputed value.
- Use AI SDK v6 conventions: `streamText`/`generateText`, `toUIMessageStreamResponse()`, `@ai-sdk/react` + `DefaultChatTransport` on the client, tool `inputSchema`/`outputSchema`. Fetch current AI Gateway model IDs at build time rather than hardcoding from memory; default to the strongest available model for narration/chat/vision extraction pre-validation, revisiting cost tradeoffs once usage grows.
- Workflow DevKit (durable steps/hooks) is **not needed for MVP** — chat and narration are simple synchronous streaming calls. Revisit only if Phase 2/3 adds long-running BI-sync jobs that need pause/resume/retry.

**Data storage:**
- Raw uploaded/pasted/screenshotted source data stays ephemeral (client-side or short-lived server memory) — it may contain sensitive company metrics; avoid persisting it. The upload screen carries explicit, visible copy stating the data is never stored or used to train models.
- Postgres (via Vercel Marketplace, e.g. Neon) stores only computed summaries (metrics, anomalies, narration text) + metadata, for the "recent interpretations" list, the personal "Library" (pinned metrics/datasets), share-link records (token, revoked flag), and first-run intake responses.
- CSV uploads (if beyond paste) use Vercel Blob, deleted after parsing unless the user opts to keep a session. Screenshot images are similarly ephemeral — discarded once the user confirms or discards the extracted table.
- Generated TTS audio is cached in Blob storage keyed by a hash of the narration text, referenced from a small `narration_audio` table, so identical sentences aren't re-synthesized.

**Text-to-speech:** ElevenLabs for narration playback. Check Vercel Marketplace first for a native ElevenLabs integration (env/key provisioning); if none exists, integrate directly via ElevenLabs' API with the key managed through `vercel env`. The TTS route (`api/tts/route.ts`) accepts *only* text already produced by `narrate`/`chat`/`summary` — it never receives raw numbers or freeform text a user typed, keeping the "LLM/TTS never introduces a number" guarantee intact end-to-end.

**Sharing:** a share link points at `share/[token]/page.tsx`, rendering only the stored computed summary (never raw source data) with no auth required to view. Tokens are random and hard to guess; a manual revoke action invalidates the token. No automatic expiry for MVP.

**Integrations — prioritize:** CSV upload, paste-a-table, screenshot/vision extraction, Google Sheets API (read-only), ElevenLabs TTS. **Defer:** direct Amplitude/Mixpanel/Looker APIs, Excel (.xlsx), browser extension, multi-locale number parsing.

## Phasing

- **Phase 1 (MVP):** as scoped above — web app, CSV/paste/screenshot/Sheets ingestion, compute engine, exec summary, narration + chat (dataset + general concepts), sharing, TTS, first-run qualitative intake, no auth until Sheets/session recall needs it, WCAG AA compliance from the start.
- **Phase 2:** browser extension/overlay (reuses Phase 1 compute engine as backend, targets 1–2 hosts first), direct BI-tool integrations, functional accessibility personalization settings (verbosity, motion, anomaly sensitivity — informed by what the first-run intake responses actually reveal), budgets/business-case module (NPV/forecast — own deterministic functions), fuller team/collaboration features beyond simple read-only sharing, styled image/PDF export, multi-locale number parsing, monetization.
- **Phase 3:** "ask the right questions" data-literacy coaching as a deeper guided experience (retention curves, cohort analysis guidance), Excel support, deeper live BI sync (may justify Workflow DevKit for durable multi-step jobs), personalized anomaly sensitivity tuning.

**Validation plan:** since the product isn't yet validated with other PMs with dyscalculia, plan to run a couple of **moderated 1:1 sessions** first (screen-share, watch someone use it live) to catch obvious issues, then widen to a **self-serve link with lightweight feedback** (thumbs up/down, comments) once it's stable enough to scale further. Recruitment channel (communities vs. personal network) and a firm "done enough to test" milestone are both still open — revisit once the initial build is far enough along to show.

## Evals & verification

Testing the *output* of this tool is as important as testing the code, since the product's entire value proposition is "did this number get restated correctly and clearly." Evals are a first-class part of the plan, not an afterthought:

**1. Compute-engine evals (exact-match, deterministic)**
- A growing fixture library in `lib/evals/fixtures/` — real, anonymized spreadsheet/dashboard exports the user (and later, other PMs) actually work with, each paired with hand-verified expected output (totals, deltas, %, anomaly flags).
- `compute.eval.ts` runs every fixture through `lib/compute/` and asserts exact numeric equality against the expected values — this is a strict regression suite, run in CI on every change, since any drift here is a correctness bug.
- Start this suite with the user's own real-world test case (paste a spreadsheet in, verify the result by hand) as fixture #1, and grow it every time a new dataset surfaces an edge case (merged cells, unexpected date formats, mixed currency symbols, etc.).

**2. Narration/chat evals (LLM output quality + safety)**
- **Numeral-fidelity check (automated, blocking):** extract every numeral from `narrate`/`chat`/`summary` output and assert each one traces back to a value in the precomputed dataset — any number that doesn't match is a failed eval, not a style nitpick.
- **Clarity/accessibility rubric (semi-automated):** a small rubric — plain language, comparative framing present, no jargon, sentence length — scored either by an LLM-as-judge pass or a human reviewer during early development, run against a fixed set of narration outputs each time the prompt changes.
- **Anomaly-explanation evals:** for labeled "this should/shouldn't be flagged" fixtures, check precision/recall of `lib/compute/anomalies.ts` against the cautious/under-flag target, and that the plain-language explanation for a flagged anomaly is understandable on its own.
- **Exec-summary selection evals:** for each fixture, hand-label what the "right" headline/top movers/streak/anomaly-to-lead-with would be, and check `lib/compute/summarize.ts` picks the same ones — this is a selection-correctness eval, separate from whether the resulting sentence reads well.
- **General-concept chat evals:** verify chat responses to generic data-literacy questions ("what does retention mean") are clearly and visibly separated from dataset-specific figures, and never blend into an unlabeled dataset claim.

**3. Screenshot-extraction evals**
- A fixture set of realistic dashboard/spreadsheet screenshots paired with hand-verified correct table transcriptions; `vision-extract.eval.ts` checks extraction accuracy per field, not just overall.
- Because extraction feeds a human confirmation step rather than compute directly, also verify (via usability testing) that the confirm-before-compute UI actually surfaces extraction errors clearly enough for a user to catch them — this is as much a UX check as an accuracy check.

**4. Accessibility evals**
- Automated WCAG checks (e.g. axe-core) run against every page as part of CI.
- Manual passes: full keyboard navigation, and at least one real screen-reader run-through (VoiceOver/NVDA) before considering the MVP done.

**5. Manual/dogfooding loop (early and ongoing)**
- Before any formal eval suite exists, the fastest signal is the user putting in his own real spreadsheets/dashboard exports and checking the restatement by hand — this is how fixture #1 (and subsequent fixtures) gets created. Every time something reads wrong, it becomes a new eval fixture, not just a one-off fix.
- Once live, a lightweight thumbs-up/down on each interpretation feeds a backlog of real user-reported misses to turn into fixtures.

**6. Standard checks**
- Unit tests for every function in `lib/compute/` (parsing edge cases, delta/percent math, anomaly thresholds) — the credibility-critical layer, distinct from but complementary to the fixture-based evals above.
- Manual run-through of Flows A–G in the browser (desktop and mobile viewports) with a real dashboard CSV export, a real dashboard screenshot, and a real Google Sheet: check NumberCard and exec-summary rendering against the design-language principles above, confirm the "listen" control plays back correct unaltered text, and confirm a shared link renders the read-only view with no raw source data exposed.
- `next build`/typecheck before considering any milestone done.
