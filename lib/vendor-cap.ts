import { supabaseAdmin } from '@/lib/supabase'
import { vendorLimitForPlan } from '@/lib/plans'

// Thrown when creating another vendor would exceed the caller's plan cap. A
// distinct type so callers can turn it into a 403 paywall response rather than a
// generic 500.
export class VendorLimitError extends Error {
  limit: number
  constructor(limit: number) {
    super(`You've reached the free limit of ${limit} vendors. Upgrade to Pro to add more.`)
    this.name = 'VendorLimitError'
    this.limit = limit
  }
}

// Server-side free-tier cap check — the real gate. RLS permits owner-scoped
// writes but cannot count rows or read the user's plan, so a direct insert with
// the user's own Clerk token bypasses any client-only limit. Both the Add Vendor
// route and the extract-coi name-match path (which auto-creates a vendor) call
// this before inserting so the number lives in exactly one place (lib/plans).
export async function checkVendorCapacity(
  userId: string
): Promise<{ allowed: boolean; limit: number; count: number }> {
  const { data: userRow, error: planErr } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('clerk_user_id', userId)
    .maybeSingle()
  if (planErr) throw new Error(`plan lookup failed: ${planErr.message}`)
  const plan = userRow?.plan ?? 'free'

  const { count, error: countErr } = await supabaseAdmin
    .from('vendors')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
  if (countErr) throw new Error(`vendor count failed: ${countErr.message}`)

  const limit = vendorLimitForPlan(plan)
  const existing = count ?? 0
  return { allowed: existing < limit, limit, count: existing }
}
