'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home as HomeIcon, MapPin, Phone, BarChart3 } from "lucide-react";

export default function PropertyLookup() {
  const [address, setAddress] = useState('')
  const [resolved, setResolved] = useState<null | { formattedAddress: string; canonicalStreet: string; city: string; state: string; postalCode: string; county: string; latitude: number; longitude: number; placeId: string }>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setIsLoading(true)

    try {
      setError(null)
      const res = await fetch('/api/address/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.address) {
        setError(data.error || 'Unable to verify that exact property')
        return
      }
      setResolved(data.address)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmProperty = async () => {
    if (!resolved) return
    setIsLoading(true); setError(null)
    try {
      const response = await fetch('/api/property', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: resolved.formattedAddress, placeId: resolved.placeId, confirmed: true }) })
      const data = await response.json()
      if (!response.ok || !data.property?.id) { setError(data.error || 'Unable to create this property'); return }
      router.push(`/property/${data.property.id}`)
    } catch { setError('Network error. Please try again.') } finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* ASC EDGE Header — using actual logo if present, otherwise refined text mark */}
      <header className="bg-[#0a0e1a] border-b border-[#d4af37]/60 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ASC EDGE" className="h-9 w-auto" />
          <div>
            <div className="text-[#d4af37] font-bold tracking-[3px] text-3xl leading-none">ASC</div>
            <div className="text-[10px] text-white/70 tracking-[2.5px] -mt-0.5">EDGE FIELD</div>
          </div>
        </div>
      </header>

      {/* Main Content - tightened vertical rhythm, premium typography, no design notes */}
      <main className="flex-1 flex flex-col justify-center px-6 pt-8 pb-24">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 text-[#d4af37] text-xs tracking-widest px-5 py-2 rounded-full mb-6 border border-[#d4af37]/30">
              ON SITE
            </div>
            <h1 className="text-[32px] leading-none font-bold text-white mb-3">Property Lookup</h1>
            <p className="text-white/70 text-[15px]">Enter the property address below</p>
          </div>

          {/* Exact address verification precedes every property creation. */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setResolved(null) }}
              placeholder="Enter property address"
              className="w-full bg-[#111827] border border-white/30 focus:border-[#d4af37] text-white placeholder:text-white/50 rounded-3xl px-8 py-7 text-xl outline-none transition-all text-center disabled:opacity-70"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !address.trim()}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-[#d4af37] disabled:opacity-40 transition-all active:scale-95"
            >
              <MapPin className="w-6 h-6" />
            </button>
          </form>
          {error && <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-300/10 p-4 text-sm text-red-100">{error}</p>}
          {resolved && <section className="mt-6 overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-[#111827]">
            <iframe title="Verified property map" className="h-48 w-full border-0" loading="lazy" src={`https://www.google.com/maps?q=${resolved.latitude},${resolved.longitude}&z=20&output=embed`} />
            <div className="p-6"><div className="text-xs font-bold tracking-[2px] text-[#d4af37]">CONFIRM THIS IS THE CORRECT PROPERTY</div><h2 className="mt-3 text-xl font-semibold">{resolved.formattedAddress}</h2><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-white/45">City and ZIP</dt><dd>{resolved.city}, {resolved.state} {resolved.postalCode}</dd></div><div><dt className="text-white/45">County</dt><dd>{resolved.county}</dd></div><div><dt className="text-white/45">Map pin</dt><dd>{resolved.latitude.toFixed(6)}, {resolved.longitude.toFixed(6)}</dd></div><div><dt className="text-white/45">Parcel identifier</dt><dd>Pending approved parcel source</dd></div></dl><p className="mt-4 text-xs text-white/45">Street/aerial imagery is centered on the verified rooftop pin. If Google imagery is unavailable, the property photograph will be shown after it is supplied and confirmed.</p><button type="button" disabled={isLoading} onClick={confirmProperty} className="mt-5 w-full rounded-2xl bg-[#d4af37] p-4 font-bold text-[#0a0e1a] disabled:opacity-40">YES — CREATE THIS PROPERTY</button></div>
          </section>}
        </div>
      </main>

      {/* Bottom Rep Mode Bar — thin Lucide icons in Sovereign Gold, no emoji */}
      <nav className="bg-[#0a0e1a] border-t border-[#d4af37]/30 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex justify-around items-center py-4">
          <button className="flex flex-col items-center gap-1 text-[#d4af37] active:opacity-70 transition-all">
            <HomeIcon className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">HOME</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#60a5fa] active:opacity-70 transition-all">
            <MapPin className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">LOG VISIT</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-white/90 active:opacity-70 transition-all">
            <Phone className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">CALL</div>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#4ade80] active:opacity-70 transition-all">
            <BarChart3 className="w-6 h-6" />
            <div className="text-[10px] font-medium tracking-widest text-white/90 mt-0.5">DASHBOARD</div>
          </button>
        </div>
      </nav>
    </div>
  );
}
