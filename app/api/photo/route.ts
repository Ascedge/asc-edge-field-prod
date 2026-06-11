import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const propertyId = formData.get('property_id') as string
    const phase = formData.get('phase') as string
    const file = formData.get('image') as File | null

    if (!propertyId || !phase || !file) {
      return NextResponse.json({ error: 'property_id, phase, and image file are required' }, { status: 400 })
    }

    if (!['pre_knock', 'full_house'].includes(phase)) {
      return NextResponse.json({ error: 'phase must be pre_knock or full_house' }, { status: 400 })
    }

    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${propertyId}/${phase}/${timestamp}.${fileExt}`

    const supabase = createSupabaseAdminClient()

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(fileName, file, {
        contentType: file.type || 'image/jpeg',
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
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      photo_id: photo.id,
      url: storageUrl,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
