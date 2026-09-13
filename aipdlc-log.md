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
