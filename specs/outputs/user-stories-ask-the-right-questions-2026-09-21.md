# User Stories: Ask the right questions (suggested questions + metrics glossary)

Source PRD: `specs/outputs/prd-ask-the-right-questions-2026-09-21.md`. Direction: A + D (approved 2026-09-21). **Rev 2:** revised after the Prototype gate; see the PRD's Revision notes.

## Context
*What I found (no `personas.md`/`product.md`; PLAN.md and the shipped code are the source):*
- **Persona:** A product manager with dyscalculia who pastes real company metrics into the tool.
- **Persona JTBD:** Turn raw numbers into something they can process reliably, without misreading them in a stand-up or exec update.
- **Related features:** Flow A/B (precomputed cards + exec summary), Flow C (follow-up chat; "In general:" separation), Flow D (inline calculator).
- **Codebase constraints that shape every story below:**
  - The dataset lives only in React state in `InterpretView.tsx`; no persistence, no Flow E.
  - `ColumnType` is `date | percent | currency | count | ratio | string`; no cohort/user-ID concept.
  - The LLM never computes or invents a dataset-specific number.

## Story map
| # | Story | Part | Depends on |
|---|-------|------|------------|
| 0 | API returns dataset shape and all column names | Enabler | — |
| 1 | See suggested questions for my dataset | A | 0 |
| 2 | Ask a suggested question in one click | A | 1 |
| 3 | Rate a suggestion | A | 1 |
| 4 | Look up a metric definition | D | — |
| 5 | See a definition worked on my own numbers (when it fits) | D | 0, 4, currency fix |
| 6 | Be told what my table has and lacks | D | 0, 4 |

Stories 0 and 4 are independent and can start in parallel. The `formatCurrency` (£ shown as $) fix is a small prerequisite for Story 5 (decided at the rev 2 gate). Story 5 is deliberately the most optional: on the prototype sample its own-data example fired for 3 of 15 datasets.

---

## Story 0: API returns dataset shape and all column names

**As the** interpretation view,
**I want** the interpret response to say whether the rows are trustworthy periods and to list every column,
**So that** suggestions and glossary examples never claim a trend over rows that aren't periods, and can tell what text columns exist.

### INVEST Checklist
- [x] **Independent**: only touches `/api/interpret` and its response type.
- [x] **Negotiable**: field names and exact shape are open.
- [x] **Valuable**: unblocks Stories 1, 5 and 6 and removes the misfires the prototype found.
- [x] **Estimable**: one pure function plus a response field.
- [x] **Small**: yes.
- [x] **Testable**: pure function over fixtures.

### Acceptance Criteria

#### AC1: Trustworthy periods
**Given** a table with a date column, at least 2 rows, and unique, strictly ascending dates,
**When** `/api/interpret` responds,
**Then** `periodsTrustworthy` is true.

#### AC2: Not trustworthy, with a reason
**Given** a table with no date column, a single row, repeated dates, descending dates, or a blank date cell,
**When** `/api/interpret` responds,
**Then** `periodsTrustworthy` is false and a short machine-readable reason is included.

#### AC3: All columns listed
**Given** a table with text columns (for example Cohort, Channel, Segment),
**When** `/api/interpret` responds,
**Then** the response lists every column's name and type, including text columns that have no card.

#### AC4: No new raw data
**Given** the response,
**When** it is inspected,
**Then** it contains no cell values beyond those already present in cards and period labels.

### Edge Cases
- Sample cases from the prototype: repeated dates per segment, ticket list with same-day dates, single-row snapshot → all false.
- Month-name or ambiguous-slash dates → no date column → false (known gap, see PRD Non-Goals).

### Technical Notes
- Pure function beside `derivePeriodLabels` in `lib/compute/`, unit-tested with the prototype's 16 sample datasets as fixtures (`prototypes/ask-the-right-questions/datasets.ts`).
- The shared-link summary (Flow G) should not need to change.

### Out of Scope
- Parsing month names or quarter labels.
- Fixing the adjacent Flow A issues (currency symbol, non-period narration, dropped-column caveat).

---

## Story 1: See suggested questions for my dataset

**As a** PM who just restated a table,
**I want to** see 1–3 questions my data can already answer,
**So that** I know what to ask next without having to invent the question myself.

