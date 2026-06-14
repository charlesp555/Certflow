import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('user_company')
    .select('name, industry, size, website, address')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ company: data ?? null })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, industry, size, website, address } = await request.json()

  const { error } = await supabaseAdmin
    .from('user_company')
    .upsert(
      {
        clerk_user_id: userId,
        name: name ?? null,
        industry: industry ?? null,
        size: size ?? null,
        website: website ?? null,
        address: address ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
