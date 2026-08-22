import 'server-only'

import { createSupabaseAdminClient, createSupabaseClient } from '@/lib/supabase'
export { decryptShareToken, encryptShareToken, generateShareToken, hashShareToken } from '@/lib/token-crypto'
import { hashShareToken } from '@/lib/token-crypto'
import { getSignedPhotoUrl } from '@/lib/photo-urls'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export type SharedPassport = {
  address: string
  canonicalStreet: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  county: string | null
  latitude: number | null
  longitude: number | null
  neighborhood: string | null
  status: string
  authorization: { decision: string; decidedAt: string } | null
  photos: Array<{ id: string; url: string; phase: string; category: string | null; caption: string | null; createdAt: string }>
  timeline: Array<{ id: string; eventType: string; status: string | null; summary: string; createdAt: string }>
  measurement: { source: string; providerRecordId: string | null; retrievedAt: string; coverageStatus: string; confidence: string; roofSquares: number | null; limitations: string } | null
  expiresAt: string | null
}

export async function resolveShareToken(rawToken: string): Promise<SharedPassport | null> {
  if (!TOKEN_PATTERN.test(rawToken)) return null
  const publicClient = createSupabaseClient()
  const tokenHash = hashShareToken(rawToken)
  const { data, error } = await publicClient.rpc('resolve_public_passport', { submitted_token_hash: tokenHash })
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return null
  const passport = data as Record<string, unknown>
  const photoRows = Array.isArray(passport.photos) ? passport.photos as Array<Record<string, unknown>> : []
  const admin = createSupabaseAdminClient()

  const photos = await Promise.all((photoRows || []).map(async (photo) => {
    const row = { storage_path: photo.storagePath ? String(photo.storagePath) : null, storage_url: photo.storageUrl ? String(photo.storageUrl) : '' }
    const url = await getSignedPhotoUrl(admin, row)
    return { id: String(photo.id), url, phase: String(photo.phase), category: photo.category ? String(photo.category) : null, caption: photo.caption ? String(photo.caption) : null, createdAt: String(photo.createdAt) }
  }))
  const timelineRows = Array.isArray(passport.timeline) ? passport.timeline as Array<Record<string, unknown>> : []
  const authorization = passport.authorization && typeof passport.authorization === 'object' && !Array.isArray(passport.authorization) ? passport.authorization as Record<string, unknown> : null
  const measurement = passport.measurement && typeof passport.measurement === 'object' && !Array.isArray(passport.measurement) ? passport.measurement as Record<string, unknown> : null
  return {
    address: String(passport.address),
    canonicalStreet: passport.canonicalStreet ? String(passport.canonicalStreet) : null,
    city: passport.city ? String(passport.city) : null,
    state: passport.state ? String(passport.state) : null,
    postalCode: passport.postalCode ? String(passport.postalCode) : null,
    county: passport.county ? String(passport.county) : null,
    latitude: passport.latitude == null ? null : Number(passport.latitude),
    longitude: passport.longitude == null ? null : Number(passport.longitude),
    neighborhood: passport.neighborhood ? String(passport.neighborhood) : null,
    status: String(passport.status),
    authorization: authorization ? { decision: String(authorization.decision), decidedAt: String(authorization.decidedAt) } : null,
    photos,
    timeline: (timelineRows || []).map((event) => ({
      id: String(event.id), eventType: String(event.eventType), status: event.status ? String(event.status) : null,
      summary: String(event.summary), createdAt: String(event.createdAt),
    })),
    measurement: measurement ? {
      source: String(measurement.source), providerRecordId: measurement.providerRecordId ? String(measurement.providerRecordId) : null,
      retrievedAt: String(measurement.retrievedAt), coverageStatus: String(measurement.coverageStatus),
      confidence: String(measurement.confidence), roofSquares: measurement.roofSquares == null ? null : Number(measurement.roofSquares),
      limitations: String(measurement.limitations),
    } : null,
    expiresAt: passport.expiresAt ? String(passport.expiresAt) : null,
  }
}
