import { createSupabaseAdminClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Property {
  id: string;
  address: string;
  neighborhood?: string | null;
  field_score?: number | null;
  observations?: string[] | null;
}

interface Photo {
  id: string;
  storage_url: string;
  phase: string;
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, address, neighborhood, field_score, observations, roof_age')
    .eq('id', id)
    .single();

  if (propError || !property) {
    notFound();
  }

  const { data: photosData } = await supabase
    .from('photos')
    .select('id, storage_url, phase')
    .eq('property_id', id)
    .order('created_at', { ascending: true });
  const photos: Photo[] = photosData || [];

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(property.address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(property.address)}&zoom=19&size=640x360&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white pb-16">
      {/* Header */}
      <header className="bg-black border-b border-[#d4af37]/60 py-6 px-6 flex items-center gap-4">
        <img src="/logo.png" alt="ASC EDGE" className="h-10 w-auto" />
        <div>
          <div className="text-[#d4af37] font-bold tracking-[4px] text-3xl">ASC</div>
          <div className="text-[10px] text-white/60 -mt-1 tracking-[2px]">EDGE • ROOF ASSET DOCUMENTATION</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10">
        <div className="text-center mb-10">
          <div className="inline-block bg-[#d4af37] text-[#0a0e1a] text-xs font-bold tracking-widest px-6 py-1 rounded-full mb-4">OFFICIAL RECORD</div>
          <h1 className="text-4xl font-bold leading-tight text-white mb-2">{property.address}</h1>
          {property.neighborhood && (
            <p className="text-white/60 text-lg">{property.neighborhood}</p>
          )}
        </div>

        {/* Imagery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={streetViewUrl} alt="Street View" className="w-full h-auto" />
            <div className="bg-black/80 text-[10px] text-center py-2 text-white/50">STREET VIEW</div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={satelliteUrl} alt="Satellite" className="w-full h-auto" />
            <div className="bg-black/80 text-[10px] text-center py-2 text-white/50">SATELLITE / OVERHEAD</div>
          </div>
        </div>

        {/* Score */}
        {property.field_score !== null && (
          <div className="bg-gradient-to-b from-[#111827] to-black border border-[#d4af37]/40 rounded-3xl p-10 text-center mb-12 shadow-inner">
            <div className="text-[#d4af37] text-sm tracking-[3px] mb-3">ROOF CONDITION SCORE</div>
            <div className="text-[120px] leading-none font-bold text-[#d4af37] tabular-nums mb-2">
              {property.field_score}
            </div>
            <div className="text-white/70 text-lg">/ 10 — Based on visible exterior indicators</div>
          </div>
        )}

        {/* Documented Findings */}
        {property.observations && property.observations.length > 0 && (
          <div className="mb-12">
            <div className="uppercase text-[#d4af37] text-xs tracking-widest mb-6 border-b border-[#d4af37]/30 pb-2">DOCUMENTED FINDINGS</div>
            <ul className="space-y-4">
              {(property.observations || []).map((obs: string, i: number) => (
                <li key={i} className="flex gap-4 bg-[#111827]/70 border border-white/10 rounded-2xl p-5">
                  <div className="text-[#d4af37] text-2xl font-light">•</div>
                  <div className="text-white/90 text-[17px]">{obs}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-16">
            <div className="uppercase text-[#d4af37] text-xs tracking-widest mb-6 border-b border-[#d4af37]/30 pb-2">FIELD PHOTOS</div>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="rounded-3xl overflow-hidden border border-white/10 aspect-video bg-black">
                  <img src={photo.storage_url} alt="Field photo" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why This Matters */}
        <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-10 mb-12">
          <div className="uppercase text-[#d4af37] text-xs tracking-widest mb-6">WHY THIS MATTERS</div>
          <div className="space-y-8 text-white/80 leading-relaxed text-[15px]">
            <p>An undocumented roof is a hidden liability. Insurance carriers increasingly treat undocumented repairs or damage as <span className="text-white">“wear and tear”</span>, denying claims even when a storm caused the issue.</p>
            
            <p>This report creates a timestamped, photographic baseline. It protects both the homeowner and future buyers by documenting the roof’s condition at the time of inspection.</p>

            <p className="text-[#d4af37] font-medium">Texas Department of Insurance and major carriers have published guidance on claim disputes involving undocumented roofs. A clear record strengthens your position in any future adjustment.</p>
          </div>
        </div>

        {/* Cumulative Environmental Exposure */}
        <div className="mb-12">
          <div className="uppercase text-[#d4af37] text-xs tracking-widest mb-4">CUMULATIVE ENVIRONMENTAL EXPOSURE</div>
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 text-white/80">
            <div className="font-mono text-xs text-white/50 mb-4">Regional estimate — Houston-area climate × roof age. Property-specific data pending full analysis.</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>~{Math.round((property.roof_age || 15) * 101)} days over 90°F</div>
              <div>~{Math.round((property.roof_age || 15) * 4)} nights ≤ freezing</div>
              <div>~{Math.round((property.roof_age || 15) * 100)} rain days</div>
              <div>~5 months/year at UV index 7+</div>
            </div>
            <div className="mt-6 text-[#d4af37] text-sm pt-4 border-t border-white/10">
              {(property.roof_age || 15)} years of accumulated Houston weather stress accelerates shingle aging and hidden damage.
            </div>
          </div>
        </div>

        {/* Thermal IR Second Opinion */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="uppercase text-[#d4af37] text-xs tracking-widest">AVAILABLE UPGRADE</div>
              <div className="text-2xl font-semibold text-white mt-1">Thermal Infrared Second Opinion</div>
            </div>
            <div className="bg-[#d4af37]/10 text-[#d4af37] text-xs px-5 py-2 rounded-full font-medium">+$650 Service</div>
          </div>
          <div className="bg-black border border-white/10 rounded-3xl p-2">
            <img 
              src="https://placehold.co/800x400/111827/d4af37?text=THERMAL+IR+SAMPLE+%28EXAMPLE%29" 
              alt="Thermal IR Sample" 
              className="rounded-2xl w-full"
            />
          </div>
          <p className="text-center text-xs text-white/40 mt-4">Example thermal image — actual drone/FLIR capture available as paid add-on service</p>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-12 text-center text-xs text-white/40">
          <div className="font-mono tracking-widest text-[#d4af37] mb-2">ASC EDGE FIELD SERVICES</div>
          <div>281-357-9090 • Professional Roof Documentation • Houston Metro</div>
          <div className="mt-8 text-[10px]">This is an independent third-party documentation record. Not affiliated with any insurance carrier.</div>
        </footer>
      </main>
    </div>
  );
}
