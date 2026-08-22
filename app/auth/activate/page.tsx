import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const allowedTypes = new Set<EmailOtpType>(['invite', 'recovery'])

async function confirmPreviewAccount(formData: FormData) {
  'use server'

  const tokenHash = formData.get('token_hash')
  const rawType = formData.get('type') as EmailOtpType | null
  if (typeof tokenHash !== 'string' || !rawType || !allowedTypes.has(rawType)) {
    redirect('/auth/sign-in?error=Invalid+or+expired+setup+link')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType })
  if (error) redirect('/auth/sign-in?error=Invalid+or+expired+setup+link')
  redirect('/auth/set-password')
}

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const params = await searchParams
  const valid = Boolean(params.token_hash && params.type && allowedTypes.has(params.type as EmailOtpType))

  return (
    <main className="min-h-screen bg-[#0a0e1a] px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-8 text-center">
        <div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE FIELD</div>
        <h1 className="mt-4 text-3xl font-bold">Activate preview account</h1>
        <p className="mt-3 text-sm text-white/60">
          {valid
            ? 'Your secure setup link is ready. Continue once to create your password.'
            : 'This setup link is incomplete. Request a new preview link.'}
        </p>
        {valid && (
          <form action={confirmPreviewAccount} className="mt-8">
            <input type="hidden" name="token_hash" value={params.token_hash} />
            <input type="hidden" name="type" value={params.type} />
            <button type="submit" className="w-full rounded-2xl bg-[#d4af37] py-4 font-bold tracking-widest text-black">
              CONTINUE SETUP
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
