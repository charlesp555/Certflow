-- ═══════════════════════════════════════════════════════════════════════════
-- 005_backfill_verification_columns.sql
--
-- PURPOSE: Step 2 of making Verification a first-class object (follows
-- 004_verification_columns.sql, which only added the empty, NULL-able
-- columns). This migration populates those 15 columns on historical
-- submissions rows, sourced entirely from that same row's own
-- `analysis_result` jsonb blob — no new analysis, no cross-row inference.
--
-- SCOPE / IDEMPOTENCY: every UPDATE below is guarded by
-- `WHERE overall_status IS NULL`. Rows already populated by the new
-- app/api/extract-coi/route.ts write path (post-004) already have
-- overall_status set and are skipped entirely — this migration only ever
-- touches genuinely old, never-backfilled rows. Because the guard is
-- evaluated fresh each run, running this file a second (or Nth) time is a
-- no-op: any row the first run already filled no longer matches
-- `overall_status IS NULL` (except the rare row whose analysis_result never
-- had an overallStatus to begin with — see NOTE below — which is harmless
-- to re-touch since it just writes the same NULLs again).
--
-- NOTE on rows with no overallStatus at all: some very old rows predate the
-- overallStatus concept in the extraction prompt entirely. For those,
-- analysis_result->>'overallStatus' is NULL, so overall_status stays NULL
-- after this migration too, and the row remains eligible for (harmless)
-- re-processing on future runs. This is expected and fine.
--
-- Two scratch helper functions are created below to make individual-field
-- parsing failure-proof (a single malformed date or number in one row must
-- never abort the whole UPDATE for every other row). Both are dropped again
-- at the end of this file — they are not part of the permanent schema.
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Scratch helper: parse a stored date string into a real date ────────────
-- Historical analysis_result blobs store effectiveDate/expirationDate as
-- 'MM/DD/YYYY' strings — except at least one known old row that used
-- 'MM-DD-YYYY' with dashes instead of slashes. Normalizes both by replacing
-- '-' with '/' before splitting, then builds the date with make_date.
-- Wrapped in EXCEPTION WHEN OTHERS so a bad cast (e.g. non-numeric part) or
-- an impossible calendar date (e.g. day 31 in April, Feb 30) returns NULL
-- instead of aborting the UPDATE that called it.
create or replace function public._backfill_005_parse_date(raw text)
returns date
language plpgsql
immutable
as $$
declare
  normalized text;
  parts text[];
  mm int;
  dd int;
  yyyy int;
begin
  if raw is null or btrim(raw) = '' then
    return null;
  end if;

  normalized := replace(raw, '-', '/');
  parts := string_to_array(normalized, '/');

  if array_length(parts, 1) is distinct from 3 then
    return null;
  end if;

  mm   := parts[1]::int;
  dd   := parts[2]::int;
  yyyy := parts[3]::int;

  return make_date(yyyy, mm, dd);
exception when others then
  return null;
end;
$$;

-- ── Scratch helper: safe integer cast ───────────────────────────────────────
-- Used for daysUntilExpiration. Returns NULL instead of erroring on a
-- missing/non-numeric value.
create or replace function public._backfill_005_safe_int(raw text)
returns integer
language plpgsql
immutable
as $$
begin
  if raw is null or btrim(raw) = '' then
    return null;
  end if;
  return raw::int;
exception when others then
  return null;
end;
$$;

-- ── Main backfill ────────────────────────────────────────────────────────────
update submissions
set
  -- Normalize 'NON-COMPLIANT' (hyphen, seen on some old rows) to
  -- 'NON_COMPLIANT' (underscore, the form every other value and the current
  -- write path already use) so the column is consistent regardless of which
  -- form the source blob happened to use.
  overall_status = nullif(
    upper(replace(analysis_result->>'overallStatus', '-', '_')),
    ''
  ),

  is_expired = case analysis_result->>'isExpired'
    when 'true'  then true
    when 'false' then false
    else null
  end,

  -- Counted directly from requirementsCheck rather than trusted from any
  -- other field. If requirementsCheck is missing entirely (some very old
  -- rows don't have it) or isn't a jsonb array, both counts are left NULL
  -- rather than defaulting to 0 — 0 would falsely claim "we checked, and
  -- zero passed/failed," which is not true for rows that were never
  -- evaluated against requirements at all.
  passed_requirements_count = case
    when jsonb_typeof(analysis_result->'requirementsCheck') = 'array' then (
      select count(*)
      from jsonb_array_elements(analysis_result->'requirementsCheck') elem
      where elem->>'passed' = 'true'
    )
    else null
  end,

  failed_requirements_count = case
    when jsonb_typeof(analysis_result->'requirementsCheck') = 'array' then (
      select count(*)
      from jsonb_array_elements(analysis_result->'requirementsCheck') elem
      where elem->>'passed' = 'false'
    )
    else null
  end,

  requirements_check = analysis_result->'requirementsCheck',
  coverages           = analysis_result->'coverages',
  flags               = analysis_result->'flags',

  additional_insured = case analysis_result->>'additionalInsured'
    when 'true'  then true
    when 'false' then false
    else null
  end,

  waiver_of_subrogation = case analysis_result->>'waiverOfSubrogation'
    when 'true'  then true
    when 'false' then false
    else null
  end,

  effective_date  = public._backfill_005_parse_date(analysis_result->>'effectiveDate'),
  expiration_date = public._backfill_005_parse_date(analysis_result->>'expirationDate'),

  days_until_expiration = public._backfill_005_safe_int(analysis_result->>'daysUntilExpiration'),

  producer            = analysis_result->>'producer',
  certificate_holder   = analysis_result->>'certificateHolder',
  insured_name         = analysis_result->>'insuredName'

where overall_status is null;

-- ── Cleanup: drop the scratch helpers, they're not part of the schema ──────
drop function if exists public._backfill_005_parse_date(text);
drop function if exists public._backfill_005_safe_int(text);

commit;
