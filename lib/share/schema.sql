-- One-off DDL, hand-run once against the Neon database (no migration framework —
-- a single table doesn't warrant one; see specs/outputs/prd-share-2026-09-12.md).
create table if not exists share_links (
  token text primary key,
  manage_token text not null unique,
  interpretation jsonb not null,
  commentary text,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
