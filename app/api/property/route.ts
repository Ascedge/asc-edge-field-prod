import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { readJsonObject, serverError, stringValue } from '@/lib/http'
import { requireFieldContext } from '@/lib/auth'
import { normalizeCanonicalAddress, resolveCanonicalAddress } from '@/lib/address-resolution'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request)
    const addressInput = stringValue(body.address, 'address', { required: true, maxLength: 240 })!
    if (body.confirmed !== true) return NextResponse.json({ error: 'Confirm this is the correct property before creating it.' }, { status: 400 })

    const auth = await requireFieldContext()
    const supabase = auth.supabase
    const canonical = await resolveCanonicalAddress(addressInput)
    const submittedPlaceId = stringValue(body.placeId, 'placeId', { required: true, maxLength: 240 })!
    if (submittedPlaceId !== canonical.placeId) return NextResponse.json({ error: 'The confirmed address changed. Verify the property again.' }, { status: 409 })
    const normalizedAddress = normalizeCanonicalAddress(canonical)

    // Exact match first
    const { data: existing, error: findError } = await supabase
      .from('properties')
      .select('id, address, normalized_address, tenant_id, claim_status, neighborhood, field_score, field_note')
      .eq('normalized_address', normalizedAddress)
      .eq('organization_id', auth.organization_id)
      .single()

    if (existing) {
      return NextResponse.json({ property: existing })
    }

    if (findError && findError.code !== 'PGRST116') {
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    const propertyId = randomUUID()
    const { error: insertError } = await supabase
      .from('properties')
      .insert({
        id: propertyId,
        address: canonical.formattedAddress,
        normalized_address: normalizedAddress,
        organization_id: auth.organization_id,
        tenant_id: auth.organization_id,
        created_by: auth.user.id,
        canonical_street: canonical.canonicalStreet,
        city: canonical.city,
        state: canonical.state,
        postal_code: canonical.postalCode,
        county: canonical.county,
        latitude: canonical.latitude,
        longitude: canonical.longitude,
        canonical_place_id: canonical.placeId,
        address_verification_source: 'Google Geocoding',
        address_verified_at: new Date().toISOString(),
        claim_status: 'unclaimed',
        neighborhood: canonical.neighborhood,
        field_score: null,
        field_note: null,
      })

    if (insertError) {
      if (insertError.code === '23505') return NextResponse.json({ error: 'This exact property already exists in your organization.' }, { status: 409 })
      if (insertError.code === '42501') return NextResponse.json({ error: 'Your active organization membership does not permit property creation.' }, { status: 403 })
      throw insertError
    }
    const { data: created, error: readError } = await supabase.from('properties')
      .select('id, address, normalized_address, tenant_id, claim_status, neighborhood, field_score, field_note')
      .eq('id', propertyId).single()
    if (readError || !created) throw readError || new Error('Created property could not be reopened')
    return NextResponse.json({ property: created })
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
