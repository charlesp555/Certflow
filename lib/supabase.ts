import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client: uses service role key to bypass RLS in API routes
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey
)

// The client the browser uses for all data access — additive, does not change
// `supabase` or `supabaseAdmin` above. Forwards a Clerk session token to
// Supabase via the accessToken() callback, which is Supabase's current
// recommended pattern for Clerk third-party/native auth (replaces the older
// manual JWT-template approach): https://supabase.com/docs/guides/auth/third-party/clerk
// Still uses the anon key as the client key — the JWT carried per-request via
// accessToken() is what Supabase's third-party auth integration verifies and
// exposes to `auth.jwt()` in RLS policies. RLS is now ENABLED on every tenant
// table (migrations 007–011), so this token is what authorizes each request:
// `auth.jwt() ->> 'sub'` must equal a row's clerk_user_id or the row is
// invisible. Without a token the caller is the anon role and sees nothing.
export function createClerkSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => (await getToken()) ?? null,
  })
}
