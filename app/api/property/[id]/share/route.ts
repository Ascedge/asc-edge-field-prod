import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/env'
import { requirePropertyAccess } from '@/lib/auth'
import { serverError, uuidValue } from '@/lib/http'
import { decryptShareToken, encryptShareToken, generateShareToken } from '@/lib/share-tokens'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, context: RouteContext<'/api/property/[id]/share'>) {
  try {
    const { id: rawId } = await context.params
    const propertyId = uuidValue(rawId, 'property id')
    const auth = await requirePropertyAccess(propertyId)
    const { data: existing } = await auth.supabase.from('share_tokens')
      .select('id, token_ciphertext').eq('property_id', propertyId)
      .eq('purpose', 'homeowner_preliminary').is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (existing?.token_ciphertext) {
      const rawToken = decryptShareToken(existing.token_ciphertext)
      return NextResponse.json({ url: `${getAppUrl()}/p/${rawToken}`, expiresAt: null, durable: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (existing) {
      const { error: revokeError } = await auth.supabase.from('share_tokens').update({ revoked_at: new Date().toISOString(), revocation_reason: 'Replaced legacy expiring preview link during P0 recovery' }).eq('id', existing.id)
      if (revokeError) throw revokeError
    }
    const { rawToken, tokenHash } = generateShareToken()
    const { error } = await auth.supabase.from('share_tokens').insert({
      organization_id: auth.organization_id,
      property_id: propertyId,
      token_hash: tokenHash,
      token_ciphertext: encryptShareToken(rawToken),
      purpose: 'homeowner_preliminary',
      created_by: auth.user.id,
      expires_at: null,
    })
    if (error) throw error

    const url = `${getAppUrl()}/p/${rawToken}`
    return NextResponse.json({ url, expiresAt: null, durable: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return serverError(error)
  }
}
