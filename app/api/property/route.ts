import { NextRequest, NextResponse } from 'next/server'
import { readJsonObject, serverError, stringValue } from '@/lib/http'
import { requireFieldContext } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request)
    const address = stringValue(body.address, 'address', { required: true, maxLength: 240 })!

    // Normalize address (lowercase, trim, collapse whitespace)
    const normalizedAddress = address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')

    const auth = await requireFieldContext()
    const supabase = auth.supabase

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

    // Partial match fallback (e.g. '1802 Orchard' matches seeded record)
    const partial = `%${normalizedAddress}%`
    const { data: partialMatch } = await supabase
      .from('properties')
      .select('id, address, normalized_address, tenant_id, claim_status, neighborhood, field_score, field_note')
      .ilike('address', partial)
      .eq('organization_id', auth.organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (partialMatch) {
      return NextResponse.json({ property: partialMatch })
    }

    if (findError && findError.code !== 'PGRST116') {
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    // Insert new — DB is already seeded with 137 properties; no static seed import needed
    const { data: inserted, error: insertError } = await supabase
      .from('properties')
      .insert({
        address,
        normalized_address: normalizedAddress,
        organization_id: auth.organization_id,
        tenant_id: auth.organization_id,
        claim_status: 'unclaimed',
        neighborhood: null,
        field_score: null,
        field_note: null,
      })
      .select('id, address, normalized_address, tenant_id, claim_status, neighborhood, field_score, field_note')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ property: inserted })
  } catch (error) {
    if (error instanceof Error && /required|must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
