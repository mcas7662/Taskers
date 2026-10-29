// taskers/lib/location-parse.ts
// Turns whatever a person pastes from Google Maps into latitude / longitude.
// Supported: "24.581222,90.394901", degrees-minutes-seconds, Google Maps links, and Plus Codes
// (full like "7MPGH9MV+4W5" or short like "H9MV+4W5, Trishal").

export type LatLng = { lat: number; lng: number }

export type ParseResult =
  | { kind: 'point'; point: LatLng; via: 'coords' | 'url' | 'pluscode' }
  /** A short Plus Code: needs a nearby reference point (we look one up from `locality`). */
  | { kind: 'short_code'; code: string; locality: string }
  | { kind: 'error'; reason: 'empty' | 'unreadable' | 'short_link' | 'outside' | 'need_area' }

// Rough box around Bangladesh (with a small margin).
const BD = { latMin: 20.4, latMax: 26.8, lngMin: 87.8, lngMax: 92.9 }
const inBd = (p: LatLng) => p.lat >= BD.latMin && p.lat <= BD.latMax && p.lng >= BD.lngMin && p.lng <= BD.lngMax
const valid = (p: LatLng) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180

export const isInBangladesh = inBd

/** Fix a swapped "lng,lat" pair when that is the only reading that lands in Bangladesh. */
function orient(a: number, b: number): LatLng | null {
  const normal = { lat: a, lng: b }
  const swapped = { lat: b, lng: a }
  if (valid(normal) && inBd(normal)) return normal
  if (valid(swapped) && inBd(swapped)) return swapped
  return valid(normal) ? normal : null
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
function asciiDigits(s: string) {
  return s.replace(/[০-৯]/g, (c) => String(BN_DIGITS.indexOf(c)))
}

// ---------------------------------------------------------------- Plus Codes (Open Location Code)
const ALPHABET = '23456789CFGHJMPQRVWX'
const CODE_RE = /(?:^|[^0-9A-Z])([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3})(?![0-9A-Z])/i

function digitIndex(ch: string) {
  return ALPHABET.indexOf(ch.toUpperCase())
}

/** Decode a FULL Plus Code (8 characters before the "+") to its centre point. */
export function decodeFullPlusCode(code: string): LatLng | null {
  const s = code.replace('+', '').toUpperCase()
  if (s.length < 10 || [...s].some((c) => digitIndex(c) < 0)) return null
  const pairRes = [20, 1, 0.05, 0.0025, 0.000125]
  let lat = 0
  let lng = 0
  for (let i = 0; i < 5; i++) {
    lat += digitIndex(s[i * 2]) * pairRes[i]
    lng += digitIndex(s[i * 2 + 1]) * pairRes[i]
  }
  let latRes = pairRes[4]
  let lngRes = pairRes[4]
  for (let i = 10; i < Math.min(s.length, 15); i++) {
    const idx = digitIndex(s[i])
    latRes /= 5
    lngRes /= 4
    lat += Math.floor(idx / 4) * latRes
    lng += (idx % 4) * lngRes
  }
  return { lat: lat - 90 + latRes / 2, lng: lng - 180 + lngRes / 2 }
}

/** First 10 characters of the Plus Code that contains a point (used to rebuild short codes). */
function encodePrefix(lat: number, lng: number): string {
  let latVal = Math.floor((Math.min(Math.max(lat, -90), 90) + 90) * 8000)
  let lngVal = Math.floor((((lng + 180) % 360) + 360) % 360 * 8000)
  const lats: string[] = []
  const lngs: string[] = []
  for (let i = 0; i < 5; i++) {
    lats.unshift(ALPHABET[latVal % 20])
    lngs.unshift(ALPHABET[lngVal % 20])
    latVal = Math.floor(latVal / 20)
    lngVal = Math.floor(lngVal / 20)
  }
  return lats.map((c, i) => c + lngs[i]).join('')
}

/** Rebuild a short Plus Code (like "H9MV+4W5") using a reference point within about 25 km. */
export function recoverShortCode(shortCode: string, ref: LatLng): LatLng | null {
  const plus = shortCode.indexOf('+')
  if (plus < 0 || plus >= 8 || plus % 2 !== 0) return null
  const padding = 8 - plus
  const resolution = Math.pow(20, 2 - padding / 2)
  const half = resolution / 2
  const prefix = encodePrefix(ref.lat, ref.lng).slice(0, padding)
  const area = decodeFullPlusCode(prefix + shortCode)
  if (!area) return null
  let { lat, lng } = area
  if (ref.lat + half < lat && lat - resolution >= -90) lat -= resolution
  else if (ref.lat - half > lat && lat + resolution <= 90) lat += resolution
  if (ref.lng + half < lng) lng -= resolution
  else if (ref.lng - half > lng) lng += resolution
  return { lat, lng }
}

/** Places to look up (most specific town first) to get a reference point for a short Plus Code. */
export function localityCandidates(locality: string): string[] {
  const clean = locality.replace(/^[\s,–-]+/, '').trim()
  if (!clean) return []
  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean)
  const out: string[] = []
  if (parts.length > 1) out.push(`${parts[parts.length - 1]}, Bangladesh`)
  out.push(`${clean}, Bangladesh`)
  if (parts.length > 2) out.push(`${parts[parts.length - 2]}, ${parts[parts.length - 1]}, Bangladesh`)
  return [...new Set(out)]
}

