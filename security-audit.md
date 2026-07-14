# Covira — Data-Access / RLS Security Audit

**Scope:** Report only. Audits the current data-access architecture ahead of closing the data-isolation hole (no RLS; anon Supabase key exposed in the browser). Nothing was changed.

---

## 1. How the app talks to Supabase

Everything is defined in `lib/supabase.ts`, which exports **two** clients:

- **`supabase`** — created with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The `NEXT_PUBLIC_` prefix means the anon key is **inlined into the browser bundle**. This client is imported directly into 8 `'use client'` pages and runs **in the browser**.
- **`supabaseAdmin`** — created with `SUPABASE_SERVICE_ROLE_KEY` (falls back to the anon key if unset). Used **server-side only**, in 4 API routes. The comment says outright: *"uses service role key to bypass RLS."*

So the answer is **both** — but the sensitive read/write surface is overwhelmingly **client-side with the anon key**.

There's also a third export, `createClerkSupabaseClient(getToken)`, that forwards a Clerk token via Supabase's `accessToken()` callback — but it exists **only in the uncommitted working tree** (the parked RLS work), is **not imported anywhere**, and is **not deployed**. It has zero effect today.

---

## 2. Every read/write, by call site

| Location | Table(s) | Op | Where it runs | Scoping |
|---|---|---|---|---|
| `dashboard/page.tsx` | vendors, submissions | read | **browser (anon)** | `.eq('clerk_user_id', user.id)` |
| `vendors/page.tsx` | vendors (+nested submissions), users | read | **browser (anon)** | `.eq('clerk_user_id', user.id)` |
| `vendors/page.tsx` (AddVendorModal) | vendors | **insert** | **browser (anon)** | sets `clerk_user_id` in payload |
| `vendors/page.tsx` (handleDelete) | submissions, vendors | **delete** | **browser (anon)** | `.eq('vendor_id',…).eq('clerk_user_id',…)` |
| `vendors/[id]/page.tsx` | vendors, submissions | read | **browser (anon)** | `.eq('id',…).eq('clerk_user_id',…)` |
| `vendors/[id]/page.tsx` | vendors | **update** (type, contact/email) | **browser (anon)** | `.eq('id',…).eq('clerk_user_id',…)` |
| `submissions/page.tsx` | submissions | read | **browser (anon)** | `.eq('clerk_user_id', user.id)` |
| `documents/page.tsx` | submissions | read | **browser (anon)** | `.eq('clerk_user_id', user.id)` |
| `reports/page.tsx` | submissions | read | **browser (anon)** | `.eq('clerk_user_id', user.id)` |
| `report/[id]/page.tsx` | submissions | read | **browser (anon)** | `.eq('id',…).eq('clerk_user_id',…)` |
| `settings/page.tsx` (CompanyTab read) | user_company | read | **browser (anon)** | `.eq('clerk_user_id', userId)` |
| `api/company/route.ts` | user_company | read + upsert | server (service) | `auth()` gate, then `.eq/onConflict clerk_user_id` |
| `api/requirements/route.ts` | user_requirements | read + upsert | server (service) | `auth()` gate, then `clerk_user_id` |
| `api/extract-coi/route.ts` | user_requirements, vendors, submissions | read + insert/update | server (service) | `auth()`; scopes by `userId` (but allows signed-out → writes `clerk_user_id = null`) |
| `api/stripe/webhook/route.ts` | users | upsert (plan) | server (service) | Stripe signature; `userId` from session metadata (no `auth()`) |

The critical point: for every browser row above, **the `.eq('clerk_user_id', …)` filter is the *only* thing isolating tenants, and it's applied client-side by code holding the public anon key.** Anyone can open the bundle, grab the anon key, and query/insert/delete any row in these tables directly — the filter is trivially removed. Writes (insert vendors, delete vendors/submissions, update vendor contact info) are exposed the same way as reads.

---

## 3. Is RLS enabled?

**No — on any table.** All six migrations (`001`–`006`) were grepped for `row level security`, `enable`, `policy` — there are **zero** RLS statements and **zero** policies anywhere. Tables are created plain. With RLS off, the anon key has full `select/insert/update/delete` on every table. This is the hole.

RLS state per table: **vendors, submissions, users, user_company, user_requirements, requirements → all RLS-disabled (default), all fully readable/writable by the anon key.**

---

## 4. How Clerk identity reaches Supabase / JWT integration

Identity reaches Supabase **only as a filter value**, never as a verified credential:

- **Browser:** `user.id` from Clerk's `useUser()` is passed as the string in `.eq('clerk_user_id', user.id)`.
- **Server routes:** `userId` from `auth()` (this one *is* verified server-side) used the same way.

