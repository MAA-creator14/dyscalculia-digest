-- One-off DDL, hand-run once against the Neon database (same approach as lib/share/schema.sql —
-- no migration framework for a single small table). Holds only an anonymous per-suggestion id,
-- the rule that produced the suggestion, and the rating: never dataset content, never question text.
create table if not exists suggestion_feedback (
  event_id uuid primary key,
  rule_id text not null,
  rating text not null check (rating in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
