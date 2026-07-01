#!/usr/bin/env node
/**
 * Covira COI verification regression suite.
 * Sends each of the 5 known test COIs to the local /api/extract-coi endpoint
 * and asserts structured output against a fixed answer key.
 *
 * ─── BEFORE EVERY RUN ────────────────────────────────────────────────────────
 *
 *  1. Make sure .env.local has:
 *       COVIRA_TEST_SECRET=<any-random-string>
 *
 *  2. Start the dev server in a separate terminal:
 *       npm run dev
 *
 *  3. Run the suite:
 *       npm run test:engine
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Why COVIRA_TEST_SECRET instead of a Clerk session token:
 *   /api/extract-coi is not in middleware.ts's public-routes list, so Clerk's
 *   auth.protect() normally fires for every unauthenticated request. Grabbing
 *   a real session JWT from the browser only stays valid for ~60 seconds,
 *   which made automated runs impractical. middleware.ts has a dev-only bypass
 *   (NODE_ENV === 'development' only — structurally unreachable in production)
 *   that accepts a static secret via the x-test-secret header instead. Because
 *   the bypass carries no real Clerk session, the route falls back to
 *   DEFAULT_REQUIREMENTS, which is exactly what the test assertions below
 *   are written against (GL $1M, Auto $1M, WC Statutory, AI, Waiver).
 *
 * Requires: Node 21+ (built-in fetch + FormData globals).
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ── node version guard ────────────────────────────────────────────────────────

const [nodeMajor] = process.versions.node.split('.').map(Number)
if (nodeMajor < 21) {
  console.error(`Node 21+ required (for stable fetch + FormData). Running: ${process.versions.node}`)
  process.exit(1)
}

// ── paths ─────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const COI_DIR   = path.join(ROOT, 'Test Cois')

// ── env loader ────────────────────────────────────────────────────────────────

function loadEnvFile(filename) {
  const p = path.join(ROOT, filename)
  if (!fs.existsSync(p)) return {}
  const env = {}
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }
  return env
}

const env    = loadEnvFile('.env.local')
const PORT   = env.PORT ?? '3000'
const BASE   = `http://localhost:${PORT}`
const SECRET = env.COVIRA_TEST_SECRET ?? ''

if (!SECRET) {
  console.error(`
✗  COVIRA_TEST_SECRET is not set in .env.local.

Add a line to .env.local (any random string works):
  COVIRA_TEST_SECRET=<any-random-string>

Then make sure  npm run dev  is running and re-run  npm run test:engine.
`)
  process.exit(1)
}

// ── assertion helpers ─────────────────────────────────────────────────────────

/** Find a requirementsCheck entry whose coverage field contains `keyword` (case-insensitive). */
function findReq(data, keyword) {
  if (!Array.isArray(data?.requirementsCheck)) return null
  const kw = keyword.toLowerCase()
  return data.requirementsCheck.find(r => r.coverage?.toLowerCase().includes(kw)) ?? null
}

/** Build one assertion result object. */
function mk(label, expected, actual, pass) {
  return { label, expected, actual, pass }
}

// ── test definitions ──────────────────────────────────────────────────────────

const TESTS = [
  {
    id:   1,
    name: 'Budget Plumbing',
    file: 'acord25-test 1.pdf',
    assert(data) {
      const gl   = findReq(data, 'general')
      const auto = findReq(data, 'auto')
      const wc   = findReq(data, 'workers')
      return [
        mk('overallStatus = NON_COMPLIANT',       'NON_COMPLIANT', data.overallStatus,       data.overallStatus === 'NON_COMPLIANT'),
        mk('GL passed = false',                   false,           gl?.passed,               gl?.passed === false),
        mk('GL actual contains $500,000',         '$500,000',      gl?.actual,               /500[,.]?000/.test(gl?.actual ?? '')),
        mk('Auto Liability passed = true',        true,            auto?.passed,             auto?.passed === true),
        mk('Workers Comp passed = true',          true,            wc?.passed,               wc?.passed === true),
        mk('additionalInsured = true',            true,            data.additionalInsured,   data.additionalInsured === true),
        mk('waiverOfSubrogation = true',          true,            data.waiverOfSubrogation, data.waiverOfSubrogation === true),
      ]
    },
  },
  {
    id:   2,
    name: 'Apex Mechanical',
    file: 'acord25-test2.pdf',
    assert(data) {
      const gl   = findReq(data, 'general')
      const auto = findReq(data, 'auto')
      const wc   = findReq(data, 'workers')
      const failedCount = Array.isArray(data.requirementsCheck)
        ? data.requirementsCheck.filter(r => !r.passed).length
        : -1
      return [
        mk('overallStatus = COMPLIANT',           'COMPLIANT', data.overallStatus, data.overallStatus === 'COMPLIANT'),
        mk('GL passed = true',                    true,        gl?.passed,         gl?.passed === true),
        mk('GL actual contains $2,000,000',       '$2,000,000',gl?.actual,         /2[,.]?000[,.]?000/.test(gl?.actual ?? '')),
        mk('Auto Liability passed = true',        true,        auto?.passed,       auto?.passed === true),
        mk('Workers Comp passed = true',          true,        wc?.passed,         wc?.passed === true),
        mk('zero failed requirements',            0,           failedCount,        failedCount === 0),
      ]
    },
  },
  {
    id:   3,
    name: 'Reliable Roofing',
    file: 'acord25-Test 3 .pdf',
    assert(data) {
      const gl   = findReq(data, 'general')
      const auto = findReq(data, 'auto')
      return [
        mk('overallStatus = NON_COMPLIANT',       'NON_COMPLIANT', data.overallStatus, data.overallStatus === 'NON_COMPLIANT'),
        mk('GL passed = true',                    true,            gl?.passed,         gl?.passed === true),
        mk('Auto Liability passed = false',       false,           auto?.passed,       auto?.passed === false),
        mk('Auto actual contains $500,000',       '$500,000',      auto?.actual,       /500[,.]?000/.test(auto?.actual ?? '')),
      ]
    },
  },
  {
    id:   4,
    name: 'Precision Electric',
    file: 'acord25-test 4.pdf',
    assert(data) {
      const gl = findReq(data, 'general')
      return [
        mk('overallStatus = NON_COMPLIANT',       'NON_COMPLIANT', data.overallStatus, data.overallStatus === 'NON_COMPLIANT'),
        mk('GL passed = false',                   false,           gl?.passed,         gl?.passed === false),
        // Engine must read $999,999 exactly — rounding up to $1,000,000 would silently flip passed to true
        mk('GL actual is $999,999 (not rounded)', '$999,999',      gl?.actual,         /999[,.]?999/.test(gl?.actual ?? '')),
      ]
    },
  },
  {
    id:   5,
    name: 'Evergreen Landscaping',
    file: 'acord25-test 5 .pdf',
    assert(data) {
      const wc = findReq(data, 'workers')
      return [
        mk('overallStatus = EXPIRED',             'EXPIRED', data.overallStatus, data.overallStatus === 'EXPIRED'),
        mk('isExpired = true',                    true,      data.isExpired,     data.isExpired === true),
        mk('Workers Comp passed = false (absent)',false,      wc?.passed,         wc?.passed === false),
      ]
    },
  },
]

