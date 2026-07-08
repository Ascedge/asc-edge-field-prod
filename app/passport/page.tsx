'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PassportPage() {
  return (
    <Suspense fallback={null}>
      <PassportInner />
    </Suspense>
  );
}

function PassportInner() {
  const searchParams = useSearchParams();
  const src = searchParams.get('src') || 'qr_card';

  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/passport/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), source: src }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');

      setLookupResult(data);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (cta: string) => {
    if (!name.trim() || !phone.trim() || !lookupResult?.lookupId) return;

    setSubmittingLead(true);
    try {
      const res = await fetch('/api/passport/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookupId: lookupResult.lookupId,
          name: name.trim(),
          phone: phone.trim(),
          cta,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err: any) {
      alert('Error submitting lead: ' + err.message);
    } finally {
      setSubmittingLead(false);
    }
  };

  const hasPhotos = lookupResult?.photos?.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-white flex flex-col">
      <header className="bg-black border-b border-[#C9A227]/60 py-6 px-6">
        <div className="text-[#C9A227] font-bold tracking-[4px] text-3xl">ASC EDGE</div>
        <div className="text-[10px] text-white/70 tracking-[2.5px]">ROOFING PASSPORT</div>
      </header>

      <main className="flex-1 flex flex-col px-6 pt-10 max-w-md mx-auto w-full">
        {!lookupResult ? (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] text-xs tracking-widest px-6 py-2 rounded-full mb-6 border border-[#C9A227]/30">
                PUBLIC ROOF PASSPORT
              </div>
              <h1 className="text-4xl font-bold leading-none mb-4">Get Your Roof&apos;s<br />Time-Stamped Passport</h1>
              <p className="text-white/70">Enter your address below</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="14111 Lofty Mountain Dr, Houston TX"
                className="w-full bg-[#111] border border-white/20 focus:border-[#C9A227] rounded-3xl px-8 py-6 text-lg text-center placeholder:text-white/40 outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !address.trim()}
                className="w-full bg-[#C9A227] hover:bg-[#d4af37] disabled:opacity-50 text-black font-bold py-5 rounded-3xl tracking-widest text-lg active:scale-[0.985] transition-all"
              >
                {isLoading ? 'CHECKING ROOF RECORD...' : 'LOOKUP ROOF'}
              </button>
            </form>

            <div className="mt-auto pt-12 text-center text-[10px] text-white/30">
              Time-stamped roof documentation &bull; No login required
            </div>
          </>
        ) : submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-[#C9A227] text-7xl mb-6">&#10003;</div>
            <h2 className="text-3xl font-bold mb-4">We&apos;ve Got It</h2>
            <p className="text-white/70 text-lg max-w-[280px]">A roof documentation rep will reach out shortly. Thank you for protecting your home.</p>
            {hasPhotos && lookupResult?.matchedPropertyId && (
              <a
                href={`/report/${lookupResult.matchedPropertyId}`}
                className="mt-8 bg-[#C9A227] text-black font-bold py-5 px-8 rounded-3xl tracking-widest active:scale-95"
              >
                VIEW YOUR FULL REPORT
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="text-[#C9A227] text-sm tracking-[2px] mb-1">ADDRESS</div>
              <h2 className="text-2xl font-semibold leading-tight">{lookupResult.address}</h2>
            </div>

            {hasPhotos ? (
              <>
                <div className="text-[#C9A227] text-xs tracking-widest mb-4">YOUR ROOFING PASSPORT HAS BEEN STARTED</div>
                <div className="grid grid-cols-2 gap-3 mb-10">
                  {lookupResult.photos.map((photo: any, i: number) => (
                    <div key={i} className="rounded-3xl overflow-hidden border border-white/10 bg-black">
                      <img src={photo.url} alt="Roof photo" className="w-full aspect-video object-cover" />
                      <div className="bg-black/70 text-[10px] text-center py-1 text-white/60">
                        {new Date(photo.taken_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center mb-8">
                <div className="text-white/70 text-sm mb-6">NO RECORD EXISTS FOR THIS ROOF YET</div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-video bg-[#1a1a1a] border border-[#C9A227]/20 rounded-3xl flex items-center justify-center p-4 text-center">
                      <div className="text-[#C9A227] text-[10px] leading-tight font-medium tracking-widest">
                        TIME-STAMPED<br />ROOFING PASSPORT<br />&mdash; DON&apos;T GET CAUGHT<br />WITHOUT YOURS &mdash;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto bg-[#111] border border-white/10 rounded-3xl p-6 mb-8">
              <div className="text-white/80 text-sm mb-4">Leave your contact info below. A local ASC Edge rep will reach out within 24 hours.</div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-white/30 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 mb-3"
              />
              <input
                type="tel"
                placeholder="(281) 555-1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black border border-white/30 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 mb-6"
              />

              <div className="grid grid-cols-1 gap-3">
                {hasPhotos ? (
                  <button
                    onClick={() => handleLeadSubmit('finish')}
                    disabled={submittingLead || !name.trim() || !phone.trim()}
                    className="bg-[#C9A227] text-black font-bold py-5 rounded-3xl tracking-widest active:scale-95 disabled:opacity-50"
                  >
                    HAVE A REP FINISH MY PASSPORT
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeadSubmit('book')}
                    disabled={submittingLead || !name.trim() || !phone.trim()}
                    className="bg-[#C9A227] text-black font-bold py-5 rounded-3xl tracking-widest active:scale-95 disabled:opacity-50"
                  >
                    START MY PASSPORT &mdash; BOOK MY INSPECTION
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
