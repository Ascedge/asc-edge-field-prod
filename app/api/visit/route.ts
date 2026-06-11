import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      property_id,
      rep_id,
      outcome,
      homeowner_gender = null,
      receptivity,
      observations = [],
      private_note,
      photos_collected = 0,
    } = body

    if (!property_id || !outcome) {
      return NextResponse.json({ error: 'property_id and outcome are required' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: visit, error } = await supabase
      .from('visits')
      .insert({
        property_id,
        rep_id,
        outcome,
        homeowner_gender,
        receptivity,
        observations,
        private_note,
        photos_collected,
        tenant_id: 'gary',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ visit_id: visit.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
