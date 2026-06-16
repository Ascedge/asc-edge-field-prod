import { createSupabaseAdminClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import DamageChecklist from '../../../components/DamageChecklist'
import PreKnockCapture from '../../../components/PreKnockCapture'

export const dynamic = 'force-dynamic'

interface Property {
  id: string
  address: string
  neighborhood?: string | null
  field_score?: number | null
  field_note?: string | null
  observations?: string[] | null
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseAdminClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, address, neighborhood, field_score, field_note, observations, roof_age')
    .eq('id', id)
    .single()

  if (error || !property) {
    notFound()
  }

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

        {/* Real Google Street View + Satellite imagery (using the provided keys) */}
        <div className="rounded-3xl overflow-hidden mb-6 shadow-2xl shadow-black/60 border border-white/10">
          <img
            src={`https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(property.address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            alt="Street View"
            className="w-full h-auto"
          />
        </div>
        <div className="rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-black/60 border border-white/10">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(property.address)}&zoom=19&size=640x360&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
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
            <div className="text-xs text-white/40 mt-1">/ 10 • Insurance Likelihood</div>
          </div>
        )}

        <DamageChecklist propertyId={property.id} initialScore={property.field_score || 8.5} initialObservations={property.observations || []} />

        <PreKnockCapture propertyId={property.id} />

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
                <div>~{Math.round((property.roof_age || 15) * 101)} days over 90°F</div>
                <div>~{Math.round((property.roof_age || 15) * 4)} nights ≤ freezing</div>
                <div>~{Math.round((property.roof_age || 15) * 100)} rain days</div>
                <div>~5 months/year at UV index 7+</div>
              </div>
            </div>
            <div className="text-[#d4af37] text-sm border-t border-white/10 pt-4">
              {(property.roof_age || 15)} years of accumulated Houston weather stress 🌧️ accelerates shingle aging and hidden damage.
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-white/30">
          Full Property Intel coming in next task
        </div>
      </main>
    </div>
  )
}
