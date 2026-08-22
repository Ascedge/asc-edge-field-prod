import { NextRequest, NextResponse } from 'next/server'
import { refreshSupabaseSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  // Homeowner Passport pages and their token-scoped endpoints are intentionally public.
  // They must never inherit a future staff sign-in redirect added to session middleware.
  if (request.nextUrl.pathname.startsWith('/p/') || request.nextUrl.pathname.startsWith('/api/passport/')) {
    return NextResponse.next({ request })
  }
  return refreshSupabaseSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
