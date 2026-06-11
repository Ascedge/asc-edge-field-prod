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

    // Fire GHL webhook if appointment (graceful if no URL)
    if (outcome === 'appointment') {
      const ghlUrl = process.env.GHL_WEBHOOK_URL
      if (ghlUrl) {
        const payload = {
          property_id,
          rep_id,
          timestamp: new Date().toISOString(),
        }
        try {
          await fetch(ghlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        } catch (webhookErr) {
          console.error('GHL webhook failed (non-blocking):', webhookErr)
        }
      } else {
        console.log('GHL_WEBHOOK_URL not set - skipping webhook')
      }
    }

    return NextResponse.json({ visit_id: visit.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
