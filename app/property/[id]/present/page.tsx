import { notFound, redirect } from 'next/navigation'
import HomeownerCarousel from '@/components/HomeownerCarousel'
import { AuthorizationError, requirePropertyAccess } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function HomeownerPresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requirePropertyAccess(id)
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) redirect(`/auth/sign-in?next=/property/${id}/present`)
    if (error instanceof AuthorizationError) notFound()
    throw error
  }
  return <HomeownerCarousel />
}
