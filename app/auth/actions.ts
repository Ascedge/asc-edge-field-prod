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

export async function setInvitedPassword(formData: FormData) {
  const password = formData.get('password')
  const confirmation = formData.get('confirmation')
  if (typeof password !== 'string' || password.length < 12) {
    redirect(`/auth/set-password?error=${encodeURIComponent('Password must be at least 12 characters')}`)
  }
  if (password !== confirmation) {
    redirect(`/auth/set-password?error=${encodeURIComponent('Passwords do not match')}`)
  }
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/sign-in?error=${encodeURIComponent('Invite session expired. Request a new invite.')}`)
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(`/auth/set-password?error=${encodeURIComponent('Unable to set password. Request a new invite.')}`)
  redirect('/')
}
