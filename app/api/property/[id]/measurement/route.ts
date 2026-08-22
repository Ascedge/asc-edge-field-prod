import { NextResponse } from 'next/server'
import { requirePropertyAccess } from '@/lib/auth'
import { serverError, uuidValue } from '@/lib/http'
import { fetchGoogleSolarMeasurement } from '@/lib/google-solar'

export async function POST(_request: Request, context: RouteContext<'/api/property/[id]/measurement'>) {
  try {
    const { id: rawId } = await context.params
    const propertyId = uuidValue(rawId, 'property id')
    const auth = await requirePropertyAccess(propertyId)
    const { data: property, error: propertyError } = await auth.supabase.from('properties')
      .select('latitude, longitude').eq('id', propertyId).single()
    if (propertyError || property?.latitude == null || property?.longitude == null) {
      return NextResponse.json({ error: 'Verify the canonical property coordinates before measuring.' }, { status: 409 })
    }
    const measurement = await fetchGoogleSolarMeasurement(Number(property.latitude), Number(property.longitude))
    if (!measurement) return NextResponse.json({ status: 'fallback_required', message: 'Google Solar coverage is unavailable or insufficient. An authorized staff review is required.' })
    const { data, error } = await auth.supabase.from('property_measurements').insert({
      organization_id: auth.organization_id, property_id: propertyId, source: measurement.source,
      provider_record_id: measurement.providerRecordId, matched_latitude: measurement.matchedLatitude,
      matched_longitude: measurement.matchedLongitude, retrieved_at: measurement.retrievedAt,
      coverage_status: measurement.coverageStatus, confidence: measurement.confidence,
      roof_area_sq_m: measurement.roofAreaSqM, roof_area_sq_ft: measurement.roofAreaSqFt,
      roof_squares: measurement.roofSquares, roof_segments: measurement.roofSegments,
      limitations: measurement.limitations, raw_provider_response: measurement.rawProviderResponse,
      evidence_reference: measurement.evidenceReference, created_by: auth.user.id,
    }).select('id, source, retrieved_at, coverage_status, confidence, roof_squares, limitations').single()
    if (error) throw error
    return NextResponse.json({ measurement: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return serverError(error) }
}
