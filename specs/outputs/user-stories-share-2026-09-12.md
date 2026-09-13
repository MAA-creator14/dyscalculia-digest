# User Stories: Share (Flow G) — PM commentary + read-only link

*No `context/personas.md` exists for this project — persona details below are taken from PLAN.md's description of the target user (a PM with dyscalculia) rather than a dedicated persona file.*

---

## Story 1: Add commentary before sharing

### Story
**As a** PM with dyscalculia who has just reviewed a restated metric,
**I want to** attach a short plain-text note with my own read on the data before sharing it,
**So that** the person I share it with sees my judgment alongside the numbers, not just the numbers alone.

### INVEST Checklist
- [x] **Independent** — Delivered as one field on the existing share-setup panel; doesn't require Story 2 or 3 to be usable in isolation for testing, though it's only visible in practice once a share link exists.
- [x] **Negotiable** — Field label/placeholder wording is flexible.
- [x] **Valuable** — Directly serves the approved job-to-be-done: PM's recommendation travels with the data, not just the restated numbers.
- [x] **Estimable** — One text field + one DB column; small, well-understood scope.
- [x] **Small** — Fits comfortably in a single sprint alongside Stories 2–3.
- [x] **Testable** — See acceptance criteria below.

### Acceptance Criteria

**AC1: Commentary is optional**
**Given** a PM is creating a share link,
**When** they leave the commentary field empty and create the share,
**Then** the share is created successfully with no commentary shown on the shared view (no empty box, no "no comment" placeholder — the section simply doesn't render).

**AC2: Commentary appears distinctly from the data**
**Given** a PM has entered commentary and created the share,
**When** anyone opens the resulting link,
**Then** the commentary renders in a visually distinct block, clearly separated from the computed NumberCards/exec summary, so a reader cannot mistake the PM's opinion for a computed value.

**AC3: Commentary is editable after creation**
**Given** a share link already exists and has not been revoked,
**When** the PM edits the commentary text and saves,
**Then** the same link (same token) reflects the updated commentary on next load — no new token is generated.

### Edge Cases
- Commentary containing only whitespace — treat as empty (falls under AC1), don't render an empty-looking block.
- Very long commentary (e.g. several paragraphs) — no hard cap defined in the PRD; render it as-is but don't let it push the computed data below the fold on mobile (respect PLAN.md's mobile-first requirement).

### Technical Notes
- Plain text only — no rich formatting, no markdown rendering. Per the PRD's non-goals, this is deliberate, not an oversight.
- Commentary is never passed to any LLM call — it's PM-authored text, not something the narration/summary pipeline touches.

### Out of Scope
- Structuring commentary into separate fields (e.g. "context" vs. "recommendation") — flagged as an open question in the PRD, not this story.

### Related Context
- **Persona pain point (PLAN.md):** misreading a number is professionally risky for this persona — commentary lets the PM state their interpretation explicitly rather than leaving it to be inferred.

---

## Story 2: Recipient opens the link with zero signup

### Story
**As a** colleague or stakeholder receiving a shared link,
**I want to** open it and see the interpretation immediately,
**So that** I'm not blocked by an account I don't have and don't want to create just to read one update.

### INVEST Checklist
- [x] **Independent** — The viewer route can be built and tested against a manually-inserted share record before Story 1's UI exists.
- [x] **Negotiable** — Exact page layout is flexible; "no auth required" is the fixed constraint.
- [x] **Valuable** — Removing signup friction is the core reason a link is better than "ask them to log in and re-run the analysis."
- [x] **Estimable** — One new route + one lookup by token; small.
- [x] **Small** — Fits in a sprint.
- [x] **Testable** — See below.

### Acceptance Criteria

**AC1: Valid, non-revoked token renders the interpretation**
**Given** a share token exists and has not been revoked,
**When** anyone (including someone with no account) navigates to `share/[token]`,
**Then** the page renders the computed interpretation (NumberCards, exec summary, anomalies) and any commentary, with no login prompt anywhere in the flow.

**AC2: Raw source data is never exposed via the link**
**Given** the same valid share page,
**When** its network requests and rendered HTML are inspected,
**Then** neither contains the original uploaded table/CSV/screenshot data — only the already-computed summary fields.

**AC3: Nonexistent token fails safely**
**Given** a token that was never issued,
**When** someone navigates to `share/[garbage-token]`,
**Then** the page shows a generic "this link isn't valid" message — not a stack trace, not a 500, and not information distinguishing "never existed" from "exists but something broke."

### Edge Cases
- Token guessing/enumeration attempts — covered by Story 3's non-enumerable token requirement, but this story's page must not itself leak timing or error differences between "wrong token" and "revoked token" beyond what Story 3 defines.
- Crawler/bot access to a share link (e.g. a link preview unfurling in Slack) — acceptable to render normally; this is a read-only, intentionally shareable page, not a security boundary against automated fetches.

### Technical Notes
- No auth middleware on this route — confirm it's excluded from any future auth rollout by default (auth should be opt-in per-route later, not accidentally applied here).

### Out of Scope
- View tracking/"who viewed this" — explicitly a PRD non-goal.

### Related Context
- **Roadmap item (PLAN.md):** "No auth for the first demoable slice" — this story is the clearest expression of that principle for a second-party viewer.

---

## Story 3: Revoke a link

### Story
**As a** PM who shared a link and later wants it gone,
**I want to** revoke it and have it stop working immediately,
**So that** an outdated or incorrect view can't keep circulating after I've moved on from it.

### INVEST Checklist
- [x] **Independent** — Testable with a manually created share record; doesn't depend on Story 1's commentary UI.
- [x] **Negotiable** — Exact revoke UI placement is flexible (button on the PM's own interpretation page vs. a dedicated share-management view).
- [x] **Valuable** — Directly derived from the PRD's Story 3 and its risk table (mitigates the "outdated view keeps circulating" risk).
- [x] **Estimable** — One boolean flag flip + one guard check on the viewer route; small.
- [x] **Small** — Fits in a sprint.
- [x] **Testable** — See below.

### Acceptance Criteria

**AC1: Revoking disables the link immediately**
**Given** a valid, non-revoked share token,
**When** the owning PM revokes it,
**Then** the very next request to `share/[token]` (by anyone) shows a "this link has been revoked" page instead of the interpretation.

**AC2: Revoked page is indistinguishable from "never existed"**
**Given** two tokens — one revoked, one that was never issued,
**When** each is loaded,
**Then** both render the same generic "not available" message with no wording difference that would let a third party infer one token used to be valid and the other never was.

**AC3: Revocation is not reversible via this feature**
**Given** a revoked token,
**When** the PM wants the same content shareable again,
**Then** they must create a new share (new token) — there is no "un-revoke" action, since PLAN.md's manual-revoke design implies revoke is a one-way trust action, not a toggle.

### Edge Cases
- Token is generated with sufficient randomness that guessing a valid token by brute force is infeasible — this is Story 2 AC3's territory but is the precondition that makes Story 3's "safe failure" meaningful at all; call it out here since a predictable token would make revocation moot (an attacker could just guess the next one).
- Revoking a link that's currently being viewed mid-load — acceptable for the in-flight request to complete; only *subsequent* requests must be blocked (no requirement for mid-session kill-switch).

### Technical Notes
- A `revoked: boolean` flag is sufficient per the PRD — no need for a separate "deleted" state; that's the same critical-path persistence decision flagged in the PRD's Dependencies section.

### Out of Scope
- Auto-expiry — explicitly excluded in PLAN.md and the PRD's non-goals; revoke is the only lifecycle action for MVP.
