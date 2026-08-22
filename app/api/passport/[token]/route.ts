import { NextRequest, NextResponse } from 'next/server'
import { resolveShareToken } from '@/lib/share-tokens'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, context: RouteContext<'/api/passport/[token]'>) {
  const { token } = await context.params
  const passport = await resolveShareToken(token)
  if (!passport) return NextResponse.json({ error: 'Passport link is invalid or expired' }, { status: 404 })
  return NextResponse.json(passport, { headers: { 'Cache-Control': 'private, no-store' } })
}
