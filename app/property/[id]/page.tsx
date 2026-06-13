import { createSupabaseAdminClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

interface Property {
  id: string
  address: string
  neighborhood?: string | null
  field_score?: number | null
  field_note?: string | null
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseAdminClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, address, neighborhood, field_score, field_note')
    .eq('id', params.id)
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

        {property.field_score !== null && (
          <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-8 mb-8 text-center">
            <div className="text-white/60 text-sm mb-2 tracking-widest">FIELD SCORE</div>
            <div className="text-[92px] leading-none font-bold text-[#d4af37] tabular-nums">
              {property.field_score}
            </div>
            <div className="text-xs text-white/40 mt-1">/ 10 • Insurance Likelihood</div>
          </div>
        )}

        {property.field_note && (
          <div className="bg-[#111827]/70 border border-white/10 rounded-2xl p-6">
            <div className="uppercase text-white/50 text-xs tracking-widest mb-3">Field Note</div>
            <p className="text-white/90 leading-relaxed">{property.field_note}</p>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-white/30">
          Full Property Intel coming in next task
        </div>
      </main>
    </div>
  )
}
