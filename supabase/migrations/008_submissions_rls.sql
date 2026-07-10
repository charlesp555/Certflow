-- ═══════════════════════════════════════════════════════════════════════════
-- 008_submissions_rls.sql
--
-- RLS Phase 3 (cont.) — SUBMISSIONS TABLE.
--
-- Same proven pattern as 007_vendors_rls.sql, applied to `submissions`. After
-- this runs, the browser (anon key + Clerk token) can only touch submission
-- rows whose `clerk_user_id` equals the `sub` claim of the Clerk token it
-- sent. Rollout stays one-table-at-a-time — user_company, user_requirements,
-- and users still follow after this is confirmed.
--
-- PRECONDITIONS (unchanged from 007, all already verified):
--   • Every client page reads submissions through the token-bearing client
--     (createClerkSupabaseClient) — dashboard, submissions, documents,
--     reports, report/[id], vendors/[id]. RLS Phase 2, shipped.
--   • Token carries `sub` (= clerk_user_id) and `role: authenticated`; both
--     Clerk issuers registered as Supabase third-party auth.
--
-- WHY THE SERVICE-ROLE extract-coi ROUTE KEEPS WORKING:
--   app/api/extract-coi/route.ts inserts submissions server-side using the
--   service_role key (supabaseAdmin). Policies below are `TO authenticated`
--   and RLS is NOT forced (no FORCE ROW LEVEL SECURITY), so service_role
--   bypasses RLS entirely — the extract/insert pipeline is unaffected. Only
--   the anon/authenticated browser client is gated.
--
-- WHY THE ANON HOLE CLOSES:
--   A request with the anon key but no Clerk token runs as the `anon` role,
--   which matches none of these `authenticated`-only policies → zero rows /
--   rejected writes. Baseline before this migration: anon saw 26 rows across
--   8 owners; after, it sees 0.
--
-- PERFORMANCE: `auth.jwt()` wrapped in `(select …)` for per-statement eval.
--
-- IDEMPOTENT: ENABLE is a no-op if already on; each policy is dropped IF
-- EXISTS before recreation, so re-running is safe.
--
-- ROLLBACK (manual, not executed here):
--   drop policy if exists "submissions_select_own" on submissions;
--   drop policy if exists "submissions_insert_own" on submissions;
--   drop policy if exists "submissions_update_own" on submissions;
--   drop policy if exists "submissions_delete_own" on submissions;
--   alter table submissions disable row level security;
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table submissions enable row level security;

-- ─── SELECT: read only your own submissions ────────────────────────────────
drop policy if exists "submissions_select_own" on submissions;
create policy "submissions_select_own" on submissions
  for select
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── INSERT: you may only create rows owned by you ─────────────────────────
-- (Browser inserts only; the extract-coi API route inserts via service_role
-- and bypasses this.)
drop policy if exists "submissions_insert_own" on submissions;
create policy "submissions_insert_own" on submissions
  for insert
  to authenticated
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── UPDATE: only your rows, and they must stay owned by you ───────────────
drop policy if exists "submissions_update_own" on submissions;
create policy "submissions_update_own" on submissions
  for update
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') )
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── DELETE: only your own rows ────────────────────────────────────────────
-- (The app deletes submissions when a vendor is deleted — vendors/page.tsx
-- handleDelete removes submissions first, scoped by clerk_user_id, then the
-- vendor. That path runs as the authenticated user and this policy covers it.)
drop policy if exists "submissions_delete_own" on submissions;
create policy "submissions_delete_own" on submissions
  for delete
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );
