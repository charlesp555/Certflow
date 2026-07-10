-- ═══════════════════════════════════════════════════════════════════════════
-- 007_vendors_rls.sql
--
-- RLS Phase 3 — VENDORS TABLE ONLY.
--
-- Turns on Row Level Security for `vendors` and adds four owner-scoped
-- policies (select / insert / update / delete). After this runs, the browser
-- (anon key + Clerk token) can only touch rows whose `clerk_user_id` equals
-- the `sub` claim of the Clerk token it sent. Every other table is still
-- wide open — this is a deliberate one-table rollout; submissions,
-- user_company, user_requirements and users come in later migrations, one at
-- a time, after this one is confirmed in production.
--
-- PRECONDITIONS (all verified before writing this):
--   • Every client page sends the Clerk token via the accessToken() callback
--     (createClerkSupabaseClient) — RLS Phase 2, already shipped.
--   • The Clerk token carries `sub` (= clerk_user_id) and `role: authenticated`,
--     and both Clerk issuers are registered + enabled as Supabase third-party
--     auth — verified in Phase 2 (Check A: claims present; Check B: 200).
--
-- WHY THE SERVICE-ROLE API ROUTES KEEP WORKING:
--   The policies below are granted `TO authenticated`. RLS is NOT forced
--   (no FORCE ROW LEVEL SECURITY), so the `service_role` key used by the
--   server API routes (app/api/**, via supabaseAdmin) bypasses RLS entirely,
--   exactly as before. Only the anon/authenticated browser client is gated.
--
-- WHY THE ANON HOLE CLOSES:
--   A request with the anon key but NO Clerk token runs as the `anon`
--   Postgres role. These policies exist only for `authenticated`, so `anon`
--   matches no policy and sees zero rows (SELECT returns [], writes are
--   rejected). No policy = default deny once RLS is on.
--
-- PERFORMANCE:
--   `auth.jwt()` is wrapped in `(select …)` so Postgres evaluates it once per
--   statement (initplan) instead of once per row — the pattern Supabase
--   recommends for auth-function predicates.
--
-- IDEMPOTENT / RE-RUNNABLE:
--   ENABLE ROW LEVEL SECURITY is a no-op if already on. Each policy is dropped
--   with IF EXISTS before being recreated, so re-running this file is safe.
--
-- ROLLBACK (if a test fails and you need the table open again fast) — run
-- these four+one statements manually; they are intentionally NOT executed here:
--   drop policy if exists "vendors_select_own" on vendors;
--   drop policy if exists "vendors_insert_own" on vendors;
--   drop policy if exists "vendors_update_own" on vendors;
--   drop policy if exists "vendors_delete_own" on vendors;
--   alter table vendors disable row level security;
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

-- Turn RLS on. With RLS on and no matching policy, access defaults to DENY.
alter table vendors enable row level security;

-- ─── SELECT: read only your own vendors ────────────────────────────────────
drop policy if exists "vendors_select_own" on vendors;
create policy "vendors_select_own" on vendors
  for select
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── INSERT: you may only create rows owned by you ─────────────────────────
-- WITH CHECK runs against the NEW row, so a client cannot insert a vendor
-- stamped with someone else's clerk_user_id.
drop policy if exists "vendors_insert_own" on vendors;
create policy "vendors_insert_own" on vendors
  for insert
  to authenticated
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── UPDATE: you may only change your own rows, and only into rows still ────
-- owned by you. USING gates which rows are visible/updatable; WITH CHECK gates
-- what they can become — together they block both editing another user's row
-- and re-assigning your row's clerk_user_id to another user.
drop policy if exists "vendors_update_own" on vendors;
create policy "vendors_update_own" on vendors
  for update
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') )
  with check ( clerk_user_id = (select auth.jwt() ->> 'sub') );

-- ─── DELETE: you may only delete your own rows ─────────────────────────────
drop policy if exists "vendors_delete_own" on vendors;
create policy "vendors_delete_own" on vendors
  for delete
  to authenticated
  using ( clerk_user_id = (select auth.jwt() ->> 'sub') );
