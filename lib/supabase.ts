import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

export const createSupabaseClient = () => {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey())
}

export const createSupabaseAdminClient = () => {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
