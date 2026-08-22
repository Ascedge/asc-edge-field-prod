'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const safeNextPath = (value: FormDataEntryValue | null): string => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

export async function signIn(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const next = safeNextPath(formData.get('next'))
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    redirect(`/auth/sign-in?error=${encodeURIComponent('Email and password are required')}`)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/auth/sign-in?error=${encodeURIComponent('Invalid email or password')}`)
  redirect(next)
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/auth/sign-in')
}
