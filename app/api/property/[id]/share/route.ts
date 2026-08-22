import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/env'
import { requirePropertyAccess } from '@/lib/auth'
import { serverError, uuidValue } from '@/lib/http'
import { generateShareToken } from '@/lib/share-tokens'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, context: RouteContext<'/api/property/[id]/share'>) {
  try {
    const { id: rawId } = await context.params
    const propertyId = uuidValue(rawId, 'property id')
    const auth = await requirePropertyAccess(propertyId)
    const { rawToken, tokenHash } = generateShareToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await auth.supabase.from('share_tokens').insert({
      organization_id: auth.organization_id,
      property_id: propertyId,
      token_hash: tokenHash,
      purpose: 'homeowner_preliminary',
      created_by: auth.user.id,
      expires_at: expiresAt,
    })
    if (error) throw error

    const url = `${getAppUrl()}/p/${rawToken}`
    return NextResponse.json({ url, expiresAt }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return serverError(error)
  }
}
