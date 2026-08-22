import 'server-only'

import { createSupabaseAdminClient } from '@/lib/supabase'

const EVIDENCE_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/(pre_knock|full_house)\/[0-9a-f-]{36}\.(jpg|png|webp)$/i

export async function removeFailedEvidenceUpload(path: string): Promise<void> {
  if (!EVIDENCE_PATH.test(path)) throw new Error('Refusing to remove an unexpected Storage path')
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage.from('property-evidence').remove([path])
  if (error) console.error('Failed to clean up rejected evidence upload:', error.message)
}
