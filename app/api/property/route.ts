import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { bayOaksSeed } from '@/data/bay-oaks-seed'

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

    // Find existing
    let { data: existing, error: findError } = await supabase
      .from('properties')
      .select('id, address, normalized_address, tenant_id, claim_status')
      .eq('normalized_address', normalizedAddress)
      .single()

    if (existing) {
      return NextResponse.json({ property: existing })
    }

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    // Insert new with seed data if available
    const seedData = bayOaksSeed.find(s => s.normalized_address === normalizedAddress)

    const { data: inserted, error: insertError } = await supabase
      .from('properties')
      .insert({
        address,
        normalized_address: normalizedAddress,
        tenant_id: 'gary',
        claim_status: 'unclaimed',
        neighborhood: seedData?.neighborhood || null,
        field_score: seedData?.field_score || null,
        field_note: seedData?.field_note || null,
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
