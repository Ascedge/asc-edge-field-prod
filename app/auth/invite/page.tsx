'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function InviteLandingPage() {
  const router = useRouter()
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let active = true
    const continueWithSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (active && session) router.replace('/auth/set-password')
    }
    void continueWithSession()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) router.replace('/auth/set-password')
    })
    const timeout = window.setTimeout(() => { if (active) setError(true) }, 8000)
    return () => { active = false; window.clearTimeout(timeout); subscription.subscription.unsubscribe() }
  }, [router])

  return <main className="min-h-screen bg-[#0a0e1a] px-6 py-16 text-white"><div className="mx-auto max-w-md rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-8 text-center">
    <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE FIELD</div>
    <h1 className="mt-4 text-3xl font-bold">Accepting invitation</h1>
    <p className="mt-3 text-sm text-white/60">{error ? 'This invitation could not be confirmed. Request a new preview invite.' : 'Securing your individual preview session…'}</p>
  </div></main>
}
