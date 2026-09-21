# PRD: Ask the right questions — suggested questions + metrics glossary

**Status:** Draft — rev 2 (revised after Prototype gate, 2026-09-21)
**Owner:** Marc Abraham
**Last Updated:** 2026-09-21
**Target Release:** Phase 3 (PLAN.md), pulled forward as a validation probe
**Availability:** All users (no auth/tier system exists yet)
**Rationale:** Product has no accounts or billing in MVP; this feature must not require either.

## Context
*What I found (this project has no `context/` folder, so PLAN.md, the shipped code, and the approved Stage 1–2 outputs are the source of truth):*
- **Roadmap:** PLAN.md Phase 3 lists "'ask the right questions' data-literacy coaching as a deeper guided experience (retention curves, cohort analysis guidance)". This PRD is a deliberately small first slice of that item, not the whole thing.
- **Persona pain:** PMs with dyscalculia; misreading or mis-asking about a number is "professionally risky." The gap here is upstream of misreading: not knowing *what to ask* of data they already have, or what data they would need to answer a question they do have.
- **Strategic fit:** Extends the product's differentiator (numbers restated and made trustworthy) from "understand this number" to "know what to do with it," without breaking the deterministic-vs-LLM guardrail.
- **Competitive:** Not assessed against a `competitors.md` (none exists). The Stage 1 market scan found data-literacy coaching only as generic courses (Maven, Mind the Product, Udemy, DataSociety), never applied to the PM's own numbers.
- **Direction chosen (Stage 2b, approved 2026-09-21):** A + D combined. See `specs/outputs/solution-directions-ask-the-right-questions-2026-09-21.md`.

### Constraints found in the current code (these shape scope)
- **The dataset is ephemeral.** `components/interpret/InterpretView.tsx` holds `cards`, `execSummary` and `periodLabels` in React state only. Flow E (session recall) is not built. So "worked example on the user's own last dataset" can only mean *the dataset currently on screen*, not a remembered one.
- **Column types are coarse.** `lib/compute/types.ts` defines `date | percent | currency | count | ratio | string`. There is no user-ID, cohort, or event concept. So the system cannot detect "you have retention data." It can only detect shape: a date axis with numeric columns across periods, ratios/percents, and so on.
- **The browser only receives cards, exec summary and period labels.** `/api/interpret` returns nothing about the parsed table's shape or its text columns. Text columns (cohort, channel, segment) never become cards. *(Found in code, then confirmed by the prototype: 8 of 15 sample datasets had one.)*
- **Precomputed values already exist.** `NumberCardData` carries `delta`, `streak`, `anomalies`, and `sentence`, and the exec summary already selects movers. Suggestions and worked examples must reuse these, not compute anything new in the LLM.

## Revision notes (rev 2, after Prototype)
The Prototype ran the real parser, card builder and chat tools against 16 hand-built datasets (no real user data exists yet). Artifact: https://claude.ai/artifact/LwW6NYuuB8tasVykZvz5XQ. What changed in this spec, and why:

| Prototype finding | Spec change |
|-------------------|-------------|
| The rule "date column + ≥2 rows" gave 4 wrong trend suggestions on 2 datasets (repeated dates); requiring unique, ascending dates gave 0 | Trend questions gated on a **shape guard**; new enabler story (Story 0) makes the API return it |
| Text columns never reach the browser; "cohort" was recoverable only from the full table | API also returns **column names and types for all columns** |
| 2 of 9 legitimate multi-period datasets got nothing (month names, ambiguous slash dates) | Accepted as a known gap; month/quarter label parsing recorded as a separate, optional change (Non-Goals, Open Questions) |
| Own-data glossary examples usable in 3 of 15 datasets; retention 0 of 2; type-only matching falsely hit 22 of 66 unsupported pairs | Glossary value re-centred on **definition + "data you'd need"** (always available); own-data example is **opportunistic**, requires name **and** type match plus the shape guard |
| A correct name+type match (channel CAC) still produced a misleading first-to-last comparison | Own-data examples only when the shape guard passes |
| Flat series produced a vacuous "biggest change: 0" suggestion | Minimum-signal gate: no suggestion about a series with no movement |
| All 36 suggestions mapped to chat tools that returned non-error results | No change; Story 1 AC4 confirmed |

Adjacent Flow A issues the prototype exposed are listed under Non-Goals and Dependencies rather than fixed here.

## Problem
A PM with dyscalculia who has just restated a table can read what it says, but often doesn't know what to ask *of* it next: which comparison matters, what a trend implies, what a metric like "churn" or "retention" actually measures and whether their data can answer it. The reverse also happens: they have a business question but can't tell what data they would need to collect to answer it. Generic courses teach these concepts abstractly, disconnected from the PM's own numbers.

