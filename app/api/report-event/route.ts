import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      property_id,
      event_type,
      slide_index,
      cta,
      variant = 'A',
      visit_id = null,
    } = body

    if (!property_id || !event_type) {
      return NextResponse.json({ error: 'property_id and event_type are required' }, { status: 400 })
    }

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
  } catch (err: any) {
    console.error('report-event API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
