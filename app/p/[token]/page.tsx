import { notFound } from 'next/navigation'
import { resolveShareToken } from '@/lib/share-tokens'
import LivePassport from './LivePassport'

export const dynamic = 'force-dynamic'

export default async function SharedPassportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const passport = await resolveShareToken(token)
  if (!passport) notFound()

  return <LivePassport token={token} initialPassport={passport} />
}
