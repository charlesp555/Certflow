// Single source of truth for plan-tier limits. Client-safe: this module imports
// nothing server-only, so it's shared by the vendors-page paywall (UX) and the
// server-side gates that actually enforce the cap (app/api/vendors,
// app/api/extract-coi via lib/vendor-cap). Keep the numbers here so they can't
// drift between the client hint and the server enforcement.

export const FREE_VENDOR_LIMIT = 3

// Vendor-count cap for a given plan. Only the free tier is capped; every paid
// plan (starter/pro/business) is uncapped. A user with no `users` row has never
// checked out and is treated as 'free' — this mirrors the vendors page default
// (useState('free')).
export function vendorLimitForPlan(plan: string | null | undefined): number {
  return !plan || plan === 'free' ? FREE_VENDOR_LIMIT : Infinity
}
