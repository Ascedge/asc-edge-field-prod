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
  status: string
  authorization: { decision: string; decidedAt: string } | null
  photos: Array<{ id: string; url: string; phase: string; category: string | null; caption: string | null; createdAt: string }>
  timeline: Array<{ id: string; eventType: string; status: string | null; summary: string; createdAt: string }>
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

  const [{ data: property, error: propertyError }, { data: authorization }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, address, neighborhood, field_score, observations, report_status')
      .eq('id', share.property_id)
      .single(),
    supabase.from('property_authorizations')
      .select('decision, created_at')
      .eq('property_id', share.property_id)
      .eq('authorization_type', 'inspection_documentation')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (propertyError || !property) return null

  let photoQuery = supabase.from('photos')
    .select('id, storage_url, storage_path, phase, category, caption, created_at')
    .eq('property_id', share.property_id)
    .order('created_at', { ascending: true })
  if (authorization?.decision !== 'approved') photoQuery = photoQuery.eq('phase', 'pre_knock')
  const [{ data: photoRows, error: photosError }, { data: timelineRows }] = await Promise.all([
    photoQuery,
    supabase.from('property_timeline_events')
      .select('id, event_type, report_status, summary, created_at')
      .eq('property_id', share.property_id)
      .order('created_at', { ascending: true }),
  ])
  if (photosError) return null

  const photos = await Promise.all((photoRows || []).map(async (photo) => {
    const url = await getSignedPhotoUrl(supabase, photo)
    return { id: photo.id, url, phase: photo.phase, category: photo.category, caption: photo.caption, createdAt: photo.created_at }
  }))

  await supabase.from('share_tokens').update({ last_accessed_at: now }).eq('id', share.id)
  return {
    address: property.address,
    neighborhood: property.neighborhood,
    fieldScore: property.field_score,
    observations: property.observations || [],
    status: property.report_status,
    authorization: authorization ? { decision: authorization.decision, decidedAt: authorization.created_at } : null,
    photos,
    timeline: (timelineRows || []).map((event) => ({
      id: event.id, eventType: event.event_type, status: event.report_status,
      summary: event.summary, createdAt: event.created_at,
    })),
    expiresAt: share.expires_at,
  }
}
