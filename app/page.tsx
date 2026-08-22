import { redirect } from 'next/navigation'
import PropertyLookup from '@/components/PropertyLookup'
import { AuthorizationError, requireFieldContext } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  try {
    await requireFieldContext()
  } catch (error) {
    if (error instanceof AuthorizationError) redirect('/auth/sign-in?next=/')
    throw error
  }

  return <PropertyLookup />
}
