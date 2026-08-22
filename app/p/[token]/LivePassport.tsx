'use client'

import { useEffect, useState } from 'react'
import type { SharedPassport } from '@/lib/share-tokens'
import PassportExperience from '@/components/PassportExperience'
import { PASSPORT_SOURCES } from '@/lib/passport-sources'

const labels: Record<string, string> = {
  preliminary: 'Preliminary', awaiting_homeowner_authorization: 'Awaiting homeowner authorization', authorized: 'Authorized',
  documentation_in_progress: 'Documentation in progress', documentation_complete: 'Documentation complete',
  published: 'Published', annual_update_due: 'Annual update due',
  access_revoked: 'Access revoked',
}

const stateCopy: Record<string, string> = {
  preliminary: 'Preliminary exterior documentation is being assembled.',
  awaiting_homeowner_authorization: 'Your preliminary record is ready. Full photography remains locked until you decide.',
  authorized: 'Authorization is recorded. This is not the final Passport; complete documentation is now unlocked for your representative.',
  documentation_in_progress: 'Additional authorized photographs are being added to this same live Passport.',
  documentation_complete: 'Field documentation is complete and is being prepared for publication.',
  published: 'This Passport is published and remains available at this secure link.',
  annual_update_due: 'This Passport remains available and is ready for its annual update.',
  access_revoked: 'This secure link has been revoked. Request the replacement link from your representative.',
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

  if (passport.authorization?.decision === 'approved') return <><PassportActions address={passport.address} /><div className="bg-[#080b13] px-6 pt-6 text-center text-sm text-white/65"><p>{stateCopy[passport.status] || 'This Passport is being updated.'}</p></div><PassportExperience
    property={{
      address: passport.address, neighborhood: passport.neighborhood,
      status: passport.status, reportVersion: 1,
    }}
    photos={passport.photos.map((photo) => ({ ...photo, url: photo.url }))}
    timeline={passport.timeline.map((event) => ({ id: event.id, summary: event.summary, createdAt: event.createdAt, status: event.status }))}
    documents={[]}
    sources={PASSPORT_SOURCES}
    publicMode
    measurement={passport.measurement}
  /></>

  return <main className="min-h-screen bg-[#0a0e1a] px-6 py-10 text-white"><div className="mx-auto max-w-3xl">
    <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE ROOF PASSPORT</div>
    <div className="mt-6 inline-flex rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs tracking-widest text-[#f0d77f]">{labels[passport.status] || passport.status}</div>
    <h1 className="mt-5 text-4xl font-bold">{passport.address}</h1>
    <p className="mt-3 text-[#f0d77f]">{stateCopy[passport.status] || 'This Passport is being updated.'}</p>
    <PassportActions address={passport.address} />
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

function PassportActions({ address }: { address: string }) {
  const message = () => `My ASC Edge Roof Passport for ${address}: ${window.location.href}`
  const save = async () => {
    if (navigator.share) await navigator.share({ title: 'My Roof Passport', text: `Roof Passport for ${address}`, url: window.location.href })
    else window.alert('Save this page with your browser bookmark or Add to Home Screen command. This secure link stays the same unless it is revoked or replaced.')
  }
  return <div className="mx-auto mt-6 grid max-w-4xl gap-3 px-2 sm:grid-cols-4">
    <button onClick={() => { window.location.href = `sms:?&body=${encodeURIComponent(message())}` }} className="rounded-2xl border border-[#d4af37]/40 px-4 py-3 text-center text-sm text-[#f0d77f]">Text me my Passport</button>
    <button onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent('My ASC Edge Roof Passport')}&body=${encodeURIComponent(message())}` }} className="rounded-2xl border border-[#d4af37]/40 px-4 py-3 text-center text-sm text-[#f0d77f]">Email me my Passport</button>
    <button onClick={save} className="rounded-2xl border border-[#d4af37]/40 px-4 py-3 text-sm text-[#f0d77f]">Save this Passport</button>
    <a href="#overview" className="rounded-2xl border border-[#d4af37]/40 px-4 py-3 text-center text-sm text-[#f0d77f]">Return to property overview</a>
  </div>
}
