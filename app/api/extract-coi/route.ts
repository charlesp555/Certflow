import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const vendorNameFromForm = (formData.get('vendor_name') as string | null) || null
    const vendorIdFromForm = (formData.get('vendor_id') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'You are a certificate of insurance compliance expert. Extract all information from this COI and return ONLY a JSON object with no other text. Return this exact structure: {"insuredName":"company name","insuredAddress":"address","effectiveDate":"date","expirationDate":"date","isExpired":false,"daysUntilExpiration":0,"coverages":[{"type":"coverage type","eachOccurrence":"amount","aggregate":"amount","deductible":"amount"}],"additionalInsured":false,"waiverOfSubrogation":false,"certificateHolder":"name","producer":"insurance agency name","flags":["any compliance issues"],"overallStatus":"COMPLIANT"}',
              },
            ],
          },
        ],
      }),
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error('Anthropic API error:', responseText)
      return NextResponse.json({ error: `API error: ${response.status} - ${responseText}` }, { status: 500 })
    }

    const data = JSON.parse(responseText)
    const content = data.content[0]
    const cleanJson = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const coiData = JSON.parse(cleanJson)

    // Save to Supabase — failure is non-fatal; analysis is always returned
    try {
      await saveToSupabase(coiData, vendorNameFromForm, vendorIdFromForm)
    } catch (dbErr) {
      console.error('Supabase save error:', dbErr)
    }

    return NextResponse.json({ success: true, data: coiData })
  } catch (error) {
    console.error('COI extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract COI data' },
      { status: 500 }
    )
  }
}

async function saveToSupabase(
  coiData: Record<string, unknown>,
  vendorName: string | null,
  vendorId: string | null
) {
  const { userId } = await auth()

  const flags = Array.isArray(coiData.flags) ? (coiData.flags as string[]) : []
  const overallStatus = (coiData.overallStatus as string | undefined) ?? ''
  const status = overallStatus === 'COMPLIANT' && flags.length === 0 ? 'Compliant' : 'Issues Found'
  const issuesCount = flags.length

  // Risk score: 100 = fully compliant, lower = more risk
  let riskScore = 100
  if (coiData.isExpired || overallStatus === 'EXPIRED') riskScore -= 40
  else if (overallStatus === 'EXPIRING') riskScore -= 15
  if (!coiData.additionalInsured) riskScore -= 10
  if (!coiData.waiverOfSubrogation) riskScore -= 10
  riskScore -= Math.min(issuesCount * 8, 40)
  riskScore = Math.max(riskScore, 0)

  // Prefer form-supplied vendor name, fall back to AI-extracted insured name
  const resolvedVendorName = vendorName || (coiData.insuredName as string | null) || null
  let resolvedVendorId = vendorId

  if (resolvedVendorName && !resolvedVendorId) {
    const vendorStatus =
      overallStatus === 'EXPIRED' ? 'expired'
      : overallStatus === 'EXPIRING' ? 'expiring'
      : overallStatus === 'COMPLIANT' ? 'active'
      : 'non_compliant'

    const expirationDate = (coiData.expirationDate as string | null) || null

    const query = supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('name', resolvedVendorName)

    // Scope lookup to this user's vendors when authenticated
    const { data: existing } = await (userId ? query.eq('clerk_user_id', userId) : query)
      .maybeSingle()

    if (existing?.id) {
      resolvedVendorId = existing.id
      await supabaseAdmin
        .from('vendors')
        .update({ status: vendorStatus, expiration_date: expirationDate })
        .eq('id', existing.id)
    } else {
      const { data: newVendor } = await supabaseAdmin
        .from('vendors')
        .insert({
          clerk_user_id: userId,
          name: resolvedVendorName,
          status: vendorStatus,
          expiration_date: expirationDate,
        })
        .select('id')
        .single()
      resolvedVendorId = newVendor?.id ?? null
    }
  }

  await supabaseAdmin.from('submissions').insert({
    clerk_user_id: userId,
    vendor_id: resolvedVendorId,
    status,
    issues_count: issuesCount,
    risk_score: riskScore,
    analysis_result: coiData,
  })
}
