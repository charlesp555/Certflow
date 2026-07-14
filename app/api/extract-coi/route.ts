import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkVendorCapacity, VendorLimitError } from '@/lib/vendor-cap'

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

    // L-1 — server-side upload validation; the client checks are bypassable.
    // Accept a PDF by MIME type OR .pdf extension (drag-drop can yield an empty
    // or generic MIME), and cap size to bound the base64 encode + upstream call.
    const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15 MB — generous; a real COI is <2 MB
    const isPdf =
      file.type === 'application/pdf' ||
      file.name?.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 15 MB.' }, { status: 400 })
    }

    const { userId } = await auth()

    // Uploads must be authenticated. A real upload persists owner-scoped rows
    // (clerk_user_id) via saveToSupabase; allowing an unauthenticated request
    // would write clerk_user_id = null rows that RLS will later orphan. The
    // only exception is the dev-only regression path (?test=1), which skips
    // the DB save entirely (see the isTestRun branch below), so it can never
    // create null-owner rows. isTestRun is structurally false in production,
    // so every production request must carry a valid Clerk session.
    if (!userId && !isTestRun) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const prompt = `You are a certificate of insurance compliance expert. Return ONLY a JSON object with no other text.

STEP 0 — DOCUMENT IDENTIFICATION. Before extracting anything, determine what this document is. Set "documentType" to exactly one of:
- "acord25" — an ACORD 25 Certificate of Liability Insurance. Accept ANY ACORD 25 revision year (2016/03, 2014/01, etc.), scanned or photographed copies, skewed or low-quality scans, unusual layouts, and partially redacted certificates — if the document is recognizably an ACORD 25 certificate of liability insurance, it qualifies.
- "other_insurance" — an insurance document that is NOT an ACORD 25: a different ACORD form (e.g. ACORD 24, 27, 28), a policy declarations page, a carrier letter, a binder, an endorsement on its own.
- "not_insurance" — anything else: a lease, an invoice, a blank page, any non-insurance document.
If documentType is NOT "acord25", return ONLY this and skip everything below:
{"documentType": "other_insurance or not_insurance", "documentDescription": "one short phrase saying what the document appears to be"}
If you are genuinely uncertain whether the document is an ACORD 25, do NOT guess — use "other_insurance". Never produce a compliance verdict for a document you could not identify as an ACORD 25.

If and only if documentType is "acord25": extract all information from this COI and check it against the user's specific requirements.${requirementsSection}

For each requirement:
- Extract the actual coverage amount/status from the COI
- For monetary minimums: compare numerically (e.g. $1,000,000 vs $2,000,000 = FAIL)
- For "Required" items: check if present anywhere on the COI
- Set passed: true only if the COI meets or exceeds the requirement
- Write a concise reason explaining the result

CRITICAL — expirationDate:
- If the policies on the certificate carry DIFFERENT expiration dates, set the top-level expirationDate to the EARLIEST of them — coverage begins lapsing at the first expiry, so the earliest date is the certificate's effective expiration

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
  documentType: 'acord25',
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

    // 90s upstream timeout — without it a hung Anthropic call pins the modal
    // spinner until the 300s platform kill. Timeout and network failures both
    // read as "busy, retry" to the user, which is the honest instruction.
    let response: Response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(90_000),
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
    } catch (fetchErr) {
      const name = fetchErr instanceof Error ? fetchErr.name : ''
      console.error(`[extract-coi] Anthropic fetch failed after ${Date.now() - t0}ms: ${name}`)
      return NextResponse.json(
        { error: 'Analysis service is busy. Please try again in a moment.' },
        { status: 503 }
      )
    }

    console.log(`[extract-coi] Anthropic responded ${response.status} after ${Date.now() - t0}ms`)
    const responseText = await response.text()

    if (!response.ok) {
      console.error('[extract-coi] Anthropic API error:', responseText.slice(0, 500))
      // Overload/rate-limit is transient — tell the user to retry. A 400 means
      // the API couldn't process the document itself (corrupt, encrypted) —
      // retrying can never fix that, so say what's actually wrong.
      if (response.status === 429 || response.status === 529) {
        return NextResponse.json(
          { error: 'Analysis service is busy. Please try again in a moment.' },
          { status: 503 }
        )
      }
      if (response.status === 400) {
        return NextResponse.json(
          { error: "This PDF couldn't be read. It may be corrupt or password-protected." },
          { status: 422 }
        )
      }
      return NextResponse.json({ error: 'Failed to analyze COI. Please try again.' }, { status: 500 })
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

    // ── Document-type gate ────────────────────────────────────────────────────
    // Covira is verified against ACORD 25 only. This gate runs BEFORE the
    // expiry override and BEFORE saveToSupabase — the only place this route
    // writes to the DB — so a refused document changes nothing: no submission
    // row, no vendor status change, no document record. Grading an unidentified
    // document would produce a confident-but-wrong verdict, which is worse
    // than no verdict.
    const documentType = coiData.documentType as string | undefined
    if (documentType !== 'acord25') {
      if (documentType === undefined) {
        // The model didn't return the identification field at all. That's a
        // model-compliance failure, not a judgment that the document isn't an
        // ACORD 25 — refuse to grade, but as a retryable error, not a
        // misdocument verdict.
        console.error('[extract-coi] documentType missing from model output — refusing to grade')
        return NextResponse.json(
          { error: 'Analysis could not be completed. Please try again.' },
          { status: 500 }
        )
      }
      console.log(`[extract-coi] document-type gate refused: ${documentType} (${String(coiData.documentDescription ?? 'no description')})`)
      return NextResponse.json(
        {
          error: "This doesn't appear to be an ACORD 25 certificate of liability insurance. Covira currently verifies ACORD 25 certificates only.",
          documentType,
        },
        { status: 422 }
      )
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

    // Save to Supabase — skipped in test mode. A save failure is NOT swallowed:
    // saveToSupabase now throws on any Supabase write error (notably an
    // RLS-blocked insert, which is what happens if SUPABASE_SERVICE_ROLE_KEY is
    // missing and supabaseAdmin silently falls back to the anon key). We surface
    // it as a real 500 with saved:false so the upload modal shows an error
    // instead of a false "saved" state. The analysis itself may have succeeded,
    // but an unsaved COI never appears anywhere, so it's a failure to the user.
    if (isTestRun) {
      console.log('[extract-coi] test mode — skipping DB save')
    } else {
      try {
        await saveToSupabase(coiData, vendorNameFromForm, vendorIdFromForm, userId)
      } catch (dbErr) {
        // A free user at the vendor cap uploading a COI for a NEW vendor name is
        // a paywall, not a server error — surface it as a clear 403 so the modal
        // can tell them to upgrade rather than showing a generic save failure.
        if (dbErr instanceof VendorLimitError) {
          console.log('[extract-coi] vendor cap hit on name-match create — refusing')
          return NextResponse.json({ error: dbErr.message, saved: false }, { status: 403 })
        }
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
        console.error('[extract-coi] DB save FAILED:', msg)
        return NextResponse.json(
          { error: 'Your COI was analyzed but could not be saved to your account. Please try again.', saved: false },
          { status: 500 }
        )
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
    const { error: vendorUpdateErr } = await supabaseAdmin
      .from('vendors')
      .update({ status: vendorStatus, expiration_date: expirationDate })
      .eq('id', resolvedVendorId)
      .eq('clerk_user_id', userId ?? '')
    if (vendorUpdateErr) throw new Error(`vendor update failed: ${vendorUpdateErr.message}`)
  } else if (resolvedVendorName) {
    const query = supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('name', resolvedVendorName)

    const { data: existing } = await (userId ? query.eq('clerk_user_id', userId) : query)
      .maybeSingle()

    if (existing?.id) {
      resolvedVendorId = existing.id
      const { error: vendorUpdateErr } = await supabaseAdmin
        .from('vendors')
        .update({ status: vendorStatus, expiration_date: expirationDate })
        .eq('id', existing.id)
      if (vendorUpdateErr) throw new Error(`vendor update failed: ${vendorUpdateErr.message}`)
    } else {
      // This is the only extract-coi path that CREATES a vendor (upload of a COI
      // for a brand-new vendor name). It must respect the same free-tier cap as
      // the Add Vendor route — otherwise a free user at the limit could create a
      // 4th vendor just by uploading. The vendor_id and existing-name paths above
      // only update, so they don't need this check.
      if (userId) {
        const { allowed, limit } = await checkVendorCapacity(userId)
        if (!allowed) throw new VendorLimitError(limit)
      }
      const { data: newVendor, error: vendorInsertErr } = await supabaseAdmin
        .from('vendors')
        .insert({
          clerk_user_id: userId,
          name: resolvedVendorName,
          status: vendorStatus,
          expiration_date: expirationDate,
        })
        .select('id')
        .single()
      if (vendorInsertErr) throw new Error(`vendor insert failed: ${vendorInsertErr.message}`)
      resolvedVendorId = newVendor?.id ?? null
    }
  }

  const { error: submissionErr } = await supabaseAdmin.from('submissions').insert({
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
  if (submissionErr) throw new Error(`submissions insert failed: ${submissionErr.message}`)
}
