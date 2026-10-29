// taskers/lib/resolve-maps-link.ts
// Server only. Follows a Google Maps short link (maps.app.goo.gl/...) a few hops to find the coordinates.
import { parseLocationInput } from './location-parse'

const ALLOWED = new Set(['maps.app.goo.gl', 'goo.gl', 'www.google.com', 'google.com', 'maps.google.com'])

export async function resolveMapsLink(startUrl: string): Promise<{ lat: number; lng: number } | null> {
  let url = startUrl.trim().match(/\S+/)?.[0] ?? ''
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
  for (let hop = 0; hop < 5; hop++) {
    let u: URL
    try {
      u = new URL(url)
    } catch {
      return null
    }
    if (u.protocol !== 'https:' || !ALLOWED.has(u.hostname)) return null
    // short links themselves are never parsed; only the expanded long link is
    if (!/maps\.app\.goo\.gl|goo\.gl/i.test(u.hostname)) {
      const p = parseLocationInput(url)
      if (p.kind === 'point') return { lat: p.point.lat, lng: p.point.lng }
    }
    try {
      const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(4000), headers: { 'user-agent': 'Mozilla/5.0 (Taskers link check)' } })
      const next = res.headers.get('location')
      if (!next) return null
      url = new URL(next, url).toString()
    } catch {
      return null
    }
  }
  return null
}