## Evidence
- ✅ **Validated:** PLAN.md documents the underlying persona pain from the founder's lived experience; Stage 1 research confirmed the market gap (no tool applies data-literacy coaching to the PM's own data for question-formation).
- ✅ **Validated by prototype (on hand-built samples):** the suggestion rules can be made safe with a shape guard (0 wrong suggestions of 16, vs 4 of 20 without it), and every suggestion maps to a chat tool that answers.
- ⚠️ **Assumed:** That PMs experience "I saw my numbers and didn't know what to ask next" as a real, felt moment. No interview has surfaced this. **Biggest assumption in this PRD.**
- ⚠️ **Assumed:** That real PM datasets resemble the 16 samples. They are my construction from common export shapes, so hit rates show which shapes break the rules, not how often those shapes occur.
- ⚠️ **Assumed:** That a proactive nudge (A) and a self-serve reference (D) are the right first shapes rather than conversational coaching (B).

## Success Criteria

### Lagging Indicators (post-launch outcomes)
| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| Suggestion helpfulness (thumbs-up ÷ thumbs-up + thumbs-down) | `[PLACEHOLDER — no usage data yet]` | `[PLACEHOLDER]` | First moderated validation round |
| % of interpretations where ≥1 suggested question is clicked | `[PLACEHOLDER]` | `[PLACEHOLDER]` | First moderated validation round |
| % of glossary opens that reach the "data you'd need" line (the always-available value) | `[PLACEHOLDER]` | `[PLACEHOLDER]` | First moderated validation round |
| % of glossary opens where the own-data example fires (informational, not a target) | prototype sample: 3 of 15 datasets | none — expected to be low | First moderated validation round |

### Leading Indicators (pre-launch signals, measured on the prototype sample)
| Metric | Prototype result | Target | What This Predicts |
|--------|------------------|--------|--------------------|
| Wrong suggestions (trend claim over non-period rows) | v0: 4 of 20 · v1: 0 of 16 | **0**, re-checked on real PM datasets before release | Whether suggestions build or erode trust |
| Legitimate multi-period datasets that get ≥1 suggestion | v1: 7 of 9 | `[PLACEHOLDER — set after real datasets]` | Whether the panel shows up often enough to matter |
| Suggestions whose chat tool returns a non-error answer | 36 of 36 | 100% | Whether a click always leads somewhere useful |
| Glossary own-data matcher: false matches | name+type: 0 · type-only: 22 of 66 | 0 | Whether "applied to your data" is ever wrong |
| Founder dogfooding: clicks suggestions on real interpretations | not yet measured | ≥3 real interpretations | Whether the nudge is a real want |

💡 The trust metric (wrong suggestions) is the only one with a hard target; coverage targets stay unset until real datasets exist.

## Proposed Solution

### How It Works
Three pieces, all inside the existing interpretation view, all reusing what Flow A/B/C already computed.

**Enabler: dataset shape from the API (new in rev 2).** `/api/interpret` additionally returns (a) `periodsTrustworthy`: true only when the table has ≥2 rows, a date column, and unique, strictly ascending dates; (b) name and type of **every** column (including text columns); (c) row count. No raw cell values beyond what cards already carry.

**A. Suggested-questions panel.** After an interpretation renders, a deterministic rules module picks 1–3 questions the data can answer:
- Trend questions (biggest change by period, longest streak, which metric moved most) appear **only when `periodsTrustworthy` is true**.
- A series with no movement (all deltas zero) is never the subject of a suggestion.
- "What stands out in X?" may appear on any shape for statistical outliers, but sign-flip and sudden-zero anomalies need `periodsTrustworthy`.
- If no rule qualifies, the panel is not shown. Every suggestion names the chat tool that answers it, and clicking sends it into Flow C.
- Each suggestion has a thumbs-up/down control.

**D. Metrics glossary.** A "What does this mean?" reference opened from within the interpretation view, listing common PM metrics (retention, cohort, churn, CAC, LTV). Each entry has:
1. a plain-language definition (static authored content);
2. a "what data you'd need" line (always shown);
3. an honest statement of what the current table has or lacks, using the all-column metadata (for example "Your table has a 'Cohort' column but no per-cohort retention figures");
4. **opportunistically**, an own-data example, only when a column matches the entry by **both name and type** and `periodsTrustworthy` is true; otherwise a clearly labeled generic example.

**Expectation to set:** on the prototype sample the own-data example fired for 3 of 15 datasets. The glossary's value is items 1–3; item 4 is a bonus, not the differentiator.

**Shared guardrail.** Any number shown is either a precomputed value or clearly marked as a generic illustrative example. The LLM never computes or invents a dataset-specific figure, and general knowledge is visibly separated from dataset facts (the existing "In general:" convention from Flow C).

### User Stories (Examples)
*Full sprint-ready stories with acceptance criteria are in `specs/outputs/user-stories-ask-the-right-questions-2026-09-21.md`.*

**Story 1:** As a PM who just restated a table, I want to see a few relevant questions my data can already answer, so that I know what to ask next without inventing the question myself.

**Story 2:** As a PM unsure what "retention" means, I want a plain-language definition and to be told what data I'd need, so that I understand the concept and what to collect.

**Story 3:** As a PM whose data can't answer a metric I'm curious about, I want to be told plainly what my table has and lacks, so that I'm never shown a fabricated or irrelevant figure.

