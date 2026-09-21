# AIPDLC audit log — dyscalculia

Evidence trail of AI-proposed work and human gate decisions for this project. Append-only.

## 2026-09-12T06:18:44Z — Stage: Discover/Ideate
**Proposed:** Flow G framing — let a PM hand off the read-only, computed-only interpretation to a colleague without signup friction
**Decision:** Edited
**Notes:** framing was missing that the PM needs to add their own commentary/recommendation on top of the data before sharing, not just forward the raw restated view

## 2026-09-12T06:19:47Z — Stage: Discover/Ideate
**Proposed:** Revised framing — PM attaches commentary/recommendation to the computed-only interpretation, shares read-only, no signup either side
**Decision:** Approved
**Notes:** —

## 2026-09-13T06:57:44Z — Stage: Plan/Spec
**Proposed:** PRD + INVEST user stories for Share (Flow G) with PM commentary, 3 stories / 9 acceptance criteria
**Decision:** Edited (in progress)
**Notes:** user wants to refine the PRD before approving; specifics pending

## 2026-09-13T07:20:23Z — Stage: Plan/Spec
**Proposed:** Revised PRD — added full Flow A–G context section and an Evals (golden dataset) section framed as a data-boundary regression suite
**Decision:** Approved
**Notes:** two edit rounds before this: (1) added Flows A–F for standalone context, (2) added evals section

## 2026-09-13T07:40:52Z — Stage: Architect/Design
**Proposed:** Implementation plan — Neon Postgres (1 table, no ORM), dual view/manage tokens, revoked/never-issued parity at the data layer, ~14 new files + 1 modified
**Decision:** Approved
**Notes:** two design choices confirmed via AskUserQuestion first: accept manage-token loss as MVP limitation; confirm Neon Postgres via Marketplace over a KV store

## 2026-09-13T15:17:29Z — Stage: Build/Implement
**Proposed:** 17 new files + 1 modified, committed to feature/share-flow-g (22d5315); Neon Postgres provisioned and live; 92/92 tests pass, lint/typecheck clean; verified end-to-end in a real browser session including a bug found and fixed (duplicate React key from FollowUpChat/SharePanel, and a missing revoked-check on commentary edit)
**Decision:** Branch ready for review — no PR opened, this repo has no GitHub remote configured
**Notes:** merge/remote setup is the user's call, not automated by this pipeline

## 2026-09-13T15:32:13Z — Stage: Verify/Test
**Proposed:** 92/92 tests pass, lint/typecheck clean, all 9 acceptance criteria across Stories 1-3 verified end-to-end (browser + curl) against the real Neon database
**Decision:** Approved
**Notes:** ready for the user to merge feature/share-flow-g into main themselves — not done automatically. Stage 6 (Release/Operate) not started — no deploy target confirmed

## 2026-09-21T12:46:28Z — Item: ask-the-right-questions — Stage: Research
**Proposed:** Synthesis — already on PLAN.md's Phase 3 roadmap; market gap confirmed (data-literacy coaching exists only as generic courses, never embedded in a PM's own data); feasibility split (explaining concepts has existing scaffolding in Flow C, "what data should I collect" is genuinely new with a different risk profile than numeric hallucination); no interview evidence yet for this specific pain
**Decision:** Approved
**Notes:** —

## 2026-09-21T12:48:45Z — Item: ask-the-right-questions — Stage: Discover/Ideate — Problem framing
**Proposed:** Two-sided gap — PMs can't interrogate data they have (don't know what to ask) or identify what data they'd need to answer a question they do have; generic courses teach concepts abstractly, disconnected from the PM's own numbers; why now — Flow A/B/C already give a real compute layer and a "general concept" chat pattern to extend
**Decision:** Approved
**Notes:** —

## 2026-09-21T12:58:09Z — Item: ask-the-right-questions — Stage: Discover/Ideate — Solution direction
**Proposed:** 4 directions (A. suggested-questions panel, B. conversational Metrics Coach, C. connect real data, D. glossary + worked example) — see specs/outputs/solution-directions-ask-the-right-questions-2026-09-21.md
**Decision:** Approved — combined A + D
**Notes:** B (strongest differentiator hit) and C (re-opens a deferred roadmap decision) not chosen for now; item stops here per user's original scope (Research + Discover/Ideate only) — Plan/Spec not started

