import type { EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const allowedTypes = new Set<EmailOtpType>(['invite', 'recovery', 'signup', 'email_change', 'magiclink'])

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const rawType = request.nextUrl.searchParams.get('type') as EmailOtpType | null
  const requestedNext = request.nextUrl.searchParams.get('next')
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/auth/set-password'
  if (!tokenHash || !rawType || !allowedTypes.has(rawType)) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=Invalid+or+expired+invite', request.url))
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType })
  if (error) return NextResponse.redirect(new URL('/auth/sign-in?error=Invalid+or+expired+invite', request.url))
  return NextResponse.redirect(new URL(next, request.url))
}
