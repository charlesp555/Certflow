-- ═══════════════════════════════════════════════════════════════════════════
-- 011_users_rls.sql
--
-- RLS Phase 3 (FINAL) — USERS TABLE.
--
-- Same proven pattern as 007–010, applied to the last table, `users`. One row
-- per user, keyed by clerk_user_id (unique index users_clerk_user_id_key from
-- 003). Columns: id, email, company_name, plan, created_at, clerk_user_id.
--
-- ⚠️ CRITICAL — THE PLAN-GATE DEPENDENCY:
--   app/vendors/page.tsx runs a CLIENT-SIDE read through the token-bearing
--   supabase client:
--       supabase.from('users').select('plan').eq('clerk_user_id', user.id).maybeSingle()
--   It uses the result to decide the free-vs-pro vendor limit (the "+ Add
--   Vendor" paywall). The SELECT policy below (clerk_user_id = sub) is exactly
--   what keeps this working: the logged-in user can read THEIR OWN users row,
--   so `plan` still resolves. If this policy were missing/wrong, the query
--   would return no row and the page would silently fall back to the FREE
--   limit — so this table's SELECT policy is load-bearing, not just defensive.
--   >>> After applying, specifically re-test the VENDORS page. <<<
--
-- WHY THE SERVICE-ROLE STRIPE WEBHOOK KEEPS WORKING:
--   app/api/stripe/webhook/route.ts upserts users via the service_role key
--   (onConflict: 'clerk_user_id') to set `plan` after checkout. Policies below
--   are `TO authenticated` and RLS is NOT forced, so service_role bypasses RLS
--   — the webhook still writes plan changes normally.
--
-- WHY THE ANON HOLE CLOSES:
--   anon-key/no-token requests run as `anon`, which matches none of these
--   `authenticated`-only policies → zero rows. This matters most here: the
--   users table holds email + plan, so before this migration an anon caller
--   could read every user's email. Baseline: anon saw 2 rows across 2 owners
--   → 0 after this.
--
-- INSERT/UPDATE/DELETE policies are included for symmetry with 007–010. In
-- practice the app never writes users from the client (only the service-role
-- webhook does), but the WITH CHECK guards keep any future client write
-- correctly owner-scoped.
--
-- PERFORMANCE: auth.jwt() wrapped in (select …) for per-statement eval.
-- IDEMPOTENT: ENABLE is a no-op if already on; policies dropped IF EXISTS.
--
-- ROLLBACK (manual, not executed here):
--   drop policy if exists "users_select_own" on users;
--   drop policy if exists "users_insert_own" on users;
--   drop policy if exists "users_update_own" on users;
--   drop policy if exists "users_delete_own" on users;
--   alter table users disable row level security;
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table users enable row level security;

-- ─── SELECT: read only your own users row (LOAD-BEARING: vendors page plan) ─
drop policy if exists "users_select_own" on users;
create policy "users_select_own" on users
  for select
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── INSERT: you may only create a row owned by you ────────────────────────
drop policy if exists "users_insert_own" on users;
create policy "users_insert_own" on users
  for insert
  to authenticated
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── UPDATE: only your row, and it must stay owned by you ──────────────────
drop policy if exists "users_update_own" on users;
create policy "users_update_own" on users
  for update
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') )
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── DELETE: only your own row ─────────────────────────────────────────────
drop policy if exists "users_delete_own" on users;
create policy "users_delete_own" on users
  for delete
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );
