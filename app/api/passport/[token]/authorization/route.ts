import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { hashShareToken } from '@/lib/token-crypto'
import { readJsonObject, serverError, stringValue } from '@/lib/http'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export async function POST(request: NextRequest, context: RouteContext<'/api/passport/[token]/authorization'>) {
  try {
    const { token } = await context.params
    if (!TOKEN_PATTERN.test(token)) return NextResponse.json({ error: 'Invalid Passport link' }, { status: 404 })
    const body = await readJsonObject(request)
    const homeownerName = stringValue(body.homeownerName, 'homeownerName', { required: true, maxLength: 120 })!
    const decision = stringValue(body.decision, 'decision', { required: true })!
    const affirmativeConsent = body.affirmativeConsent === true
    if (!['approved', 'declined'].includes(decision)) return NextResponse.json({ error: 'Decision must be approved or declined' }, { status: 400 })
    if (decision === 'approved' && !affirmativeConsent) return NextResponse.json({ error: 'Affirmative consent is required to approve' }, { status: 400 })

    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || ''
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.rpc('record_homeowner_authorization', {
      submitted_token_hash: hashShareToken(token), submitted_homeowner_name: homeownerName,
      submitted_decision: decision, submitted_ip: forwarded, submitted_user_agent: userAgent,
    })
    if (error) {
      if (/Invalid|expired|name/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 400 })
      throw error
    }
    return NextResponse.json({ authorizationId: data, decision }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) return NextResponse.json({ error: error.message }, { status: 400 })
    return serverError(error)
  }
}
