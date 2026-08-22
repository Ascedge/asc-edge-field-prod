import 'server-only'
import { getGoogleMapsApiKey } from '@/lib/env'

const SQ_METERS_TO_SQ_FEET = 10.7639104167

export type SolarMeasurement = {
  source: 'google_solar'
  providerRecordId: string | null
  matchedLatitude: number
  matchedLongitude: number
  retrievedAt: string
  coverageStatus: string
  confidence: string
  roofAreaSqM: number
  roofAreaSqFt: number
  roofSquares: number
  roofSegments: unknown[]
  limitations: string
  rawProviderResponse: unknown
  evidenceReference: string | null
}

export async function fetchGoogleSolarMeasurement(latitude: number, longitude: number): Promise<SolarMeasurement | null> {
  const url = new URL('https://solar.googleapis.com/v1/buildingInsights:findClosest')
  url.searchParams.set('location.latitude', String(latitude))
  url.searchParams.set('location.longitude', String(longitude))
  url.searchParams.set('requiredQuality', 'MEDIUM')
  url.searchParams.set('key', getGoogleMapsApiKey())
  const response = await fetch(url, { cache: 'no-store' })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Google Solar measurement failed with status ${response.status}`)
  const payload = await response.json() as Record<string, unknown>
  const solarPotential = payload.solarPotential as { wholeRoofStats?: { areaMeters2?: number }; roofSegmentStats?: unknown[] } | undefined
  const center = payload.center as { latitude?: number; longitude?: number } | undefined
  const roofAreaSqM = Number(solarPotential?.wholeRoofStats?.areaMeters2)
  if (!Number.isFinite(roofAreaSqM) || roofAreaSqM <= 0 || center?.latitude == null || center?.longitude == null) return null
  const roofAreaSqFt = roofAreaSqM * SQ_METERS_TO_SQ_FEET
  return {
    source: 'google_solar', providerRecordId: typeof payload.name === 'string' ? payload.name : null,
    matchedLatitude: center.latitude, matchedLongitude: center.longitude, retrievedAt: new Date().toISOString(),
    coverageStatus: 'covered', confidence: String(payload.imageryQuality || 'UNKNOWN').toLowerCase(),
    roofAreaSqM, roofAreaSqFt, roofSquares: roofAreaSqFt / 100,
    roofSegments: solarPotential?.roofSegmentStats || [],
    limitations: 'Preliminary measurement—field verification required. Provider imagery and modeled roof geometry may omit recent changes or detached structures.',
    rawProviderResponse: payload,
    evidenceReference: typeof payload.name === 'string' ? payload.name : null,
  }
}
