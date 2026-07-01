-- ═══════════════════════════════════════════════════════════════════════════
-- 003_capture_live_schema.sql
--
-- PURPOSE: this migration does NOT change behavior. It documents the schema
-- that already exists on the live database but was never captured in a
-- migration file (001/002 describe an earlier design — UUID `users.id`
-- foreign keys — that was abandoned in favor of Clerk-ID text columns
-- sometime after those migrations were written, and that pivot was never
-- recorded here).
--
-- Every statement below uses IF NOT EXISTS, so running this against the live
-- database should be a no-op: the columns/tables it declares already exist
-- there. Nothing is dropped, altered destructively, or renamed. This is
-- written to make the migration history match reality, not to change it.
--
-- CONFIDENCE NOTE: this was written from static code analysis (grepping every
-- `.from()` / `.select()` / `.insert()` / `.upsert()` / `.eq()` call across
-- the app), not from a live database introspection query — nothing was run
-- against Supabase to produce this file, per instructions. Column types are
-- inferred from usage and matched to the conventions already used in
-- 001/002 (e.g. `text` for Clerk IDs, `timestamp default now()` for
-- audit columns). Two specific claims below are inference, not certainty,
-- and are flagged individually where they appear:
--   1. The exact type/nullability of each added column.
--   2. That `users.clerk_user_id` and `user_company.clerk_user_id` carry a
--      UNIQUE constraint — inferred because app/api/stripe/webhook/route.ts
--      and app/api/company/route.ts both call `.upsert(..., { onConflict:
--      'clerk_user_id' })` on these tables, which Postgres requires a unique
--      constraint or unique index to satisfy. If that inference is wrong,
--      the `CREATE UNIQUE INDEX IF NOT EXISTS` statements below will fail
--      loudly (duplicate values) rather than silently corrupting anything —
--      review the error before deciding how to proceed if that happens.
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── vendors ──────────────────────────────────────────────────────────────
-- Real ownership column. Used in every vendor query in the app, e.g.:
--   app/vendors/page.tsx:515        .eq('clerk_user_id', user.id)
--   app/api/extract-coi/route.ts:297/304/317  (insert + lookup + update)
--   app/dashboard/page.tsx:257
-- The `user_id uuid` column from 001_initial.sql is never referenced by
-- clerk_user_id-based queries anywhere in the app — see the "dead remnants"
-- section at the bottom of this file.
alter table vendors
  add column if not exists clerk_user_id text;


-- ─── submissions ──────────────────────────────────────────────────────────
-- Same pattern as vendors. Confirmed used in:
--   app/api/extract-coi/route.ts:329
--   app/vendors/[id]/page.tsx:556, app/vendors/page.tsx:565
--   app/dashboard/page.tsx:262, app/documents/page.tsx:214
--   app/reports/page.tsx:346, app/submissions/page.tsx:190
--   app/report/[id]/page.tsx:157
alter table submissions
  add column if not exists clerk_user_id text;


-- ─── users ──────────────────────────────────────────────────────────────
-- Confirmed used in:
--   app/vendors/page.tsx:518-520     .from('users').select('plan').eq('clerk_user_id', ...)
--   app/api/stripe/webhook/route.ts:35-36
--     .from('users').upsert({ clerk_user_id: userId, plan: planName }, { onConflict: 'clerk_user_id' })
alter table users
  add column if not exists clerk_user_id text;

-- Inferred, not confirmed by introspection (see CONFIDENCE NOTE above) — the
-- onConflict: 'clerk_user_id' upsert in the stripe webhook cannot succeed
-- without a unique constraint/index on this column. A unique index satisfies
-- Postgres's ON CONFLICT requirement identically to a named UNIQUE
-- constraint, and unlike ADD CONSTRAINT, IF NOT EXISTS is well-supported here.
create unique index if not exists users_clerk_user_id_key
  on users (clerk_user_id);


-- ─── user_company (entire table — no prior migration exists for this one) ──
-- Confirmed used in:
--   app/api/company/route.ts:10-13   (select name, industry, size, website, address)
--   app/api/company/route.ts:26-38   (upsert, onConflict: 'clerk_user_id', sets updated_at)
--   app/settings/page.tsx:115-118
-- `id`/`created_at` are not directly referenced by any query, but are added
-- here to match the shape of every other table in this schema (001/002) —
-- this part is convention, not confirmed usage, unlike the other columns.
create table if not exists user_company (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name          text,
  industry      text,
  size          text,
  website       text,
  address       text,
  created_at    timestamp default now(),
  updated_at    timestamp default now()
);

-- Same inference/caveat as users_clerk_user_id_key above — required for the
-- onConflict: 'clerk_user_id' upsert in app/api/company/route.ts to work.
create unique index if not exists user_company_clerk_user_id_key
  on user_company (clerk_user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- DEAD REMNANTS — NOT DROPPED. Documented here as candidates for removal in
-- a future, separate migration, after you've explicitly confirmed each one
-- against the live database yourself. Nothing below this line executes.
--
--   • vendors.user_id (uuid, from 001_initial.sql)
--       References users(id), the abandoned UUID-PK design. Zero references
--       in app code — every vendor query uses clerk_user_id instead (see
--       above). Almost certainly NULL on every row.
--
--   • submissions.user_id (uuid, from 001_initial.sql)
--       Same story as vendors.user_id — superseded by clerk_user_id, zero
--       code references.
--
--   • requirements table (from 001_initial.sql: id, user_id, coverage_type,
--     minimum_amount, required, created_at)
--       Zero references anywhere in the app. Fully superseded by
--       user_requirements (002_user_requirements.sql), which stores a
--       user's whole requirement set as one jsonb blob keyed by
--       clerk_user_id instead of one row per requirement. This looks like
--       a full table that can eventually be dropped, not just a column.
--
--   • users.email (from 001_initial.sql)
--       Zero references in app code. Clerk owns the canonical email now
--       (via its own user profile) — this column looks like a leftover
--       from before Clerk was the auth source of truth.
--
--   • users.company_name (from 001_initial.sql)
--       Zero references in app code. Superseded by the `user_company` table
--       (name/industry/size/website/address), which is more detailed and is
--       what app/settings/page.tsx and app/api/company/route.ts actually
--       read/write.
--
-- Before ever dropping any of these: confirm row counts / non-null counts
-- live (e.g. `select count(*) filter (where user_id is not null) from
-- vendors;`) rather than trusting code analysis alone — a rarely-hit
-- reporting script or an external integration could still reference a
-- "dead" column that grep can't see.
-- ═══════════════════════════════════════════════════════════════════════════
