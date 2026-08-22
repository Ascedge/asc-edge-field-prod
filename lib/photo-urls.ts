import type { SupabaseClient } from '@supabase/supabase-js'

type StoredPhoto = { storage_url: string; storage_path?: string | null }

export async function getSignedPhotoUrl(supabase: SupabaseClient, photo: StoredPhoto): Promise<string> {
  if (photo.storage_path) {
    const { data } = await supabase.storage.from('property-evidence').createSignedUrl(photo.storage_path, 300)
    return data?.signedUrl || ''
  }

  const marker = '/property-photos/'
  const markerIndex = photo.storage_url.indexOf(marker)
  if (markerIndex !== -1) {
    const legacyPath = photo.storage_url.slice(markerIndex + marker.length)
    const { data } = await supabase.storage.from('property-photos').createSignedUrl(legacyPath, 300)
    return data?.signedUrl || ''
  }
  return photo.storage_url
}
