# Solution Directions: Ask the right questions

**Problem (as approved):** PMs with dyscalculia can't interrogate data they already have (they don't know what to ask of it), or identify what data they'd need to collect to answer a real business question they have. Existing data-literacy coaching (Maven, Mind the Product) teaches concepts abstractly, disconnected from the PM's own numbers — nothing in the market applies concepts to someone's own business context for *question-formation* specifically.

**Evidence used:** PLAN.md (Phase 3 roadmap, deterministic/LLM guardrail, existing Flow A–G architecture), a market scan (see Research stage log entry, 2026-09-21), no `interview-opportunities` output (no PM interviews run on this pain yet — flagged per direction below rather than papered over), no `context/business.md` (pre-revenue solo MVP; viability below is read against PLAN.md's own stated Validation plan — moderated 1:1 signal and thumbs-up/down feedback — rather than a revenue KPI that doesn't exist yet).

## At a glance

| Direction | Mechanism | Evidence | Viability signal | Effort |
|-----------|-----------|----------|-------------------|--------|
| A. Suggested-questions panel | Deterministic, rule-based nudge after Flow A/B | ⚠️ Assumed | Cheap engagement lift, low risk of a bad first impression | Cheap |
| B. Metrics Coach (conversational) | LLM-mediated dialogue extending Flow C | ⚠️ Assumed | Deepest fit to "coaching," highest chance of standing out in validation sessions | Medium |
| C. Connect real data (borrow) | Integrate a real analytics API instead of coaching around missing data | ⚠️ Assumed | Removes the need for B/A for connected users, but competes with an already-deferred roadmap decision | Expensive |
| D. Metrics glossary + worked example | Self-serve reference page, worked against the user's own last dataset | ⚠️ Assumed | Cheapest way to test whether "applied, not abstract" actually resonates | Cheap–Medium |

## Direction A: Suggested-questions panel
**Pitch:** After Flow A/B restates a table, a deterministic rules engine looks at the detected column types and shape (dates across periods, counts, percents) and surfaces 2–3 relevant next questions the data can already answer — no LLM judgment about *what* to suggest, only about how to phrase the suggestion.
**Customer evidence:** ⚠️ Assumed — no interview has surfaced this specific moment ("I just saw my numbers and didn't know what to ask next"); it's inferred from the problem framing, not a quote.
**Market context:** No competitor found doing this — Amplitude/Pendo assume the PM already knows to build a cohort or funnel view; this would intervene one step earlier than any tool surfaced in the scan.
**Business viability:** Cheapest possible way to generate a validation signal (thumbs-up/down per suggestion) without risking a bad first impression on a low-numeracy-confidence audience — a bad automatic suggestion is a small, contained failure compared to a bad open-ended answer.
**Effort:** Cheap — reuses the column-type detection already in `lib/compute/parse-table.ts`; no new LLM capability, no new data model.
**What would have to be true:** The existing type-detection logic can reliably recognize "this data could answer a retention/cohort/trend question" without false positives — a false suggestion erodes trust faster than no suggestion at all. → test with `prototype-system-model` (run the real detection logic against real/sample data shapes and see what it actually flags).
**Evidence strength:** ⚠️ Assumed

## Direction B: Metrics Coach (conversational)
**Pitch:** Extend Flow C's chat — already capable of "explain a general concept, clearly separated from dataset figures" per PLAN.md — into a dedicated surface where a PM asks anything in plain language ("what's a retention curve, and can I compute mine?"), and the system either calls the same precomputed-value tools Flow C already uses to show their real number, or tells them exactly what columns/data they'd need to collect if they can't yet.
**Customer evidence:** ⚠️ Assumed — same gap as above, no direct quote.
**Market context:** Real category exists (Maven, Mind the Product) but only as generic human coaching, never embedded in the PM's own data or their own tool session — this is the most direct hit on the stated differentiator.
**Business viability:** Most likely of the four to produce a strong or weak signal fast in a moderated 1:1 session, since it's the direction that most literally matches what "coaching" means to a tester — high information value even if it doesn't ship first.
**Effort:** Medium — new system-prompt design and a "no data yet" response template, but built on Flow C's existing tool-calling infrastructure rather than a new capability from scratch.
**What would have to be true:** The system reliably distinguishes "I can answer this from your data" from "I can't" and never fabricates a number when the data isn't present — this is exactly the guardrail PLAN.md already treats as critical elsewhere. → test with `prototype-system-model` (run real prompts against the real tool-calling setup with datasets that do and don't contain what's asked, and watch what it actually does, not what the prompt says it should do).
**Evidence strength:** ⚠️ Assumed

