import { resolveShareToken } from '@/lib/share-tokens'
import LivePassport from './LivePassport'

export const dynamic = 'force-dynamic'

export default async function SharedPassportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const passport = await resolveShareToken(token)
  if (!passport) return <main className="flex min-h-screen items-center justify-center bg-[#080b13] px-6 text-white"><section className="max-w-xl rounded-3xl border border-[#d4af37]/30 bg-[#111827] p-8 text-center"><div className="text-xs font-bold tracking-[3px] text-[#d4af37]">ASC EDGE ROOF PASSPORT</div><h1 className="mt-5 text-3xl font-semibold">This Passport link is not available</h1><p className="mt-4 leading-relaxed text-white/65">The link may have been replaced or revoked. Your property record is safe. Please contact the ASC Edge representative who provided the Passport to request the current secure link.</p></section></main>

  return <LivePassport token={token} initialPassport={passport} />
}
