import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Normalize address (lowercase, trim, collapse whitespace)
    const normalizedAddress = address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')

    const supabase = createSupabaseAdminClient()

    // Exact match first
    let { data: existing, error: findError } = await supabase
      .from('properties')
      .select('id, address, normalized_address, tenant_id, claim_status, neighborhood, field_score, field_note')
      .eq('normalized_address', normalizedAddress)
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
        tenant_id: 'gary',
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
