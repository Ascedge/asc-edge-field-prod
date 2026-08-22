'use client'

import { useEffect, useState } from 'react'
import type { SharedPassport } from '@/lib/share-tokens'

const labels: Record<string, string> = {
  preliminary: 'Preliminary', awaiting_homeowner_authorization: 'Awaiting homeowner authorization', authorized: 'Authorized',
  documentation_in_progress: 'Documentation in progress', documentation_complete: 'Documentation complete',
  published: 'Published', annual_update_due: 'Annual update due',
}

export default function LivePassport({ token, initialPassport }: { token: string; initialPassport: SharedPassport }) {
  const [passport, setPassport] = useState(initialPassport)
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = async () => {
    const response = await fetch(`/api/passport/${token}`, { cache: 'no-store' })
    if (response.ok) setPassport(await response.json())
  }
  useEffect(() => {
    const timer = window.setInterval(refresh, 5000)
    return () => window.clearInterval(timer)
  // refresh is intentionally tied only to this opaque token.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const decide = async (decision: 'approved' | 'declined') => {
    setSubmitting(true)
    setMessage(null)
    const response = await fetch(`/api/passport/${token}/authorization`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeownerName: name, decision, affirmativeConsent: decision === 'approved' ? consent : true }),
    })
    const body = await response.json()
    setMessage(response.ok ? (decision === 'approved' ? 'Thank you. Full documentation is now authorized.' : 'Your choice is recorded. The preliminary record will remain available.') : body.error || 'Unable to record your choice')
    if (response.ok) await refresh()
    setSubmitting(false)
  }

  return <main className="min-h-screen bg-[#0a0e1a] px-6 py-10 text-white"><div className="mx-auto max-w-3xl">
    <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE ROOF PASSPORT</div>
    <div className="mt-6 inline-flex rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs tracking-widest text-[#f0d77f]">{labels[passport.status] || passport.status}</div>
    <h1 className="mt-5 text-4xl font-bold">{passport.address}</h1>
    <p className="mt-6 max-w-2xl leading-relaxed text-white/70">Your Roof Passport creates a chronological record of an important home asset. Preliminary images are limited ground-level documentation, not a complete inspection or definitive diagnosis.</p>
    <section className="mt-10"><div className="flex items-end justify-between"><h2 className="text-sm font-bold tracking-widest text-[#d4af37]">LIVE PHOTOGRAPHIC RECORD</h2><span className="text-xs text-white/40">Updates every 5 seconds</span></div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">{passport.photos.map((photo) => <figure key={photo.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]"><img src={photo.url} alt={photo.caption || 'Property documentation'} className="aspect-video w-full object-cover" /><figcaption className="p-4"><div className="text-xs uppercase tracking-wider text-[#d4af37]">{photo.category?.replaceAll('_', ' ') || photo.phase}</div><p className="mt-2 text-sm text-white/65">{photo.caption || 'Visual documentation only.'}</p></figcaption></figure>)}</div>
    </section>
    {!passport.authorization && <section className="mt-10 rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-7"><h2 className="text-2xl font-semibold">Inspection and photography authorization</h2><p className="mt-3 text-sm leading-relaxed text-white/65">Authorize ground-level exterior inspection and photographic documentation for this Roof Passport. Marketing/media and policy-vault permissions are not included; those require separate choices.</p><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="Homeowner full name" className="mt-6 w-full rounded-2xl border border-white/20 bg-black/20 p-4" /><label className="mt-4 flex gap-3 text-sm text-white/70"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" /><span>I reviewed the scope and affirmatively authorize the described inspection and photography.</span></label><div className="mt-6 grid gap-3 sm:grid-cols-2"><button disabled={submitting || !name.trim() || !consent} onClick={() => decide('approved')} className="rounded-2xl bg-[#d4af37] p-4 font-bold text-[#0a0e1a] disabled:opacity-40">APPROVE</button><button disabled={submitting || !name.trim()} onClick={() => decide('declined')} className="rounded-2xl border border-white/25 p-4 font-bold disabled:opacity-40">DECLINE RESPECTFULLY</button></div></section>}
    {passport.authorization && <section className="mt-10 rounded-3xl border border-white/10 bg-[#111827] p-7"><h2 className="text-xl font-semibold">Authorization recorded</h2><p className="mt-2 text-white/65">Decision: {passport.authorization.decision}. Server-recorded {new Date(passport.authorization.decidedAt).toLocaleString()}.</p></section>}
    {message && <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">{message}</p>}
    <section className="mt-10"><h2 className="text-sm font-bold tracking-widest text-[#d4af37]">PROPERTY TIMELINE</h2><div className="mt-5 space-y-3">{passport.timeline.map((event) => <div key={event.id} className="rounded-2xl border border-white/10 p-4"><div className="text-xs text-white/40">{new Date(event.createdAt).toLocaleString()}</div><p className="mt-1 text-sm text-white/75">{event.summary}</p></div>)}</div></section>
  </div></main>
}