// ---------------------------------------------------------------- coordinates, DMS, links
const NUM = '-?\\d{1,3}(?:\\.\\d+)?'
const COORD_RE = new RegExp(`^\\(?\\s*(${NUM})\\s*°?\\s*[,;\\s]\\s*(${NUM})\\s*°?\\s*\\)?$`)

function parseDms(s: string): LatLng | null {
  const re = /(\d{1,3})\s*°\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([NSns])[\s,;]*(\d{1,3})\s*°\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([EWew])/
  const m = s.match(re)
  if (!m) return null
  const lat = (Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600) * (/s/i.test(m[4]) ? -1 : 1)
  const lng = (Number(m[5]) + Number(m[6]) / 60 + Number(m[7]) / 3600) * (/w/i.test(m[8]) ? -1 : 1)
  return { lat, lng }
}

function parseUrl(s: string): ParseResult | null {
  if (!/^https?:\/\//i.test(s) && !/(^|\s)(www\.)?(google\.[a-z.]+\/maps|maps\.google|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(s)) return null
  if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s)) return { kind: 'error', reason: 'short_link' }
  const decoded = (() => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  })()
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // exact pin (place pages)
    /[?&](?:q|ll|query|center|destination)=(-?\d+(?:\.\d+)?)[,+\s]+(-?\d+(?:\.\d+)?)/, // ?q=lat,lng
    /\/place\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // /place/lat,lng
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // map centre
  ]
  for (const p of patterns) {
    const m = decoded.match(p)
    if (m) {
      const pt = orient(Number(m[1]), Number(m[2]))
      if (pt) return inBd(pt) ? { kind: 'point', point: pt, via: 'url' } : { kind: 'error', reason: 'outside' }
    }
  }
  // a link that has a Plus Code in it
  const code = decoded.match(CODE_RE)
  if (code) return parsePlusCode(decoded, code)
  return { kind: 'error', reason: 'unreadable' }
}

function parsePlusCode(text: string, m: RegExpMatchArray): ParseResult {
  const code = m[1].toUpperCase()
  const before = code.indexOf('+')
  if (before === 8) {
    const pt = decodeFullPlusCode(code)
    if (!pt) return { kind: 'error', reason: 'unreadable' }
    return inBd(pt) ? { kind: 'point', point: pt, via: 'pluscode' } : { kind: 'error', reason: 'outside' }
  }
  if (before % 2 !== 0 || before < 2) return { kind: 'error', reason: 'unreadable' }
  const after = text.slice((m.index ?? 0) + m[0].length).replace(/^[\s,–-]+/, '').trim()
  if (!after) return { kind: 'error', reason: 'need_area' }
  return { kind: 'short_code', code, locality: after }
}

export function parseLocationInput(raw: string): ParseResult {
  const text = asciiDigits(raw ?? '').replace(/[\u200b-\u200f\u202a-\u202e]/g, '').trim()
  if (!text) return { kind: 'error', reason: 'empty' }

  const url = parseUrl(text)
  if (url) return url

  const flat = text.replace(/\s+/g, ' ')
  const c = flat.match(COORD_RE)
  if (c) {
    const pt = orient(Number(c[1]), Number(c[2]))
    if (!pt) return { kind: 'error', reason: 'unreadable' }
    return inBd(pt) ? { kind: 'point', point: pt, via: 'coords' } : { kind: 'error', reason: 'outside' }
  }

  const dms = parseDms(flat)
  if (dms && valid(dms)) return inBd(dms) ? { kind: 'point', point: dms, via: 'coords' } : { kind: 'error', reason: 'outside' }

  const code = flat.match(CODE_RE)
  if (code) return parsePlusCode(flat, code)

  return { kind: 'error', reason: 'unreadable' }
}
