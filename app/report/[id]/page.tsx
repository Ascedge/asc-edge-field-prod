import { notFound, redirect } from 'next/navigation'
import { AuthorizationError, requirePropertyAccess } from '@/lib/auth'
import { getSignedPhotoUrl } from '@/lib/photo-urls'
import { PASSPORT_SOURCES } from '@/lib/passport-sources'
import PassportExperience from '@/components/PassportExperience'
import ReportOpenTracker from '@/components/ReportOpenTracker'

export const dynamic = 'force-dynamic'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let auth
  try {
    auth = await requirePropertyAccess(id)
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) redirect(`/auth/sign-in?next=/report/${id}`)
    if (error instanceof AuthorizationError) notFound()
    throw error
  }
  const supabase = auth.supabase
  const { data: property, error } = await supabase.from('properties')
    .select('id, address, neighborhood, field_score, observations, roof_age, report_status, report_version')
    .eq('id', id).single()
  if (error || !property) notFound()

  const [{ data: photoRows }, { data: timelineRows }, { data: characteristic }, { data: documentRows }, { data: profile }] = await Promise.all([
    supabase.from('photos').select('id, storage_url, storage_path, phase, category, caption, created_at').eq('property_id', id).order('created_at'),
    supabase.from('property_timeline_events').select('id, summary, created_at, report_status').eq('property_id', id).order('created_at'),
    supabase.from('property_characteristics').select('roof_covering, roof_age_years, footprint_sqft, roof_pitch_multiplier, waste_factor').eq('property_id', id).maybeSingle(),
    supabase.from('property_documents').select('id, title, document_type, year, version').eq('property_id', id).order('created_at'),
    supabase.from('profiles').select('display_name').eq('user_id', auth.user.id).maybeSingle(),
  ])
  const photos = await Promise.all((photoRows || []).map(async (photo) => ({
    id: photo.id, url: await getSignedPhotoUrl(supabase, photo), phase: photo.phase,
    category: photo.category, caption: photo.caption, createdAt: photo.created_at,
  })))

  return <>
    <ReportOpenTracker propertyId={id} />
    <PassportExperience
      property={{
        address: property.address, neighborhood: property.neighborhood, fieldScore: property.field_score,
        observations: property.observations || [], roofAge: characteristic?.roof_age_years ?? property.roof_age,
        status: property.report_status, reportVersion: property.report_version,
        inspectionDate: timelineRows?.[0]?.created_at || null, representative: profile?.display_name || auth.user.email,
        roofCovering: characteristic?.roof_covering, footprintSqft: characteristic?.footprint_sqft,
        pitchMultiplier: characteristic?.roof_pitch_multiplier, wasteFactor: characteristic?.waste_factor,
      }}
      photos={photos}
      timeline={(timelineRows || []).map((item) => ({ id: item.id, summary: item.summary, createdAt: item.created_at, status: item.report_status }))}
      documents={documentRows || []}
      sources={PASSPORT_SOURCES}
    />
  </>
}