### INVEST Checklist
- [x] **Independent**: needs only Story 0's shape flag plus already-computed cards.
- [x] **Negotiable**: which questions, wording, and panel placement are open.
- [x] **Valuable**: closes the "I didn't know what to ask" gap.
- [x] **Estimable**: a pure rules module plus one panel component.
- [x] **Small**: one module, one component, one test file.
- [x] **Testable**: rules are deterministic, so pass/fail per dataset shape.

### Acceptance Criteria

#### AC1: Suggestions appear for trustworthy periods
**Given** an interpretation where `periodsTrustworthy` is true and at least one series has movement,
**When** the interpretation renders,
**Then** a panel shows 1–3 suggested questions in plain language, each answerable from precomputed values.

#### AC2: No trend questions over non-period rows
**Given** `periodsTrustworthy` is false (single row, repeated or descending dates, no date column),
**When** the interpretation renders,
**Then** no trend question (biggest change by period, streak, biggest mover) is suggested. A statistical-outlier question ("What stands out in X?") may still appear.

#### AC3: Under-suggest when unsure
**Given** no rule qualifies,
**When** the interpretation renders,
**Then** the panel is not shown at all: no empty panel, no filler.

#### AC4: Suggestions are deterministic and tool-backed
**Given** the same dataset twice,
**When** suggestions are generated,
**Then** the same questions appear in the same order, no LLM call chooses them, and each maps to a chat tool that returns a non-error result.

#### AC5: Flat series are never suggested
**Given** a series whose values never change (for example seats constant at 250),
**When** suggestions are generated,
**Then** no question is asked about that series, and if every series is flat the panel is not shown.

#### AC6: Zero false trend claims on the fixtures
**Given** the 16 prototype sample datasets as fixtures,
**When** suggestions are generated,
**Then** no trend suggestion is produced for any dataset whose rows aren't ordered periods.

### Edge Cases
- Very many numeric columns → cap at 3; highest-priority rules win, stable order.
- Card with `percent === null` (previous value 0) → do not suggest a percent-change question about it.
- Month-name or ambiguous-slash dates → `periodsTrustworthy` false → no trend questions (accepted gap).

### Technical Notes
- Suggested home: `lib/compute/suggest-questions.ts` (pure, unit-tested, mirrors `summarize.ts`). The prototype's `rules.ts` is a working starting point, not production code.
- Reuse `NumberCardData.delta/streak/anomalies`; do not recompute.

### Out of Scope
- Detecting retention/cohort values.
- LLM-chosen or LLM-worded suggestions.
- Month-name date parsing.

---

## Story 2: Ask a suggested question in one click

**As a** PM looking at a suggested question,
**I want to** click it and get the answer in the existing follow-up chat,
**So that** I don't have to retype it or work out how to phrase it.

### INVEST Checklist
- [x] **Independent**: depends only on Story 1's panel.
- [x] **Negotiable**: auto-send vs. pre-fill-then-send is open.
- [x] **Valuable**: removes the phrasing barrier.
- [x] **Estimable**: `FollowUpChat` needs a programmatic submit path.
- [x] **Small**: one prop/handler and its wiring.
- [x] **Testable**: observable in chat history.

### Acceptance Criteria

#### AC1: Click sends the question
**Given** a suggested question is visible,
**When** the PM activates it (click or keyboard Enter/Space),
**Then** the question appears as a user message in the follow-up chat and the answer streams in.

#### AC2: Answer uses precomputed values only
**Given** a suggested question was sent,
**When** the assistant answers,
**Then** any dataset-specific number comes from a tool result, and general explanation is prefixed "In general:" (existing Flow C behavior).

#### AC3: Keyboard and screen reader
**Given** a suggestion,
**When** navigated by keyboard or screen reader,
**Then** it is focusable, has an accessible name equal to the question text, and shows a visible focus state (WCAG 2.1/2.2 AA per PLAN.md).

### Edge Cases
- Chat is mid-stream when a suggestion is clicked → Expected: queue or disable until the current answer ends; never drop it silently.
- New dataset submitted → Expected: old suggestions are replaced, not stacked.

### Technical Notes
- `FollowUpChat.tsx` needs a way to receive an externally supplied question (lifted state or a `sendMessage` ref).