## Direction C: Connect real data (borrow)
**Pitch:** Instead of coaching a PM on what data they'd need, offer a guided connector to a real analytics source (Amplitude/Mixpanel/similar) so they get the actual number, not guidance toward one.
**Customer evidence:** ⚠️ Assumed.
**Market context:** This is what the established product-analytics tools already do well — the "borrow" option here is closest to conceding the question-formation problem back to incumbents rather than solving it.
**Business viability:** Weakest of the four right now — PLAN.md already deferred direct BI-tool integrations explicitly, for reasons unrelated to this feature (scope, no accounts yet, unvalidated core product); building this now would mean re-opening a decision already made, not just picking a solution direction.
**Effort:** Expensive — real third-party API integrations, auth, and almost certainly the account system PLAN.md deliberately avoided for the MVP.
**What would have to be true:** That it's worth reversing an already-made sequencing decision — a roadmap/business question, not something a code-level prototype answers. No prototype skill applies here as cleanly as to A, B, or D; if this direction is picked, the real next step is revisiting *why* it was deferred, not prototyping it.
**Evidence strength:** ⚠️ Assumed

## Direction D: Metrics glossary + worked example
**Pitch:** A self-serve reference section listing common PM metrics (retention curve, cohort, CAC, LTV, churn), each with a plain-language definition and — where the user's own most recent dataset has a matching shape — a small worked example computed from their actual numbers, falling back to a generic example otherwise.
**Customer evidence:** ⚠️ Assumed.
**Market context:** Closest in spirit to the existing course-style content (Udemy, DataSociety), but the differentiator is the same one this whole product already leans on: applied to the reader's own numbers instead of a generic textbook example.
**Business viability:** Cheapest way to specifically test whether "applied, not abstract" is what actually earns approval in a validation session, isolated from any conversational-UX variable that Direction B would introduce.
**Effort:** Cheap–medium — mostly content plus reusing the existing `NumberCard` rendering pattern for the worked-example substitution logic.
**What would have to be true:** That a real user's uploaded data shape (dates + counts/currency across periods) is common enough that the substitution actually fires most of the time — if it mostly falls back to the generic example, the whole point of the direction is undercut. → test with `prototype-system-model` (run the substitution logic against realistic sample datasets and see the real hit rate, not an assumed one).
**Evidence strength:** ⚠️ Assumed

## What the choice turns on

A and D are both cheap and low-risk, and mostly differ in *when* the help shows up — proactive nudge (A) vs. something the PM goes looking for (D); they could plausibly ship together without much extra cost, since D's worked-example logic and A's detection logic overlap. B is the direction that most directly matches what "coaching" means and would generate the clearest validation signal, but it's the only one carrying real risk against the fabrication guardrail, and that risk needs to be tested, not assumed away, before committing to it. C isn't really competing on merit with the other three — it's a re-litigation of an already-made roadmap decision, and probably shouldn't be picked without first asking why BI integrations were deferred in the first place. The thinnest evidence across all four is the same thing: nobody has actually said any of this to a PM's face yet — an `interview-opportunities` run on this specific question would firm up every one of these ⚠️ Assumed labels a lot faster than more reasoning would.

## Gaps
- No `context/business.md` — viability notes are read against PLAN.md's stated Validation plan (moderated 1:1 sessions, thumbs-up/down), not a revenue KPI, since none exists yet for this pre-revenue MVP.
- No `interview-opportunities` output — every direction's customer-evidence field is honestly ⚠️ Assumed, not backed by a quote.
