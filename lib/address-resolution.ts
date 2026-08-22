import 'server-only'
import { getGoogleMapsApiKey } from '@/lib/env'

export type CanonicalAddress = {
  formattedAddress: string
  canonicalStreet: string
  city: string
  state: string
  postalCode: string
  county: string
  neighborhood: string | null
  latitude: number
  longitude: number
  placeId: string
  locationType: string
}

const component = (parts: Array<{ long_name: string; short_name: string; types: string[] }>, type: string, short = false) => {
  const match = parts.find((part) => part.types.includes(type))
  return match ? (short ? match.short_name : match.long_name) : ''
}

export const normalizeCanonicalAddress = (address: CanonicalAddress) =>
  `${address.canonicalStreet} ${address.city} ${address.state} ${address.postalCode}`
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export async function resolveCanonicalAddress(query: string): Promise<CanonicalAddress> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', getGoogleMapsApiKey())
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Address verification service is unavailable')
  const payload = await response.json() as { status: string; results?: Array<Record<string, unknown>> }
  const result = payload.results?.[0] as { formatted_address?: string; place_id?: string; types?: string[]; address_components?: Array<{ long_name: string; short_name: string; types: string[] }>; geometry?: { location?: { lat: number; lng: number }; location_type?: string } } | undefined
  if (payload.status !== 'OK' || !result) throw new Error('No verified address was found. Check the complete street, city, state, and ZIP.')
  if (!result.types?.includes('street_address') || result.geometry?.location_type !== 'ROOFTOP') {
    throw new Error('Select an exact rooftop street address before creating a property.')
  }
  const parts = result.address_components || []
  const streetNumber = component(parts, 'street_number')
  const route = component(parts, 'route')
  const city = component(parts, 'locality') || component(parts, 'postal_town')
  const state = component(parts, 'administrative_area_level_1', true)
  const postalCode = component(parts, 'postal_code')
  const county = component(parts, 'administrative_area_level_2')
  const location = result.geometry?.location
  if (!streetNumber || !route || !city || !state || !postalCode || !county || !location || !result.place_id || !result.formatted_address) {
    throw new Error('The address provider did not return a complete canonical property identity.')
  }
  return {
    formattedAddress: result.formatted_address, canonicalStreet: `${streetNumber} ${route}`,
    city, state, postalCode, county, neighborhood: component(parts, 'neighborhood') || null,
    latitude: location.lat, longitude: location.lng, placeId: result.place_id,
    locationType: result.geometry?.location_type || 'UNKNOWN',
  }
}
