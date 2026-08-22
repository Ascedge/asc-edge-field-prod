import { NextRequest, NextResponse } from 'next/server'
import { serverError, uuidValue } from '@/lib/http'
import { requirePropertyAccess } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, context: RouteContext<'/api/property/[id]'>) {
  try {
    const { id: rawId } = await context.params
    const id = uuidValue(rawId, 'property id')
    const { supabase } = await requirePropertyAccess(id)
    const { data, error } = await supabase
      .from('properties')
      .select('id, address, neighborhood, field_score, observations')
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116' || !data) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    if (error) throw error

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('valid UUID')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
