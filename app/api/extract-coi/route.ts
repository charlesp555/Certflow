import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

interface Requirement {
  id: number
  coverage: string
  enabled: boolean
  amount: string
  notes: string
}

const DEFAULT_REQUIREMENTS: Requirement[] = [
  { id: 1, coverage: 'General Liability',     enabled: true, amount: '$1,000,000', notes: 'Per occurrence limit'   },
  { id: 2, coverage: 'Auto Liability',        enabled: true, amount: '$1,000,000', notes: 'Combined single limit'  },
  { id: 3, coverage: 'Workers Compensation',  enabled: true, amount: 'Statutory',  notes: 'Required in all states' },
  { id: 4, coverage: 'Additional Insured',    enabled: true, amount: 'Required',   notes: 'Must name your company' },
  { id: 5, coverage: 'Waiver of Subrogation', enabled: true, amount: 'Required',   notes: 'Must be included'       },
]

async function fetchUserRequirements(userId: string): Promise<Requirement[]> {
  const { data } = await supabaseAdmin
    .from('user_requirements')
    .select('requirements')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (Array.isArray(data?.requirements) && data.requirements.length > 0) {
    return data.requirements as Requirement[]
  }
  return DEFAULT_REQUIREMENTS
}

function buildRequirementsPrompt(requirements: Requirement[]): string {
  const enabled = requirements.filter(r => r.enabled)
  if (enabled.length === 0) return ''

  const lines = enabled.map(r => {
    const note = r.notes ? ` (${r.notes})` : ''
    return `  - ${r.coverage}: minimum ${r.amount}${note}`
  })

  return `\n\nUSER REQUIREMENTS — compare each against the COI and produce a requirementsCheck entry for each:\n${lines.join('\n')}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const vendorNameFromForm = (formData.get('vendor_name') as string | null) || null
    const vendorIdFromForm = (formData.get('vendor_id') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const { userId } = await auth()

    // Fetch this user's saved requirements (or defaults)
    const requirements = userId
      ? await fetchUserRequirements(userId)
      : DEFAULT_REQUIREMENTS

    const enabledReqs = requirements.filter(r => r.enabled)

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const requirementsSection = buildRequirementsPrompt(requirements)

    const requirementsCheckStructure = enabledReqs.map(r => ({
      coverage: r.coverage,
      required: true,
      minimum: r.amount,
      actual: 'extract from COI',
      passed: false,
      reason: 'explain pass or fail',
    }))

    const prompt = `You are a certificate of insurance compliance expert. Extract all information from this COI and check it against the user's specific requirements. Return ONLY a JSON object with no other text.${requirementsSection}

For each requirement:
- Extract the actual coverage amount/status from the COI
- For monetary minimums: compare numerically (e.g. $1,000,000 vs $2,000,000 = FAIL)
- For "Required" items (Additional Insured, Waiver of Subrogation): check if present on the COI
- Set passed: true only if the COI meets or exceeds the requirement
- Write a concise reason explaining the result

Set overallStatus to:
- "COMPLIANT" if all requirements pass and policy is not expired
- "EXPIRING" if all requirements pass but policy expires within 30 days
- "EXPIRED" if the policy is expired
- "NON_COMPLIANT" if any requirement fails

Return this exact JSON structure:
${JSON.stringify({
  insuredName: 'company name',
  insuredAddress: 'address',
  effectiveDate: 'date',
  expirationDate: 'date',
  isExpired: false,
  daysUntilExpiration: 0,
  coverages: [{ type: 'coverage type', eachOccurrence: 'amount', aggregate: 'amount', deductible: 'amount' }],
  additionalInsured: false,
  waiverOfSubrogation: false,
  certificateHolder: 'name',
  producer: 'insurance agency name',
  requirementsCheck: requirementsCheckStructure,
  flags: ['any compliance issues not already captured in requirementsCheck'],
  overallStatus: 'COMPLIANT',
})}`

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
        max_tokens: 3000,
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
                text: prompt,
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
      await saveToSupabase(coiData, vendorNameFromForm, vendorIdFromForm, userId)
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
  vendorId: string | null,
  userId: string | null | undefined
) {
  const flags = Array.isArray(coiData.flags) ? (coiData.flags as string[]) : []
  const overallStatus = (coiData.overallStatus as string | undefined) ?? ''
  const status = overallStatus === 'COMPLIANT' ? 'Compliant' : 'Issues Found'

  // Count failed requirements + existing flags for issues count
  const requirementsCheck = Array.isArray(coiData.requirementsCheck)
    ? (coiData.requirementsCheck as Array<{ passed: boolean }>)
    : []
  const failedReqs = requirementsCheck.filter(r => !r.passed).length
  const issuesCount = flags.length + failedReqs

  // Risk score based on requirements compliance
  let riskScore = 100
  if (coiData.isExpired || overallStatus === 'EXPIRED') riskScore -= 40
  else if (overallStatus === 'EXPIRING') riskScore -= 10
  riskScore -= Math.min(failedReqs * 15, 45)
  riskScore -= Math.min(flags.length * 5, 20)
  riskScore = Math.max(riskScore, 0)

  const vendorStatus =
    overallStatus === 'EXPIRED'      ? 'expired'
    : overallStatus === 'EXPIRING'   ? 'expiring'
    : overallStatus === 'COMPLIANT'  ? 'active'
    : 'non_compliant'

  const expirationDate = (coiData.expirationDate as string | null) || null
  const resolvedVendorName = vendorName || (coiData.insuredName as string | null) || null
  let resolvedVendorId = vendorId

  if (resolvedVendorId) {
    await supabaseAdmin
      .from('vendors')
      .update({ status: vendorStatus, expiration_date: expirationDate })
      .eq('id', resolvedVendorId)
      .eq('clerk_user_id', userId ?? '')
  } else if (resolvedVendorName) {
    const query = supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('name', resolvedVendorName)

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
