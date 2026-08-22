import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { serverError, stringValue, uuidValue } from '@/lib/http'
import { validateImage } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const propertyId = uuidValue(formData.get('property_id'), 'property_id')
    const phase = stringValue(formData.get('phase'), 'phase', { required: true })!
    const fileValue = formData.get('image')

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: 'property_id, phase, and image file are required' }, { status: 400 })
    }

    if (!['pre_knock', 'full_house'].includes(phase)) {
      return NextResponse.json({ error: 'phase must be pre_knock or full_house' }, { status: 400 })
    }

    const { extension } = await validateImage(fileValue)
    const fileName = `${propertyId}/${phase}/${crypto.randomUUID()}.${extension}`

    const supabase = createSupabaseAdminClient()

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single()
    if (propertyError?.code === 'PGRST116' || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    if (propertyError) throw propertyError

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(fileName, fileValue, {
        contentType: fileValue.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('property-photos')
      .getPublicUrl(fileName)

    const storageUrl = urlData.publicUrl

    // Insert into photos table (only columns that exist per instructions)
    const { data: photo, error: insertError } = await supabase
      .from('photos')
      .insert({
        property_id: propertyId,
        phase,
        storage_url: storageUrl,
        tenant_id: 'gary',
      })
      .select('id, storage_url')
      .single()

    if (insertError) {
      await supabase.storage.from('property-photos').remove([fileName])
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      photo_id: photo.id,
      url: storageUrl,
    })
  } catch (error) {
    if (error instanceof Error && /required|UUID|JPEG|PNG|WebP|10 MB|empty|contents/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
