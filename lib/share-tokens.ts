import 'server-only'

import { createSupabaseAdminClient } from '@/lib/supabase'
export { generateShareToken, hashShareToken } from '@/lib/token-crypto'
import { hashShareToken } from '@/lib/token-crypto'
import { getSignedPhotoUrl } from '@/lib/photo-urls'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export type SharedPassport = {
  address: string
  neighborhood: string | null
  fieldScore: number | null
  observations: string[]
  photos: Array<{ id: string; url: string; phase: string; createdAt: string }>
  expiresAt: string
}

export async function resolveShareToken(rawToken: string): Promise<SharedPassport | null> {
  if (!TOKEN_PATTERN.test(rawToken)) return null
  const supabase = createSupabaseAdminClient()
  const tokenHash = hashShareToken(rawToken)
  const now = new Date().toISOString()
  const { data: share, error: shareError } = await supabase
    .from('share_tokens')
    .select('id, property_id, expires_at')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .single()
  if (shareError || !share) return null

  const [{ data: property, error: propertyError }, { data: photoRows, error: photosError }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, address, neighborhood, field_score, observations')
      .eq('id', share.property_id)
      .single(),
    supabase
      .from('photos')
      .select('id, storage_url, storage_path, phase, created_at')
      .eq('property_id', share.property_id)
      .eq('phase', 'pre_knock')
      .order('created_at', { ascending: true }),
  ])
  if (propertyError || photosError || !property) return null

  const photos = await Promise.all((photoRows || []).map(async (photo) => {
    const url = await getSignedPhotoUrl(supabase, photo)
    return { id: photo.id, url, phase: photo.phase, createdAt: photo.created_at }
  }))

  await supabase.from('share_tokens').update({ last_accessed_at: now }).eq('id', share.id)
  return {
    address: property.address,
    neighborhood: property.neighborhood,
    fieldScore: property.field_score,
    observations: property.observations || [],
    photos,
    expiresAt: share.expires_at,
  }
}
