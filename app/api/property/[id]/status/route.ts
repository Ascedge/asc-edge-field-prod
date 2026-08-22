import { NextRequest, NextResponse } from 'next/server'
import { requirePropertyAccess } from '@/lib/auth'
import { serverError, uuidValue } from '@/lib/http'

export async function POST(_request: NextRequest, context: RouteContext<'/api/property/[id]/status'>) {
  try {
    const { id: rawId } = await context.params
    const propertyId = uuidValue(rawId, 'property id')
    const auth = await requirePropertyAccess(propertyId)
    const { count, error: countError } = await auth.supabase.from('photos')
      .select('id', { count: 'exact', head: true }).eq('property_id', propertyId).eq('phase', 'full_house')
    if (countError) throw countError
    if ((count || 0) < 20) return NextResponse.json({ error: 'At least 20 full documentation images are required before completion' }, { status: 409 })

    const { error: updateError } = await auth.supabase.from('properties')
      .update({ report_status: 'documentation_complete' }).eq('id', propertyId)
    if (updateError) throw updateError
    const { error: timelineError } = await auth.supabase.from('property_timeline_events').insert({
      organization_id: auth.organization_id, property_id: propertyId, event_type: 'documentation_completed',
      report_status: 'documentation_complete', actor_user_id: auth.user.id, source_type: 'property',
      source_id: propertyId, summary: 'Full photographic documentation marked complete.', metadata: { full_photo_count: count },
    })
    if (timelineError) throw timelineError
    return NextResponse.json({ report_status: 'documentation_complete', full_photo_count: count })
  } catch (error) {
    return serverError(error)
  }
}