## Non-Goals
- **Not a conversational Metrics Coach (Direction B).** Deferred: strongest differentiator, but the only direction with real fabrication risk. Revisit after this probe.
- **Not connecting real analytics data (Direction C).** Re-opens the BI-integration deferral already made in PLAN.md.
- **No month-name or quarter-label date parsing** ("Jan 2026", "Q2"). The prototype showed this leaves 2 of 9 legitimate period datasets without suggestions; that is a parser change with its own scope, recorded as an Open Question.
- **No fixes to the adjacent Flow A issues** the prototype exposed (currency symbol, non-period narration, silently dropped columns, ID columns as cards). See Dependencies for the one that touches this feature.
- No detection of retention/cohort *values*; the glossary only reports what columns exist.
- No own-data example built from a first-to-last delta when rows aren't verified periods.
- No persistence of the dataset for the glossary (Flow E is unbuilt); examples use only the dataset currently on screen.
- No LLM-generated suggestions or LLM-generated glossary definitions per request.
- No personalization from the first-run intake answer.

## Dependencies

### Feature Dependencies
- **Flow A/B compute layer** (`parse-table.ts`, `build-number-cards.ts`, `summarize.ts`): source of every precomputed value — **shipped**.
- **`/api/interpret` response change** (new): must return `periodsTrustworthy`, all-column names/types, and row count. Everything in Parts A and D depends on it — **not built; this is the critical path**.
- **Flow C follow-up chat** (`FollowUpChat.tsx`, `chat-tools.ts`): destination when a suggestion is clicked — **shipped**. Needs a way to submit a question programmatically.
- **Currency formatting** (`lib/compute/format.ts:16`): `formatCurrency` hardcodes `$`, so a £ column renders as `$`. Any own-data example on a currency column (CAC, LTV) would show the wrong symbol. **Decided (rev 2 approval): fix `formatCurrency` first, as a small prerequisite change before Story 5.**
- **Flow E session recall**: not needed; explicitly out of scope.

### Team Dependencies
- None (solo project).

### External Dependencies
- None new.

**Critical Path:** the `/api/interpret` shape change, then the false-suggestion rate on real PM datasets (target 0).

## Risks
*Risk types: V=Value, U=Usability, F=Feasibility, B=Business Viability. Impact: H=High, M=Medium, L=Low*

| Risk | Type | Impact | Mitigation |
|------|------|--------|------------|
| Nobody actually has the "what do I ask next?" moment; panel is ignored | V | H | Thumbs-up/down and click-through in moderated sessions; interview round on this pain before wider release |
| A wrong suggestion erodes trust faster than none | U | H | **Measured:** 4 of 20 wrong without the shape guard, 0 of 16 with it. Guard is mandatory; re-test on real PM datasets |
| Real datasets differ from the 16 hand-built samples, so the guard misses a shape | F | H | Test against 3–5 real PM datasets before release; keep the panel under-suggesting by default |
| Glossary own-data example rarely fires (3 of 15 in the sample) | V | M | Value re-centred on definition + data-needed; own-data example demoted to a bonus |
| A correct name+type match still yields a misleading example | F | H | Require `periodsTrustworthy`; otherwise show the generic labeled example |
| Wrong currency symbol on own-data examples (£ shown as $) | F | M | Fix `formatCurrency` first (decided), before Story 5 |
| Silent when dates are month names or ambiguous | U | M | Accepted gap for now; parser change recorded as optional follow-up |
| Users with numbers anxiety feel a panel adds noise | U | M | Collapsed/dismissible, no motion, no engagement loops (PLAN.md) |
| Glossary definitions are wrong or oversimplified | B | M | Author once, review against a trusted source; no request-time generation |

## Open Questions
| Question | Assumption | How to Validate | Timeline |
|----------|-----------|-----------------|----------|
| Do PMs feel "I don't know what to ask" as a real moment? | Yes, often enough to matter | `interview-opportunities` on 3–5 PM conversations, or a moderated session with the panel | Before wider release |
| Do real PM datasets match the 16 samples closely enough? | Mostly | Run the rules against 3–5 real datasets from PMs | Before the shape guard is trusted |
| ~~Is the own-data glossary example worth keeping at ~20% hit rate?~~ | **Decided: keep as an optional bonus** (Story 5); re-measure on real data | Real PM datasets | Resolved at Plan/Spec gate |
| Should month-name / quarter-label parsing be a separate change? | Yes, optional | Scope as its own item if real datasets show it matters | After first real datasets |
| ~~Fix `formatCurrency` (£ → $) before Story 5, or restrict Story 5 to non-currency entries?~~ | **Decided: fix `formatCurrency` first** | — | Resolved at Plan/Spec gate |
| Panel placement and glossary form (drawer vs section)? | Panel below summary; glossary as in-view drawer | Confirm in Architect | Architect stage |

## Before Finalizing
- [ ] `competitors.md` doesn't exist; competitor check skipped (Stage 1 scan covers it).
- [ ] No contradicting user feedback exists yet (none collected). Flagged in Evidence.

## Sign-off
| Role | Name | Approved |
|------|------|----------|
| Product | Marc Abraham | ⬜ |
| Engineering | — | ⬜ |
| Design | — | ⬜ |