### Out of Scope
- Follow-up suggestions after each chat answer.

---

## Story 3: Rate a suggestion

**As the** founder validating this feature,
**I want** a thumbs-up/down on each suggestion,
**So that** I can see in moderated sessions whether the nudge is actually useful.

### INVEST Checklist
- [x] **Independent**: only needs Story 1's panel.
- [x] **Negotiable**: where the signal is stored is open (see Technical Notes).
- [x] **Valuable**: it is the leading indicator the PRD depends on.
- [x] **Estimable**: two buttons plus one write.
- [x] **Small**: yes.
- [x] **Testable**: a rating produces a recorded event.

### Acceptance Criteria

#### AC1: Rating records a signal
**Given** a visible suggestion,
**When** the PM chooses thumbs-up or thumbs-down,
**Then** the choice is recorded with the rule that produced the suggestion, and the control shows the chosen state.

#### AC2: No dataset content is stored
**Given** a rating is recorded,
**When** the record is inspected,
**Then** it contains the rule id and rating only. No raw data, column names, numbers, or question text derived from user data.

#### AC3: Rating never blocks
**Given** the recording call fails,
**When** the PM rates,
**Then** the UI still shows the chosen state and no error interrupts them (fails soft, as `client-storage.ts` does).

### Edge Cases
- Changing a rating → Expected: last choice wins.
- Rating without clicking the suggestion → Expected: allowed.

### Technical Notes
- Storage is undecided: a small DB table, or logging only. Decide in Architect, keeping PLAN.md's privacy posture (no raw source data persisted).
- Rule id must be a stable string so results aggregate across sessions.

### Out of Scope
- Free-text feedback; analytics dashboards.

---

## Story 4: Look up a metric definition

**As a** PM unsure what a metric like "retention" means,
**I want to** open a plain-language definition,
**So that** I understand the term before trying to use it.

### INVEST Checklist
- [x] **Independent**: static content plus a reveal control.
- [x] **Negotiable**: drawer vs. inline section vs. route (PRD leans in-view drawer).
- [x] **Valuable**: removes a knowledge barrier.
- [x] **Estimable**: authored content plus one component.
- [x] **Small**: with a starter set of entries.
- [x] **Testable**: entries render; content is fixed.

### Acceptance Criteria

#### AC1: Open the glossary
**Given** the interpretation view,
**When** the PM activates "What does this mean?",
**Then** a list of metrics appears (starter set: retention, cohort, churn, CAC, LTV), each with a plain-language definition.

#### AC2: Definition is static and consistent
**Given** any glossary entry,
**When** it renders,
**Then** its text is the same authored content every time and involves no LLM call.

#### AC3: Generic example is labeled
**Given** an entry showing an example with numbers,
**When** it renders and no dataset match exists,
**Then** the example is visibly labeled "Example (not your data)".

#### AC4: Accessible
**Given** the glossary control and entries,
**When** used by keyboard or screen reader,
**Then** it opens/closes with the keyboard, returns focus to the trigger on close, and entries have proper headings.

### Edge Cases
- Glossary opened before any dataset exists → Expected: works, generic examples only.
- Motion: no required animation; respects reduced-motion.

### Technical Notes
- Content lives in a typed data file, not in components, so it can be reviewed as text.

### Out of Scope
- Search, bookmarking, LLM-generated definitions.

---

## Story 5: See a definition worked on my own numbers (when it fits)

**As a** PM reading a definition,
**I want to** see it worked through with my own figures when my data genuinely fits,
**So that** I learn the concept applied, not as a textbook example.

### INVEST Checklist
- [x] **Independent**: builds on Stories 0 and 4 only.
- [x] **Negotiable**: which entries get own-data examples is open.
- [x] **Valuable**: the "applied, not abstract" bonus, when it applies.
- [x] **Estimable**: a matcher per entry, reusing `NumberCardData`.
- [x] **Small**: start with the entries the column types can support.
- [x] **Testable**: matcher output is checkable against the prototype fixtures.

### Acceptance Criteria

#### AC1: Own-data example only when name, type and shape all fit
**Given** a card whose column type fits the entry **and** whose name matches it (for example a percent column named "Churn rate"), **and** `periodsTrustworthy` is true,
**When** that entry is opened,
**Then** the example uses that column's precomputed values (`formattedFirst`, `formattedLast`, `delta`), is labeled as the PM's data, and names the column used.

