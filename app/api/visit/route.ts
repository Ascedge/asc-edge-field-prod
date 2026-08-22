import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { getOptionalGhlWebhookUrl } from '@/lib/env'
import { readJsonObject, serverError, stringArrayValue, stringValue, uuidValue } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request)
    const propertyId = uuidValue(body.property_id, 'property_id')
    const disposition = stringValue(body.disposition, 'disposition', { required: true, maxLength: 40 })!
    const allowedDispositions = new Set([
      'booked_inspection', 'read_report_not_ready', 'callback', 'wants_info',
      'not_interested', 'not_home', 'hostile',
    ])
    if (!allowedDispositions.has(disposition)) {
      return NextResponse.json({ error: 'Invalid disposition' }, { status: 400 })
    }
    const outcome = disposition === 'booked_inspection'
      ? 'booked'
      : disposition === 'not_home' || disposition === 'hostile' ? 'none' : 'nurture'
    const homeownerGender = stringValue(body.homeowner_gender, 'homeowner_gender', { maxLength: 20 })
    const receptivity = typeof body.receptivity === 'number' ? body.receptivity : 2
    const personality = receptivity >= 3 ? 'great' : receptivity <= 1 ? 'combative' : 'neutral'
    const observations = stringArrayValue(body.observations ?? [], 'observations', 20)
    const repNote = stringValue(body.private_note, 'private_note', { maxLength: 280 })
    const ghlUrl = outcome === 'booked' ? getOptionalGhlWebhookUrl() : null

    const supabase = createSupabaseAdminClient()

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address')
      .eq('id', propertyId)
      .single()
    if (propertyError?.code === 'PGRST116' || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    if (propertyError) throw propertyError

    const { data: visit, error } = await supabase
      .from('visits')
      .insert({
        property_id: propertyId,
        outcome,
        homeowner_gender: homeownerGender,
        personality,
        quick_observations: observations,
        rep_note: repNote,
        disposition,
        notes_locked: true,
        notes_submitted_at: new Date().toISOString(),
        tenant_id: 'gary',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire GHL webhook for a booked inspection (graceful if no URL).
    if (outcome === 'booked') {
      if (ghlUrl) {
        const payload = {
          event: 'inspection_booked',
          visit_id: visit.id,
          property_id: propertyId,
          address: property.address,
          disposition,
          outcome,
          timestamp: new Date().toISOString(),
        }
        try {
          await fetch(ghlUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': `visit:${visit.id}:inspection_booked`,
            },
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
  } catch (error) {
    if (error instanceof Error && /required|UUID|must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
