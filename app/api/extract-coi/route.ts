import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

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

    return NextResponse.json({ success: true, data: coiData })
  } catch (error) {
    console.error('COI extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract COI data' },
      { status: 500 }
    )
  }
}