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

  // Notes are user-facing labels — omit them from the AI prompt to avoid
  // ambiguous instructions (e.g. "Must name your company") that cause false fails.
  const lines = enabled.map(r => `  - ${r.coverage}: minimum ${r.amount}`)

  return `\n\nUSER REQUIREMENTS — compare each against the COI and produce a requirementsCheck entry for each:\n${lines.join('\n')}`
}

export async function POST(request: NextRequest) {
  const t0 = Date.now()
  // ?test=1 (dev only) — skips DB save so the regression suite can test pure analysis output
  const isTestRun = process.env.NODE_ENV === 'development'
    && new URL(request.url).searchParams.get('test') === '1'

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
- For "Required" items: check if present anywhere on the COI
- Set passed: true only if the COI meets or exceeds the requirement
- Write a concise reason explaining the result

CRITICAL — Additional Insured and Waiver of Subrogation detection:
- Search the ENTIRE document: checkboxes, endorsements, AND the Description of Operations / Special Conditions section
- If the language appears ANYWHERE on the COI, set passed: true and set the corresponding top-level boolean to true
- Presence of the endorsement language anywhere is sufficient to pass — do not require it to name a specific company

CRITICAL — flags array:
- Include ONLY actual insurance compliance failures: insufficient coverage limits, expired policy, a required coverage type that is completely absent
- Do NOT flag redacted fields, illegible text, or missing administrative information (producer name, insured address, etc.) — these are document quality notes, not compliance failures
- Do NOT duplicate issues already captured in requirementsCheck

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
  flags: ['only real compliance failures not already in requirementsCheck — empty array if none'],
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

    console.log(`[extract-coi] Anthropic responded ${response.status} after ${Date.now() - t0}ms`)
    const responseText = await response.text()

    if (!response.ok) {
      console.error('[extract-coi] Anthropic API error:', responseText.slice(0, 500))
      return NextResponse.json({ error: `API error: ${response.status} - ${responseText}` }, { status: 500 })
    }

    // Parse Anthropic response — wrapped separately so a malformed body produces a clear error
    let coiData: Record<string, unknown>
    try {
      const envelope = JSON.parse(responseText)
      const block    = envelope.content?.[0]
      if (!block || block.type !== 'text') {
        throw new Error(`Unexpected content block: type=${block?.type ?? 'missing'} — full envelope: ${JSON.stringify(envelope).slice(0, 300)}`)
      }
      const cleanJson = block.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      coiData = JSON.parse(cleanJson)
      console.log(`[extract-coi] parsed OK — overallStatus=${coiData.overallStatus} expiry=${coiData.expirationDate}`)
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      console.error('[extract-coi] PARSE FAILED:', msg)
      console.error('[extract-coi] raw response (first 600 chars):', responseText.slice(0, 600))
      throw parseErr
    }

    // Server-side expiration check — the model cannot know today's date, so we
    // override isExpired, daysUntilExpiration, and overallStatus from real wall-clock time.
    const rawExpiry = coiData.expirationDate as string | null | undefined
    if (rawExpiry) {
      const parts = rawExpiry.split('/')
      const month = Number(parts[0])
      const day   = Number(parts[1])
      const year  = Number(parts[2])
      const validParse =
        parts.length === 3 &&
        Number.isInteger(month) && month >= 1  && month <= 12 &&
        Number.isInteger(day)   && day   >= 1  && day   <= 31 &&
        Number.isInteger(year)  && year  >= 1000 && year <= 9999
      if (validParse) {
        const expiry = new Date(year, month - 1, day)
        const today  = new Date()
        today.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
        coiData.daysUntilExpiration = diffDays
        coiData.isExpired           = diffDays < 0
        if (diffDays < 0) {
          coiData.overallStatus = 'EXPIRED'
          // Reconcile per-requirement results with the wall-clock expiry.
          // The model can't know today's date, so a lapsed policy would
          // otherwise still show every requirement as passed — contradicting
          // the EXPIRED status and reporting zero findings.
          if (Array.isArray(coiData.requirementsCheck)) {
            for (const rc of coiData.requirementsCheck as Array<{ coverage?: string; passed?: boolean; reason?: string; actual?: string }>) {
              if (rc?.passed) {
                rc.passed = false
                rc.reason = `${rc.coverage ?? 'Coverage'} policy expired ${rawExpiry}`
              }
            }
          }
        } else if (diffDays <= 30 && coiData.overallStatus === 'COMPLIANT') {
          coiData.overallStatus = 'EXPIRING'
        }
        console.log(`[extract-coi] expiry check: diffDays=${diffDays} isExpired=${coiData.isExpired} overallStatus=${coiData.overallStatus}`)
      } else {
        console.warn('[extract-coi] Could not parse expirationDate — leaving model values untouched. Raw value:', rawExpiry)
      }
    } else {
      console.warn('[extract-coi] expirationDate is missing or empty — leaving model values untouched.')
    }

    // Save to Supabase — skipped in test mode; failure is non-fatal otherwise
    if (isTestRun) {
      console.log('[extract-coi] test mode — skipping DB save')
    } else {
      try {
        await saveToSupabase(coiData, vendorNameFromForm, vendorIdFromForm, userId)
      } catch (dbErr) {
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
        console.error('[extract-coi] DB save error:', msg)
      }
    }

    console.log(`[extract-coi] done in ${Date.now() - t0}ms`)
    return NextResponse.json({ success: true, data: coiData })
  } catch (error) {
    const msg   = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? (error.stack ?? '') : ''
    console.error(`[extract-coi] FATAL after ${Date.now() - t0}ms: ${msg}`)
    if (stack) console.error(stack)
    return NextResponse.json(
      { error: 'Failed to extract COI data' },
      { status: 500 }
    )
  }
}

