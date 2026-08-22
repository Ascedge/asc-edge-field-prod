import { NextRequest, NextResponse } from 'next/server'
import { serverError, stringValue, uuidValue } from '@/lib/http'
import { validateImage } from '@/lib/uploads'
import { requirePropertyAccess } from '@/lib/auth'
import { removeFailedEvidenceUpload } from '@/lib/storage-admin'

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
    const auth = await requirePropertyAccess(propertyId)
    const supabase = auth.supabase
    const fileName = `${auth.organization_id}/${propertyId}/${phase}/${crypto.randomUUID()}.${extension}`

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
      .from('property-evidence')
      .upload(fileName, fileValue, {
        contentType: fileValue.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData, error: signedUrlError } = await supabase.storage
      .from('property-evidence')
      .createSignedUrl(fileName, 300)
    if (signedUrlError || !urlData?.signedUrl) {
      await removeFailedEvidenceUpload(fileName)
      throw signedUrlError || new Error('Unable to create signed image URL')
    }

    // Insert into photos table (only columns that exist per instructions)
    const { data: photo, error: insertError } = await supabase
      .from('photos')
      .insert({
        property_id: propertyId,
        organization_id: auth.organization_id,
        uploaded_by: auth.user.id,
        phase,
        storage_path: fileName,
        storage_url: fileName,
        original_filename: fileValue.name.slice(0, 255),
        server_received_at: new Date().toISOString(),
        tenant_id: auth.organization_id,
      })
      .select('id, storage_url')
      .single()

    if (insertError) {
      await removeFailedEvidenceUpload(fileName)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      photo_id: photo.id,
      url: urlData.signedUrl,
    })
  } catch (error) {
    if (error instanceof Error && /required|UUID|JPEG|PNG|WebP|10 MB|empty|contents/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
