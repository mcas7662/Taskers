// taskers/lib/reference-geocode.ts
// A short Plus Code (like "H9MV+4W5, Trishal") only makes sense near a town. We look the town up
// to get a reference point, then rebuild the full code. Uses Google Geocoding when the map is loaded
// and falls back to OpenStreetMap Nominatim, so it also works without a Google Maps key.
import { isInBangladesh, type LatLng } from '@/lib/location-parse'

/* eslint-disable @typescript-eslint/no-explicit-any */
async function viaGoogle(address: string, google: any): Promise<LatLng | null> {
  try {
    const { Geocoder } = await google.maps.importLibrary('geocoding')
    const res = await new Geocoder().geocode({ address, region: 'bd', componentRestrictions: { country: 'BD' } })
    const loc = res?.results?.[0]?.geometry?.location
    return loc ? { lat: loc.lat(), lng: loc.lng() } : null
  } catch {
    return null
  }
}

async function viaNominatim(address: string): Promise<LatLng | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=bd&q=${encodeURIComponent(address)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const rows = (await res.json()) as { lat: string; lon: string }[]
    if (!rows?.length) return null
    return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) }
  } catch {
    return null
  }
}

/** Returns the first usable reference point for the given place names (most specific first). */
export async function findReference(candidates: string[], google?: any): Promise<LatLng | null> {
  for (const c of candidates) {
    const p = (google ? await viaGoogle(c, google) : null) ?? (await viaNominatim(c))
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && isInBangladesh(p)) return p
  }
  return null
}