## 2026-09-21T13:21:06Z — Item: ask-the-right-questions — Stage: Plan/Spec
**Proposed:** PRD + 6 user stories for combined A + D (suggested-questions panel, metrics glossary with own-data worked example) — see specs/outputs/prd-ask-the-right-questions-2026-09-21.md and user-stories-ask-the-right-questions-2026-09-21.md
**Decision:** Approved
**Notes:** B and C recorded as non-goals; code constraints found (dataset only in React state, no Flow E, coarse ColumnType so no retention/cohort detection) shaped scope; success-metric targets left as placeholders pending Prototype

## 2026-09-21T13:44:08Z — Item: ask-the-right-questions — Stage: Prototype
**Proposed:** system-model prototype — real parser/cards/chat tools run against 16 sample datasets, v0 (spec as written) vs v1 (shape guard) — https://claude.ai/artifact/LwW6NYuuB8tasVykZvz5XQ
**Decision:** Edited
**Notes:** spec needs revising — LOOP BACK TO Plan/Spec (resume there, not at Prototype). Findings: v0 trend rule gave 4 wrong suggestions on 2 datasets (v1 guard: 0); 2/9 legit period datasets silent (month-name/ambiguous dates); own-data glossary hit on 3/15 datasets, retention 0/2; text columns never reach client; flat-series vacuous suggestion; 0 tool errors across 36 suggestions. Samples are hand-built, not real user data

## 2026-09-21T13:49:08Z — Item: ask-the-right-questions — Stage: Plan/Spec (rev 2, after Prototype)
**Proposed:** revised PRD + 7 stories (new Story 0: API returns dataset shape + all column names; trend rules gated on periodsTrustworthy; flat-series gate; glossary re-centred on definition + data-needed, own-data example optional) — see prd-ask-the-right-questions-2026-09-21.md and user-stories-ask-the-right-questions-2026-09-21.md
**Decision:** Approved
**Notes:** decided at this gate — keep Story 5 (own-data example) as an optional bonus; fix formatCurrency (£ shown as $) first as a prerequisite to Story 5. Month-name date parsing and other Flow A issues remain non-goals. Success-metric coverage targets still placeholders pending real PM datasets

## 2026-09-21T14:20:14Z — Item: ask-the-right-questions — Stage: Architect/Design
**Proposed:** implementation plan — 7 scoped changes (currency symbol fix, dataset-shape + API field, suggestion rules, panel + click-to-ask with useChat lifted, ratings in Neon, glossary section, own-data example); plan file ~/.claude/plans/sequential-greeting-thimble.md
**Decision:** Approved
**Notes:** approved via ExitPlanMode; key calls — server-side shape guard, glossary as in-page <details>, ratings in a hand-DDL'd Neon table (user runs the DDL), verify useChat id-reset before lifting it

## 2026-09-21T14:43:17Z — Item: ask-the-right-questions — Stage: Build/Implement
**Proposed:** PR #1 (feature/ask-the-right-questions) opened for human review — 7 scoped changes + log commit, 146 tests, tsc/eslint clean at head
**Decision:** Approved
**Notes:** PR opened by the user (gh CLI unavailable to Claude) and merged by the user into main as fc6cf52 — merged before Verify/Test, so verification below is post-merge. Not yet verified at merge time: browser pass (Chrome extension was disconnected); suggestion_feedback DDL not yet run against Neon

## 2026-09-21T14:45:21Z — Item: ask-the-right-questions — Stage: Verify/Test
**Proposed:** 146/146 tests pass, tsc/eslint clean on merged main; acceptance criteria for Stories 0, 5, 6 and most of 1, 3, 4 verified by unit/route tests and a live curl of /api/interpret and the rendered glossary
**Decision:** Approved
**Notes:** accepted with KNOWN GAPS still owed by the user — Story 2 (click-to-ask sends into chat, tool-backed answer, keyboard/screen-reader), Story 4 AC4 (keyboard/focus on <details>), Story 3 AC1/AC3 against a real DB (suggestion_feedback DDL not yet run) and fail-soft in a browser; also dark mode / phone width. Verified post-merge (PR merged before this stage). Stage 8 (Release/Operate) not started
