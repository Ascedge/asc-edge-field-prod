import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const FIELD_ROLES = [
  'platform_admin',
  'licensee_owner',
  'manager',
  'office_user',
  'inspector',
] as const

export type FieldRole = (typeof FIELD_ROLES)[number]

type Membership = {
  organization_id: string
  role: FieldRole
}

export class AuthorizationError extends Error {
  constructor(message: string, public readonly status: 401 | 403 = 401) {
    super(message)
  }
}

export type AuthContext = {
  supabase: SupabaseClient
  user: User
}

export type FieldContext = AuthContext & Membership

export async function requireUser(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new AuthorizationError('Authentication required', 401)
  return { supabase, user }
}

export async function requireFieldContext(): Promise<FieldContext> {
  const context = await requireUser()
  const { data: profile } = await context.supabase
    .from('profiles')
    .select('active_organization_id')
    .eq('user_id', context.user.id)
    .single()
  let membershipQuery = context.supabase
    .from('organization_memberships')
    .select('organization_id, role')
    .eq('user_id', context.user.id)
    .eq('status', 'active')
    .in('role', [...FIELD_ROLES])
    .order('created_at', { ascending: true })
    .limit(1)
  if (profile?.active_organization_id) membershipQuery = membershipQuery.eq('organization_id', profile.active_organization_id)
  const { data, error } = await membershipQuery
    .single()

  if (error || !data) throw new AuthorizationError('Active field membership required', 403)
  return { ...context, organization_id: data.organization_id, role: data.role as FieldRole }
}

export async function requirePropertyAccess(propertyId: string): Promise<FieldContext> {
  const context = await requireFieldContext()
  const { data, error } = await context.supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('organization_id', context.organization_id)
    .single()
  if (error || !data) throw new AuthorizationError('Property access denied', 403)
  return context
}