// Converts the engine's MM/DD/YYYY date strings to ISO (YYYY-MM-DD) for the
// `date` columns added in migration 004 (submissions.effective_date /
// expiration_date). Mirrors the exact same explicit month/day/year split and
// validation already used above for the server-side expiration override —
// reused here rather than duplicated logic that could drift out of sync
// with it. Fails safe: an unparseable or missing date becomes NULL, with a
// warning logged, same defensive pattern as the expiration-override logic.
function parseMMDDYYYYToISO(raw: string | null | undefined): string | null {
  if (!raw) return null
  const parts = raw.split('/')
  const month = Number(parts[0])
  const day   = Number(parts[1])
  const year  = Number(parts[2])
  const validParse =
    parts.length === 3 &&
    Number.isInteger(month) && month >= 1  && month <= 12 &&
    Number.isInteger(day)   && day   >= 1  && day   <= 31 &&
    Number.isInteger(year)  && year  >= 1000 && year <= 9999
  if (!validParse) {
    console.warn(`[extract-coi] Could not parse date for storage — leaving column null. Raw value: ${raw}`)
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
  const passedReqs = requirementsCheck.filter(r => r.passed).length
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

    // Migration 004 structured columns — promoted from coiData above,
    // additive alongside the existing fields; nothing above this comment
    // changed.
    overall_status: overallStatus || null,
    is_expired: (coiData.isExpired as boolean | undefined) ?? null,
    passed_requirements_count: passedReqs,
    failed_requirements_count: failedReqs,
    requirements_check: requirementsCheck,
    coverages: coiData.coverages ?? null,
    flags,
    additional_insured: (coiData.additionalInsured as boolean | undefined) ?? null,
    waiver_of_subrogation: (coiData.waiverOfSubrogation as boolean | undefined) ?? null,
    effective_date: parseMMDDYYYYToISO(coiData.effectiveDate as string | null | undefined),
    expiration_date: parseMMDDYYYYToISO(coiData.expirationDate as string | null | undefined),
    days_until_expiration: (coiData.daysUntilExpiration as number | undefined) ?? null,
    producer: (coiData.producer as string | undefined) ?? null,
    certificate_holder: (coiData.certificateHolder as string | undefined) ?? null,
    insured_name: (coiData.insuredName as string | undefined) ?? null,
  })
}
