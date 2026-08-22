import { notFound } from 'next/navigation'
import { resolveShareToken } from '@/lib/share-tokens'

export const dynamic = 'force-dynamic'

export default async function SharedPassportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const passport = await resolveShareToken(token)
  if (!passport) notFound()

  return (
    <main className="min-h-screen bg-[#0a0e1a] px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE ROOF PASSPORT</div>
        <div className="mt-6 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs tracking-widest text-amber-200">
          PRELIMINARY EXTERIOR DOCUMENTATION
        </div>
        <h1 className="mt-5 text-4xl font-bold">{passport.address}</h1>
        {passport.neighborhood && <p className="mt-2 text-white/60">{passport.neighborhood}</p>}
        <p className="mt-8 max-w-xl leading-relaxed text-white/70">
          This limited ground-level record starts a chronological Roof Passport. It is not a complete roof inspection and does not represent a definitive diagnosis.
        </p>
        <section className="mt-10">
          <h2 className="text-sm font-bold tracking-widest text-[#d4af37]">PRELIMINARY PHOTOS</h2>
          {passport.photos.length ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              {passport.photos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <img src={photo.url} alt="Preliminary exterior documentation" className="aspect-video h-full w-full object-cover" />
                </figure>
              ))}
            </div>
          ) : <p className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/50">Preliminary images are still being prepared.</p>}
        </section>
        <section className="mt-10 rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-8">
          <h2 className="text-2xl font-semibold">Your secure Passport link</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            This private link is limited to this preliminary property record. Inspection authorization and the approve/decline workflow will be added in the next approved checkpoint.
          </p>
        </section>
      </div>
    </main>
  )
}