There is **no active Supabase↔Clerk JWT integration**: no JWKS/third-party-auth config in the repo, no `supabase/config.toml`, and the deployed anon client is created with **no `accessToken`**. The only token-forwarding code (`createClerkSupabaseClient`) is the parked, uncommitted, unused function. Supabase's `auth.jwt()` would return nothing useful in a policy today because no verified Clerk token is being sent.

Middleware (`middleware.ts`) does gate app routes with `clerkMiddleware`/`auth.protect()`, so an unauthenticated user can't load the pages — but that does **not** protect Supabase itself. The anon key + Supabase REST endpoint are reachable directly, bypassing Next.js middleware entirely.

---

## 5. Tables that must be isolated, and their identifier column

All tenant data keys on **`clerk_user_id` (type `text`)**, added in migration `003`:

| Table | Identifier | Sensitive contents |
|---|---|---|
| **submissions** | `clerk_user_id` | `analysis_result` jsonb = full COI extraction: insured names, addresses, policy numbers, limits. Highest sensitivity. |
| **vendors** | `clerk_user_id` | vendor names, statuses, `vendor_email`, `vendor_contact_name` (PII, migration `006`) |
| **user_company** | `clerk_user_id` | company name, address, website, size |
| **user_requirements** | `clerk_user_id` | per-user requirement config |
| **users** | `clerk_user_id` | plan/billing tier |

Two **dead** identifier remnants documented in `003`: `vendors.user_id` and `submissions.user_id` (uuid, from the abandoned `001` design) and the unused `requirements` table — zero code references. Also relevant for RLS: `clerk_user_id` was added as **nullable**, and the signed-out `extract-coi` path can write `clerk_user_id = null` rows.

---

## 6. Path A (RLS + Clerk JWT) vs Path B (server-only API routes)

### Path A — enable RLS with Clerk third-party-auth policies

- **Work:** (1) register Clerk as a third-party auth provider in the Supabase dashboard (issuer/JWKS); (2) swap each browser `supabase` import for `createClerkSupabaseClient(getToken)` so requests carry the Clerk token — *the parked function is already step 2*; (3) write policies (`clerk_user_id = auth.jwt()->>'sub'`, plus `with check` for insert/update) on the five tables; (4) `enable row level security` on each; (5) regression-test every page.
- **Why it fits:** the browser-direct data layer **stays**, so page code barely changes — the ~10 client call sites keep their `.from()/.eq()` and just get a token-bearing client. It closes the hole **at the database**: once RLS is on, the public anon key returns nothing without a matching JWT.
- **Risks/gotchas:** `clerk_user_id` is `text` and must equal `auth.jwt()->>'sub'` exactly; nested `vendors(submissions)` selects need policies on **both** tables; enabling RLS is all-or-nothing per table (a missed policy = broken page or a silent hole); decide what happens to nullable/legacy `clerk_user_id = null` rows and to the signed-out `extract-coi` insert. Service-role routes keep bypassing RLS by design, so their manual scoping must stay.

### Path B — route all DB access through server API routes with the service key

- **Work:** build endpoints (or server actions) for **every** currently-client read/write — vendors list/insert/update/delete, submissions list, dashboard, reports, report detail, documents, settings-company read — each doing `auth()` then `supabaseAdmin` scoped by `userId`, and rewrite all ~10 client `supabase.from()` calls into `fetch()`s. The pattern already exists (`company`, `requirements` routes) and is proven here.
- **Why it's heavier:** it's a much larger rewrite of the UI data layer, more endpoints to individually get scoping right, bigger diff, more regression surface.
- **The catch:** **Path B alone does not close the DB hole.** The anon key is still public and RLS is still off, so the tables remain directly reachable. To actually seal it you'd *also* have to enable RLS (at least deny-all) or rotate/remove the anon key — i.e., you end up doing most of Path A's database work anyway.

### Recommendation

**Path A is less work and lower risk given how this app is built.** The architecture is browser-direct, so keeping it (swap client + add `getToken` + write policies) is far smaller than re-plumbing every page through new server endpoints — and it's the only one of the two that closes the exposure at the database by itself. Step one is already parked. Path B is the bigger rewrite *and* still needs RLS to be safe.

**Two things to line up before implementing Path A:**
1. Confirm every `clerk_user_id` value equals the Clerk token's `sub` claim exactly.
2. Decide the policy for signed-out `extract-coi` uploads and any legacy `clerk_user_id = null` rows (they'll become invisible/blocked once RLS is on).
