import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client: uses the service-role key to bypass RLS in API routes.
// Lazily constructed behind a Proxy so this module stays safe to import from
// the browser bundle (client pages import `supabase`/`createClerkSupabaseClient`
// from here, and the service-role key is server-only — undefined in the browser).
// The real client is built on first property access, which only happens in the
// server-side API routes, and throws loudly if the key is missing rather than
// silently degrading to the anon key — which would run every "admin" query as an
// unprivileged anon caller (the cause of the silent upload-save failure).
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }
    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  }
  return _supabaseAdmin
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === 'function' ? (value as Function).bind(client) : value
  },
})

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
