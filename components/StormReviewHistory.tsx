'use server';

import { createSupabaseAdminClient } from '@/lib/supabase';

type StormEvent = {
  id: string;
  event_date: string;
  event_type: string;
  county: string;
  wind_mph_min: number | null;
  wind_mph_max: number | null;
  hail_inches: number | null;
  narrative: string | null;
  severity_score: number | null;
  source: string | null;
};

function severityTheme(score: number | null) {
  const s = score ?? 0;
  if (s >= 8) return { ring: 'border-l-red-500', badge: 'bg-red-500/15 text-red-300' };
  if (s >= 6) return { ring: 'border-l-orange-500', badge: 'bg-orange-500/15 text-orange-300' };
  return { ring: 'border-l-amber-400', badge: 'bg-amber-400/15 text-amber-200' };
}

function magnitudeLine(e: StormEvent) {
  const parts: string[] = [];
  if (e.wind_mph_min && e.wind_mph_max) parts.push(`${e.wind_mph_min}–${e.wind_mph_max} mph`);
  else if (e.wind_mph_max) parts.push(`${e.wind_mph_max} mph`);
  if (e.hail_inches) parts.push(`${e.hail_inches}" hail`);
  return parts.join(' · ');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function StormCard({ event, mostRecent }: { event: StormEvent; mostRecent?: boolean }) {
  const t = severityTheme(event.severity_score);
  const mag = magnitudeLine(event);
  return (
    <div className={`rounded-xl border border-white/5 border-l-4 ${t.ring} bg-white/[0.03] p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {mostRecent && (
            <span className="mb-1 inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              MOST RECENT
            </span>
          )}
          <h4 className="text-base font-semibold text-white">{event.event_type}</h4>
          <p className="text-xs text-white/50">{formatDate(event.event_date)}</p>
        </div>
        {event.severity_score != null && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${t.badge}`}>
            Severity {event.severity_score}/10
          </span>
        )}
      </div>
      {mag && <p className="mt-2 text-sm font-medium text-amber-300/90">{mag}</p>}
      {event.narrative && <p className="mt-2 text-sm leading-relaxed text-white/70 line-clamp-3">{event.narrative}</p>}
      <div className="mt-3 text-[10px] text-white/30">Source: NOAA NCEI</div>
    </div>
  );
}

export default async function StormReviewHistory({ county = 'Harris' }: { county?: string }) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('storm_events')
    .select('*')
    .eq('county', county.toUpperCase())
    .order('event_date', { ascending: false })
    .limit(8);

  const events = (data ?? []) as StormEvent[];

  return (
    <section className="mb-12">
      <div className="uppercase text-[#d4af37] text-xs tracking-widest mb-4">STORM REVIEW HISTORY</div>
      <p className="text-xs text-white/50 mb-6">Storm events recorded in {county} County, Texas (NOAA NCEI database).</p>
      
      {events.length === 0 ? (
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 text-center text-white/40">
          No storm records found for this county yet. Seed script completed but returned 0 matching events for the filter.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, i) => (
            <StormCard key={event.id} event={event} mostRecent={i === 0} />
          ))}
        </div>
      )}

      <p className="mt-6 text-[10px] text-white/30 text-center">
        Source: NOAA NCEI Storm Events Database. Severity is an ASC Edge estimate derived from reported magnitude.
      </p>
    </section>
  );
}
