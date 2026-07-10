-- ═══════════════════════════════════════════════════════════════════════════
-- 010_user_requirements_rls.sql
--
-- RLS Phase 3 (cont.) — USER_REQUIREMENTS TABLE.
--
-- Same proven pattern as 007 (vendors) / 008 (submissions) / 009 (user_company),
-- applied to `user_requirements` — one row per user holding their whole
-- requirement set as a jsonb blob (`requirements`), keyed by clerk_user_id
-- (from 002_user_requirements.sql). Columns: id, clerk_user_id, requirements,
-- updated_at.
--
-- IMPORTANT — ACCESS IS 100% SERVER-SIDE (service_role) TODAY:
--   Unlike vendors/submissions/user_company, NO client page queries this table
--   through the token-bearing supabase client. Every reference is a
--   service_role API route:
--     • app/api/requirements/route.ts — GET (select) + POST (upsert,
--       onConflict: 'clerk_user_id')
--     • app/api/extract-coi/route.ts  — reads the user's requirements to run
--       the compliance check
--   The client requirements page (app/requirements/page.tsx) reads and writes
--   ONLY via fetch('/api/requirements'), never via supabase-js directly.
--
--   Consequence: because policies below are `TO authenticated` and RLS is NOT
--   forced, service_role bypasses RLS and ALL current app functionality is
--   untouched — the requirements page keeps loading and saving exactly as
--   before. Enabling RLS here is a pure defense-in-depth step: it closes the
--   anon-key direct-read hole (baseline: anon saw 2 rows across 2 owners →
--   0 after this) and pre-authorizes correct behavior if a future client ever
--   reads this table directly with the Clerk token.
--
-- PERFORMANCE: auth.jwt() wrapped in (select …) for per-statement eval.
-- IDEMPOTENT: ENABLE is a no-op if already on; policies dropped IF EXISTS.
--
-- ROLLBACK (manual, not executed here):
--   drop policy if exists "user_requirements_select_own" on user_requirements;
--   drop policy if exists "user_requirements_insert_own" on user_requirements;
--   drop policy if exists "user_requirements_update_own" on user_requirements;
--   drop policy if exists "user_requirements_delete_own" on user_requirements;
--   alter table user_requirements disable row level security;
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table user_requirements enable row level security;

-- ─── SELECT: read only your own requirement set ────────────────────────────
drop policy if exists "user_requirements_select_own" on user_requirements;
create policy "user_requirements_select_own" on user_requirements
  for select
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── INSERT: you may only create a row owned by you ────────────────────────
drop policy if exists "user_requirements_insert_own" on user_requirements;
create policy "user_requirements_insert_own" on user_requirements
  for insert
  to authenticated
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── UPDATE: only your row, and it must stay owned by you ──────────────────
drop policy if exists "user_requirements_update_own" on user_requirements;
create policy "user_requirements_update_own" on user_requirements
  for update
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') )
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── DELETE: only your own row ─────────────────────────────────────────────
drop policy if exists "user_requirements_delete_own" on user_requirements;
create policy "user_requirements_delete_own" on user_requirements
  for delete
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );
