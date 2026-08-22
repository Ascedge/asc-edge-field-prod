import { NextRequest, NextResponse } from 'next/server'
import { requireFieldContext } from '@/lib/auth'
import { serverError, uuidValue } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: NextRequest, context: RouteContext<'/api/shares/[id]'>) {
  try {
    const { id: rawId } = await context.params
    const shareId = uuidValue(rawId, 'share id')
    const auth = await requireFieldContext()
    const { data, error } = await auth.supabase
      .from('share_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', shareId)
      .eq('organization_id', auth.organization_id)
      .is('revoked_at', null)
      .select('id')
      .single()
    if (error?.code === 'PGRST116' || !data) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return serverError(error)
  }
}
