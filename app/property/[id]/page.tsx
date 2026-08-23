

import { getGoogleMapsApiKey } from '@/lib/env'
import { AuthorizationError, requirePropertyAccess } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DamageChecklist from '../../../components/DamageChecklist'
import PreKnockCapture from '../../../components/PreKnockCapture'
import StormReviewHistory from '../../../components/StormReviewHistory'
import LogVisitForm from '../../../components/LogVisitForm'
import HandOffReport from './HandOffReport'
import FullDocumentationCapture from '../../../components/FullDocumentationCapture'
import { getSignedPhotoUrl } from '@/lib/photo-urls'

const ASSUMED_ROOF_AGE = 15; // until real roof_age data exists

export const dynamic = 'force-dynamic'

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let auth
  try {
    auth = await requirePropertyAccess(id)
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) redirect(`/auth/sign-in?next=/property/${id}`)
    if (error instanceof AuthorizationError) redirect('/')
    throw error
  }
  const supabase = auth.supabase
  const googleMapsApiKey = getGoogleMapsApiKey()

  let property
  let error
  try {
    const { data, error: queryError } = await supabase
      .from('properties')
      .select('id, address, neighborhood, field_score, field_note, observations, report_status')
      .eq('id', id)
      .single()
    property = data
    error = queryError
  } catch (e) {
    error = e
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-white mb-2">Property not found</h2>
          <p className="text-white/60">The requested property could not be loaded.</p>
        </div>
      </div>
    );
  }

  const { count: photosCollected } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', property.id)

  const { data: preliminaryRows } = await supabase
    .from('photos')
    .select('id, storage_url, storage_path')
    .eq('property_id', property.id)
    .eq('phase', 'pre_knock')
    .order('created_at', { ascending: true })
  const preliminaryPhotos = await Promise.all((preliminaryRows || []).map(async (photo) => ({
    id: photo.id,
    url: await getSignedPhotoUrl(supabase, photo),
    status: 'uploaded',
  })))

  const { data: authorization } = await supabase
    .from('property_authorizations')
    .select('decision, created_at')
    .eq('property_id', property.id)
    .eq('authorization_type', 'inspection_documentation')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const fullDocumentationAuthorized = authorization?.decision === 'approved'

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white pb-24">
      {/* Header */}
      <header className="bg-[#0a0e1a] border-b border-[#d4af37]/60 py-4 px-6 flex items-center gap-3">
        <img src="/logo.png" alt="ASC EDGE" className="h-8 w-auto" />
        <div>
          <div className="text-[#d4af37] font-bold tracking-[3px] text-2xl leading-none">ASC</div>
          <div className="text-[9px] text-white/70 tracking-widest -mt-0.5">EDGE FIELD</div>
        </div>
      </header>

      <main className="px-6 pt-8 max-w-md mx-auto">
        <div className="mb-8">
          <div className="text-[#d4af37] text-sm tracking-widest mb-1">PROPERTY</div>
          <h1 className="text-3xl leading-tight font-bold text-white">{property.address}</h1>
          {property.neighborhood && (
            <p className="text-white/60 mt-1">{property.neighborhood}</p>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#f0d77f]">
          Report status: {property.report_status.replaceAll('_', ' ')}
        </div>

        {/* Real Google Street View + Satellite imagery (using the provided keys) */}
        <div className="rounded-3xl overflow-hidden mb-6 shadow-2xl shadow-black/60 border border-white/10">
          <img
            src={`https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(property.address)}&key=${googleMapsApiKey}`}
            alt="Street View"
            className="w-full h-auto"
          />
        </div>
        <div className="rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-black/60 border border-white/10">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(property.address)}&zoom=19&size=640x360&maptype=satellite&key=${googleMapsApiKey}`}
            alt="Satellite View"
            className="w-full h-auto"
          />
        </div>

        {property.field_score !== null && (
          <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-8 mb-8 text-center">
            <div className="text-white/60 text-sm mb-2 tracking-widest">FIELD SCORE</div>
            <div className="text-[92px] leading-none font-bold text-[#d4af37] tabular-nums">
              {property.field_score}
            </div>
            <div className="text-xs text-white/40 mt-1">/ 10 • Visible Condition Indicator</div>
          </div>
        )}

        <DamageChecklist propertyId={property.id} initialScore={property.field_score || 8.5} initialObservations={property.observations || []} />

        <PreKnockCapture propertyId={property.id} initialPhotos={preliminaryPhotos} />

        <FullDocumentationCapture propertyId={property.id} authorized={fullDocumentationAuthorized} />

        {property.field_note && (
          <div className="bg-[#111827]/70 border border-white/10 rounded-2xl p-6">
            <div className="uppercase text-white/50 text-xs tracking-widest mb-3">Field Note</div>
            <p className="text-white/90 leading-relaxed">{property.field_note}</p>
          </div>
        )}

        {/* Cumulative Environmental Exposure */}
        <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-8 mb-8">
          <div className="uppercase text-[#d4af37] text-xs tracking-widest mb-4">CUMULATIVE ENVIRONMENTAL EXPOSURE</div>
          <div className="text-white/80 space-y-4">
            <div>
              <div className="font-mono text-xs text-white/50">Regional estimate — Houston-area climate × roof age. Property-specific data pending full analysis.</div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>~{Math.round(ASSUMED_ROOF_AGE * 101)} days over 90°F</div>
                <div>~{Math.round(ASSUMED_ROOF_AGE * 4)} nights ≤ freezing</div>
                <div>~{Math.round(ASSUMED_ROOF_AGE * 100)} rain days</div>
                <div>~5 months/year at UV index 7+</div>
              </div>
            </div>
            <div className="text-[#d4af37] text-sm border-t border-white/10 pt-4">
              {ASSUMED_ROOF_AGE} years of accumulated Houston weather stress 🌧️ accelerates shingle aging and hidden damage.
            </div>
          </div>
        </div>

        <StormReviewHistory county="Harris" />

        <LogVisitForm 
          propertyId={property.id} 
          photosCollected={photosCollected ?? 0}
        />

        <HandOffReport propertyId={property.id} />

        <a href={`/property/${property.id}/present`} className="block mt-8 w-full bg-[#d4af37] hover:bg-[#e5c15c] text-[#0a0e1a] font-bold py-5 rounded-3xl text-center tracking-widest active:scale-[0.985]">
          → HOMEOWNER ANSWERED — START CAROUSEL
        </a>

        <div className="mt-12 text-center text-xs text-white/30">
          Secure QR hand-off • authorization-gated documentation • immutable timeline
        </div>
      </main>
    </div>
  )
}
