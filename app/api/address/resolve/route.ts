import { NextRequest, NextResponse } from 'next/server'
import { requireFieldContext } from '@/lib/auth'
import { resolveCanonicalAddress } from '@/lib/address-resolution'
import { readJsonObject, serverError, stringValue } from '@/lib/http'

export async function POST(request: NextRequest) {
  try {
    await requireFieldContext()
    const body = await readJsonObject(request)
    const query = stringValue(body.address, 'address', { required: true, maxLength: 240 })!
    const address = await resolveCanonicalAddress(query)
    return NextResponse.json({ address }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof Error && /address|rooftop|property identity/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
