import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkVendorCapacity } from '@/lib/vendor-cap'

export async function POST(request: NextRequest) {
  // Owner identity comes from the Clerk session only — never from the body.
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, type } = await request.json()
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) {
    return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 })
  }

  // Enforce the free-tier cap server-side. The client paywall is only a UX hint;
  // this is the gate that a direct browser-console insert can't get around.
  let capacity
  try {
    capacity = await checkVendorCapacity(userId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  if (!capacity.allowed) {
    return NextResponse.json(
      { error: `You've reached the free limit of ${capacity.limit} vendors. Upgrade to Pro to add more.` },
      { status: 403 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .insert({
      clerk_user_id: userId,
      name: trimmedName,
      type: typeof type === 'string' ? type : null,
      status: 'Pending Review',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data?.id })
}
