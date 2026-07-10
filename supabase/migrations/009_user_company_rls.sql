-- ═══════════════════════════════════════════════════════════════════════════
-- 009_user_company_rls.sql
--
-- RLS Phase 3 (cont.) — USER_COMPANY TABLE.
--
-- Same proven pattern as 007 (vendors) / 008 (submissions), applied to
-- `user_company` — the single-row-per-user company profile shown on the
-- settings page. After this runs, the browser (anon key + Clerk token) can
-- only read/write the row whose `clerk_user_id` equals the `sub` claim of the
-- Clerk token it sent.
--
-- SCHEMA NOTE (differs from what 003 declared): the LIVE table has no `id` or
-- `created_at` column — its columns are clerk_user_id, name, industry, size,
-- website, address, updated_at (003's CREATE TABLE IF NOT EXISTS was a no-op
-- because the table already existed with this shape). RLS doesn't need a
-- primary key; every policy below filters on `clerk_user_id`, which exists
-- and carries a UNIQUE index (user_company_clerk_user_id_key from 003).
--
-- WHY THE SERVICE-ROLE api/company ROUTE KEEPS WORKING:
--   app/api/company/route.ts reads and upserts user_company server-side using
--   the service_role key (supabaseAdmin), with onConflict: 'clerk_user_id'.
--   Policies below are `TO authenticated` and RLS is NOT forced, so
--   service_role bypasses RLS entirely — the upsert path is unaffected. The
--   settings page's SAVE button goes through this route, so saving keeps
--   working regardless of the client-side policies.
--
-- WHAT THE CLIENT-SIDE POLICY GATES:
--   app/settings/page.tsx (CompanyTab) READS user_company directly through the
--   token-bearing client to pre-fill the form. The select policy lets the
--   logged-in user read their own row via clerk_user_id = sub, so the form
--   still populates. (The client does not write here — writes go via the API
--   route above — but insert/update/delete policies are included for
--   completeness and symmetry with 007/008.)
--
-- WHY THE ANON HOLE CLOSES:
--   anon-key/no-token requests run as the `anon` role, which matches none of
--   these `authenticated`-only policies → zero rows. Baseline before this
--   migration: anon saw 2 rows across 2 owners; after, it sees 0.
--
-- PERFORMANCE: auth.jwt() wrapped in (select …) for per-statement eval.
-- IDEMPOTENT: ENABLE is a no-op if already on; policies dropped IF EXISTS.
--
-- ROLLBACK (manual, not executed here):
--   drop policy if exists "user_company_select_own" on user_company;
--   drop policy if exists "user_company_insert_own" on user_company;
--   drop policy if exists "user_company_update_own" on user_company;
--   drop policy if exists "user_company_delete_own" on user_company;
--   alter table user_company disable row level security;
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table user_company enable row level security;

-- ─── SELECT: read only your own company row (settings page pre-fill) ───────
drop policy if exists "user_company_select_own" on user_company;
create policy "user_company_select_own" on user_company
  for select
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── INSERT: you may only create a row owned by you ────────────────────────
drop policy if exists "user_company_insert_own" on user_company;
create policy "user_company_insert_own" on user_company
  for insert
  to authenticated
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── UPDATE: only your row, and it must stay owned by you ──────────────────
drop policy if exists "user_company_update_own" on user_company;
create policy "user_company_update_own" on user_company
  for update
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') )
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── DELETE: only your own row ─────────────────────────────────────────────
drop policy if exists "user_company_delete_own" on user_company;
create policy "user_company_delete_own" on user_company
  for delete
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );
