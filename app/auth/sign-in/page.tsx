import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signIn } from '@/app/auth/actions'

export const dynamic = 'force-dynamic'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[#0a0e1a] px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-8">
        <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE FIELD</div>
        <h1 className="mt-4 text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-white/60">Use your individual field account. Shared accounts are not permitted.</p>
        {params.error && <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{params.error}</div>}
        <form action={signIn} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={params.next || '/'} />
          <label className="block text-sm text-white/70">
            Email
            <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-2xl border border-white/20 bg-black/30 px-5 py-4 text-white" />
          </label>
          <label className="block text-sm text-white/70">
            Password
            <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-2xl border border-white/20 bg-black/30 px-5 py-4 text-white" />
          </label>
          <button type="submit" className="w-full rounded-2xl bg-[#d4af37] py-4 font-bold tracking-widest text-black">SIGN IN</button>
        </form>
      </div>
    </main>
  )
}
