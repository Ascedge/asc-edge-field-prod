const readRequired = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const readUrl = (name: string, value: string): string => {
  try {
    return new URL(value).toString().replace(/\/$/, '')
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`)
  }
}

export const getSupabaseUrl = (): string => {
  const name = process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL'
  return readUrl(name, readRequired(name))
}

export const getSupabaseAnonKey = (): string => readRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const getSupabaseServiceRoleKey = (): string => readRequired('SUPABASE_SERVICE_ROLE_KEY')

export const getAppUrl = (): string => {
  const name = process.env.APP_URL ? 'APP_URL' : 'NEXT_PUBLIC_APP_URL'
  return readUrl(name, readRequired(name))
}

export const getGoogleMapsApiKey = (): string =>
  process.env.GOOGLE_MAPS_API_KEY?.trim() || readRequired('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')

export const getShareTokenEncryptionKey = (): string => readRequired('SHARE_TOKEN_ENCRYPTION_KEY')

export const getOptionalGhlWebhookUrl = (): string | null => {
  const value = process.env.GHL_WEBHOOK_URL?.trim()
  return value ? readUrl('GHL_WEBHOOK_URL', value) : null
}
