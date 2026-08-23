import { NextRequest, NextResponse } from 'next/server'
import { serverError, stringValue, uuidValue } from '@/lib/http'
import { validateImage } from '@/lib/uploads'
import { AuthorizationError, requirePropertyAccess } from '@/lib/auth'
import { removeFailedEvidenceUpload } from '@/lib/storage-admin'
import { createHash } from 'node:crypto'

const PHOTO_CATEGORIES = new Set([
  'front_elevation', 'rear_elevation', 'left_elevation', 'right_elevation', 'roof_planes',
  'ridges_hips', 'valleys', 'flashing', 'chimneys', 'vents_penetrations', 'gutters_drainage',
  'trees_environment', 'visible_maintenance', 'closer_inspection', 'supporting_conditions',
])

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const propertyId = uuidValue(formData.get('property_id'), 'property_id')
    const phase = stringValue(formData.get('phase'), 'phase', { required: true })!
    const category = stringValue(formData.get('category'), 'category', { required: true, maxLength: 80 })!
    const caption = stringValue(formData.get('caption'), 'caption', { maxLength: 500 })
    const fileValue = formData.get('image')

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: 'property_id, phase, and image file are required' }, { status: 400 })
    }

    if (!['pre_knock', 'full_house'].includes(phase)) {
      return NextResponse.json({ error: 'phase must be pre_knock or full_house' }, { status: 400 })
    }
    if (!PHOTO_CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Select a valid photo category' }, { status: 400 })
    }

    const { extension } = await validateImage(fileValue)
    const fileHash = createHash('sha256').update(Buffer.from(await fileValue.arrayBuffer())).digest('hex')
    const auth = await requirePropertyAccess(propertyId)
    const supabase = auth.supabase
    const fileName = `${auth.organization_id}/${propertyId}/${phase}/${crypto.randomUUID()}.${extension}`

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, report_status, report_version')
      .eq('id', propertyId)
      .single()
    if (propertyError?.code === 'PGRST116' || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    if (propertyError) throw propertyError

    if (phase === 'full_house') {
      const { data: authorization } = await supabase
        .from('property_authorizations')
        .select('id, decision')
        .eq('property_id', propertyId)
        .eq('authorization_type', 'inspection_documentation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (authorization?.decision !== 'approved') {
        return NextResponse.json({ error: 'Homeowner authorization is required before full documentation' }, { status: 403 })
      }
    }

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
    const uploadEventId = crypto.randomUUID()
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
        category,
        caption,
        file_hash: fileHash,
        report_version: property.report_version,
        upload_event_id: uploadEventId,
        tenant_id: auth.organization_id,
      })
      .select('id, storage_url')
      .single()

    if (insertError) {
      await removeFailedEvidenceUpload(fileName)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const nextStatus = phase === 'pre_knock'
      ? 'awaiting_homeowner_authorization'
      : 'documentation_in_progress'
    const { error: statusError } = await supabase
      .from('properties')
      .update({ report_status: nextStatus })
      .eq('id', propertyId)
    if (statusError) throw statusError

    const { error: timelineError } = await supabase.from('property_timeline_events').insert({
      organization_id: auth.organization_id,
      property_id: propertyId,
      event_type: 'photo_uploaded',
      report_status: nextStatus,
      actor_user_id: auth.user.id,
      source_type: 'photo',
      source_id: photo.id,
      summary: phase === 'pre_knock' ? 'Preliminary exterior documentation added.' : 'Full documentation image added.',
      metadata: { category, caption, phase, file_hash: fileHash, upload_event_id: uploadEventId },
    })
    if (timelineError) throw timelineError

    return NextResponse.json({
      photo_id: photo.id,
      url: urlData.signedUrl,
      category,
      caption,
      report_status: nextStatus,
    })
  } catch (error) {
    if (error instanceof AuthorizationError) return serverError(error)
    if (error instanceof Error && /required|UUID|JPEG|PNG|WebP|10 MB|empty|contents/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverError(error)
  }
}
