import { redirect } from 'next/navigation'
import { setInvitedPassword } from '@/app/auth/actions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in?error=Invite+session+expired')
  const params = await searchParams
  return <main className="min-h-screen bg-[#0a0e1a] px-6 py-16 text-white"><div className="mx-auto max-w-md rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-8">
    <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE FIELD</div>
    <h1 className="mt-4 text-3xl font-bold">Set your password</h1>
    <p className="mt-2 text-sm text-white/60">Complete your individual preview account. Your password is sent directly to Supabase and is never displayed to ASC Edge staff.</p>
    {params.error && <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{params.error}</div>}
    <form action={setInvitedPassword} className="mt-8 space-y-4">
      <label className="block text-sm text-white/70">New password<input name="password" type="password" autoComplete="new-password" minLength={12} required className="mt-2 w-full rounded-2xl border border-white/20 bg-black/30 px-5 py-4 text-white" /></label>
      <label className="block text-sm text-white/70">Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required className="mt-2 w-full rounded-2xl border border-white/20 bg-black/30 px-5 py-4 text-white" /></label>
      <button type="submit" className="w-full rounded-2xl bg-[#d4af37] py-4 font-bold tracking-widest text-black">SET PASSWORD &amp; CONTINUE</button>
    </form>
  </div></main>
}
