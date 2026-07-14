-- ═══════════════════════════════════════════════════════════════════════════
-- 004_verification_columns.sql
--
-- PURPOSE: Step 1 of making Verification a first-class object. Promotes
-- fields that already exist inside submissions.analysis_result (jsonb) into
-- real, queryable columns — no new analysis, no new engine output, just
-- surfacing what's already computed by app/api/extract-coi/route.ts.
--
-- Every statement uses ADD COLUMN IF NOT EXISTS. Running this against the
-- live database is purely additive: zero existing rows are touched, every
-- new column is NULL-able with no default, and `analysis_result` is left
-- completely intact as the permanent source-of-truth blob. Existing rows
-- will show NULL in these new columns until a separate, later backfill
-- migration populates them from their own analysis_result — that backfill
-- is deliberately NOT part of this file, so the "add empty columns" step and
-- the "touch every historical row" step can be reviewed independently.
--
-- Findings (requirements_check) and coverages are kept as jsonb arrays, not
-- normalized into a child table — a deliberate decision for this step, not
-- an oversight. A normalized findings table remains a clean, non-destructive
-- future upgrade sourced from this same jsonb column, if cross-portfolio
-- Finding queries ever become a real need.
--
-- No `confidence` column: the engine does not produce that value today.
-- Adding it would require a prompt/engine change, which is out of scope
-- here and belongs in its own separate, reviewed decision.
--
-- This does NOT touch vendors.expiration_date (the latest-known value for a
-- vendor, updated on every save) — submissions.expiration_date below is a
-- per-verification historical snapshot instead: what the document said AT
-- THAT VERIFICATION. Same column name, different table, no conflict —
-- Postgres scopes column names per-table, and the two serve different
-- purposes (vendors = current state, submissions = history).
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table submissions
  -- Precise 4-value status: COMPLIANT / EXPIRING / EXPIRED / NON_COMPLIANT.
  -- coiData.overallStatus, post server-side expiration override
  -- (route.ts ~line 214-217). Distinct from the existing `status` column,
  -- which stays exactly as-is (2-value: 'Compliant' / 'Issues Found') so
  -- nothing currently reading `status` is affected.
  add column if not exists overall_status text,

  -- coiData.isExpired, post server-side expiration override (route.ts ~line 212)
  add column if not exists is_expired boolean,

  -- New — not directly in analysis_result, but trivially derived from
  -- coiData.requirementsCheck (count of entries where passed = true).
  -- Splits what saveToSupabase today only stores as a combined sum
  -- (issues_count = flags.length + failedReqs, route.ts line 267).
  add column if not exists passed_requirements_count integer,

  -- Same as above, count of entries where passed = false (this is the
  -- "failedReqs" value route.ts already computes at line 266, just not
  -- currently persisted on its own).
  add column if not exists failed_requirements_count integer,

  -- coiData.requirementsCheck — array of
  -- { coverage, required, minimum, actual, passed, reason }.
  -- Kept as jsonb per this step's explicit decision, not normalized.
  add column if not exists requirements_check jsonb,

  -- coiData.coverages — array of
  -- { type, eachOccurrence, aggregate, deductible }. Kept as jsonb.
  add column if not exists coverages jsonb,

  -- coiData.flags — array of compliance-failure strings not already
  -- captured in requirements_check. Kept as jsonb.
  add column if not exists flags jsonb,

  -- coiData.additionalInsured
  add column if not exists additional_insured boolean,

  -- coiData.waiverOfSubrogation
  add column if not exists waiver_of_subrogation boolean,

  -- coiData.effectiveDate (as parsed/left by the engine — currently a
  -- MM/DD/YYYY string in the prompt's convention; stored here as `date`,
  -- so the write path will need to parse it the same way the expiration
  -- override logic already does for expirationDate)
  add column if not exists effective_date date,

  -- coiData.expirationDate, post server-side override. Per-verification
  -- historical snapshot — see header note on vendors.expiration_date above.
  add column if not exists expiration_date date,

  -- coiData.daysUntilExpiration, post server-side override (route.ts ~line
  -- 211). Snapshot at verification time, not a live value — anything built
  -- on top of this (timeline/history UI) should recompute freshness from
  -- expiration_date at query time rather than trusting this integer as
  -- "current."
  add column if not exists days_until_expiration integer,

  -- coiData.producer — the insurance agency. Lets a future comparison view
  -- detect "this vendor switched insurance producers between verifications."
  add column if not exists producer text,

  -- coiData.certificateHolder
  add column if not exists certificate_holder text,

  -- coiData.insuredName — what the document itself says, which may differ
  -- slightly from vendors.name (e.g. "Acme Plumbing LLC" vs "Acme Plumbing").
  add column if not exists insured_name text;
