import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { numberValue, readJsonObject, serverError, stringValue, uuidValue } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request)
    const property_id = uuidValue(body.property_id, 'property_id')
    const event_type = stringValue(body.event_type, 'event_type', { required: true, maxLength: 40 })!
    if (!['slide_view', 'slide_cta', 'report_open', 'baseline_view'].includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }
    const slide_index = body.slide_index == null ? null : numberValue(body.slide_index, 'slide_index', 1, 100)
    const cta = stringValue(body.cta, 'cta', { maxLength: 40 })
    if (cta && !['advance', 'decline'].includes(cta)) {
      return NextResponse.json({ error: 'Invalid cta' }, { status: 400 })
    }
    const variant = stringValue(body.variant ?? 'A', 'variant', { required: true, maxLength: 20 })!
    const visit_id = body.visit_id == null ? null : uuidValue(body.visit_id, 'visit_id')

    const supabase = createSupabaseAdminClient()

    const { error } = await supabase
      .from('report_events')
      .insert({
        property_id,
        visit_id,
        event_type,
        slide_index,
        cta,
        variant,
        tenant_id: 'gary',
      })

    if (error) {
      console.error('report_events insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('report-event API error:', error)
    if (error instanceof Error && /required|UUID|must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