#### AC2: Fallback is the normal case
**Given** no column fits, or `periodsTrustworthy` is false,
**When** the entry is opened,
**Then** the generic labeled example is shown ("Example (not your data)") and no dataset figure is presented as a match.

#### AC3: Never match on type alone
**Given** any column whose type fits an entry but whose name doesn't,
**When** the entry is opened,
**Then** it is not treated as a match. (On the prototype sample, type-only matching falsely matched 22 of 66 unsupported entries; name+type matched 0.)

#### AC4: A correct match on non-period rows is still not shown
**Given** a column that matches by name and type but whose rows are categories (for example a CAC column in a per-channel table),
**When** the entry is opened,
**Then** no first-to-last comparison is shown; the generic example is used.

#### AC5: No new arithmetic in the example
**Given** an own-data example,
**When** it renders,
**Then** every number shown is already present in `NumberCardData`, or comes from a unit-tested `lib/compute` function. Nothing is computed by the LLM or ad hoc in the component.

#### AC6: Currency examples don't show the wrong symbol
**Given** an entry whose example is a currency column (CAC, LTV),
**When** it renders,
**Then** the symbol matches the input (£ shown as £). This depends on the `formatCurrency` prerequisite fix.

### Edge Cases
- Multiple columns match → use the first by column order and say which.
- New dataset submitted while the glossary is open → examples refresh.
- Expected hit rate is low (3 of 15 sample datasets); this must not be presented as a failure of the feature.

### Technical Notes
- The prototype's matcher (name regex + allowed types) is the starting point; retention did not match either the wide triangle (`M0`..`M4`) or the long format (count column), so expect to add name patterns only where they can be verified against real data.

### Out of Scope
- Using a previous dataset (no Flow E).
- Deriving new metrics (for example CAC from spend ÷ signups) inside the example.

---

## Story 6: Be told what my table has and lacks

**As a** PM curious about a metric my table can't compute,
**I want to** be told plainly what data I'd need and what my table does and doesn't contain,
**So that** I'm not shown a made-up figure and I know what to go and get.

### INVEST Checklist
- [x] **Independent**: builds on Stories 0 and 4.
- [x] **Negotiable**: wording and level of detail.
- [x] **Valuable**: covers the "what data should I collect" half of the problem, and is the glossary's always-available value.
- [x] **Estimable**: one authored field per entry plus a column-name check.
- [x] **Small**: yes.
- [x] **Testable**: every entry has the field; no fabricated figure appears.

### Acceptance Criteria

#### AC1: Every entry states its data needs
**Given** any glossary entry,
**When** it is opened,
**Then** it includes a "What data you'd need" line naming the columns or events required, in plain language.

#### AC2: Honest about the current table
**Given** the current table lacks what the entry needs,
**When** the entry is opened,
**Then** it says so plainly (for example "Your table has no per-cohort retention figures, so this can't be calculated from it") rather than showing a number.

#### AC3: Acknowledges what is present, using all columns
**Given** the table has a text column that matches an entry (for example a "Cohort" column),
**When** the entry is opened,
**Then** it says the column exists ("Your table has a 'Cohort' column") without computing anything from it.

#### AC4: No fabricated figures
**Given** an entry the dataset cannot support,
**When** it renders,
**Then** the only numbers shown are those in the labeled generic example.

### Edge Cases
- Table partially supports a metric (dates and counts but no cohort split) → state what is present and what is missing.
- Glossary opened before any dataset exists → data-needed line only, no "your table" statements.

### Technical Notes
- Authored content, reviewed once against a trusted source; no request-time generation.
- Uses the all-column metadata from Story 0; on the prototype sample, "cohort" was detectable this way in 2 of 2 supporting datasets.

### Out of Scope
- Guiding the PM through collecting the data; connecting a data source (Direction C).

---

## Related Context
- **Persona pain point:** PLAN.md: numeric misreads are professionally risky for this audience; the tool must never present an invented number.
- **Roadmap item:** PLAN.md Phase 3, "ask the right questions" data-literacy coaching.
- **Deferred:** Metrics Coach (Direction B) and connecting real data (Direction C), recorded as non-goals in the PRD.