// ── HTTP call ─────────────────────────────────────────────────────────────────

async function analyzeCoI(filePath) {
  const buffer = fs.readFileSync(filePath)
  const blob   = new Blob([buffer], { type: 'application/pdf' })
  const fd     = new FormData()
  fd.append('file', blob, path.basename(filePath))

  // ?test=1 tells the route (dev only) to skip the DB save step, isolating
  // regression tests to pure analysis output and avoiding vendor/submission side effects.
  const res = await fetch(`${BASE}/api/extract-coi?test=1`, {
    method:  'POST',
    headers: { 'x-test-secret': SECRET },
    body:    fd,
  })

  if (res.status === 401) {
    throw new Error(
      '401 Unauthorized — COVIRA_TEST_SECRET does not match the dev server.\n' +
      '  Check .env.local has the same COVIRA_TEST_SECRET value the running dev server picked up\n' +
      '  (restart  npm run dev  after changing it), and that NODE_ENV is development.'
    )
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
  }

  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Engine returned success=false with no error message')
  return json.data
}

// ── runner ────────────────────────────────────────────────────────────────────

const GREEN = s => `\x1b[32m${s}\x1b[0m`
const RED   = s => `\x1b[31m${s}\x1b[0m`
const BOLD  = s => `\x1b[1m${s}\x1b[0m`
const HR    = '─'.repeat(64)

function fmt(v) {
  if (v === undefined) return 'undefined'
  if (v === null)      return 'null'
  if (typeof v === 'string' && v.length > 40) return v.slice(0, 37) + '…'
  return String(v)
}

async function runOne(test) {
  const filePath = path.join(COI_DIR, test.file)
  if (!fs.existsSync(filePath)) {
    return { id: test.id, name: test.name, error: `File not found: ${filePath}` }
  }
  try {
    const data    = await analyzeCoI(filePath)
    const results = test.assert(data)
    return { id: test.id, name: test.name, results, raw: data }
  } catch (err) {
    return { id: test.id, name: test.name, error: err.message }
  }
}

async function main() {
  console.log(`\n${HR}`)
  console.log(BOLD(`  Covira COI Engine — Regression Test Suite`))
  console.log(`  Endpoint: ${BASE}/api/extract-coi`)
  console.log(`${HR}\n`)
  console.log('  Sending all 5 COIs in parallel…\n')

  // Parallel execution: total wall time ~10 s, well within the 60 s token window.
  const outcomes = await Promise.all(TESTS.map(runOne))

  let suitePassed = 0

  for (const outcome of outcomes) {
    console.log(HR)
    console.log(BOLD(`  TEST ${outcome.id} — ${outcome.name}`))
    console.log(HR)

    if (outcome.error) {
      console.log(`  ${RED('✗ ERROR')}  ${outcome.error}\n`)
      continue
    }

    let allPass = true
    for (const r of outcome.results) {
      const icon    = r.pass ? GREEN('✓ PASS') : RED('✗ FAIL')
      const label   = r.label.padEnd(40)
      const expStr  = `expected: ${fmt(r.expected)}`.padEnd(24)
      const actStr  = `actual: ${fmt(r.actual)}`
      console.log(`  ${icon}  ${label}  ${expStr}  ${actStr}`)
      if (!r.pass) allPass = false
    }

    const passed = outcome.results.filter(r => r.pass).length
    const total  = outcome.results.length
    const verdict = allPass ? GREEN('PASS') : RED('FAIL')
    console.log(`\n  Result: ${verdict}  (${passed}/${total} assertions)\n`)
    if (allPass) suitePassed++
  }

  console.log(HR)
  const allGreen  = suitePassed === TESTS.length
  const summary   = `  SUITE: ${suitePassed}/${TESTS.length} tests passed`
  console.log(allGreen ? GREEN(summary) : RED(summary))
  console.log(`${HR}\n`)

  process.exit(allGreen ? 0 : 1)
}

main().catch(err => {
  console.error(RED(`\nFatal error: ${err.message}`))
  process.exit(1)
})
