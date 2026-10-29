// taskers/components/TaskLocationPicker.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ClipboardPaste, MapPin, Search, ChevronDown, ExternalLink } from 'lucide-react'
import { loadGoogleMaps, MAPS_KEY } from '@/lib/maps'
import { localityCandidates, parseLocationInput, recoverShortCode, isInBangladesh, type LatLng } from '@/lib/location-parse'
import { findReference } from '@/lib/reference-geocode'
import { resolveShortLink } from '@/app/post/actions'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Result = { id: string; name: string; address: string; lat: number; lng: number }
type DistrictRef = { id: number; lat: number | null; lng: number | null }
type Props = {
  dict: Record<string, string>
  lang: 'bn' | 'en'
  /** Chosen district + reference points: used only if the town in a short Plus Code cannot be looked up. */
  districtId?: string
  districtRefs?: DistrictRef[]
}

const BD_CENTER = { lat: 23.685, lng: 90.3563 }

// The phone screenshots, in the order a person follows them.
const STEPS: { n: number; images: string[] }[] = [
  { n: 1, images: ['1-open-maps'] },
  { n: 2, images: ['2-drop-pin'] },
  { n: 3, images: ['3-named-place'] },
  { n: 4, images: ['4-plus-code-bar', '5-plus-code-card'] },
  { n: 5, images: ['6-tap-bar', '7-copy'] },
  { n: 6, images: [] },
]

export default function TaskLocationPicker({ dict, lang, districtId = '', districtRefs = [] }: Props) {
  const d = (k: string) => dict[k] ?? k
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const pasteRef = useRef<HTMLInputElement>(null)
  const skipRaw = useRef<string | null>(null)
  const runId = useRef(0)

  const [mapsReady, setMapsReady] = useState(false)
  const [mapsFailed, setMapsFailed] = useState(!MAPS_KEY)

  const [placeName, setPlaceName] = useState('')
  const [raw, setRaw] = useState('')
  const [point, setPoint] = useState<LatLng | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [source, setSource] = useState<'manual' | 'geocoded'>('manual')
  const [placeId, setPlaceId] = useState('')
  const [address, setAddress] = useState('')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [searching, setSearching] = useState(false)
  const [searchMsg, setSearchMsg] = useState<string | null>(null)

  const showOnMap = useCallback((p: LatLng, pan = true) => {
    const g = window.google
    if (!g || !mapRef.current) return
    if (!markerRef.current) {
      markerRef.current = new g.maps.Marker({ map: mapRef.current, position: p, draggable: true })
      markerRef.current.addListener('dragend', () => {
        const pos = markerRef.current.getPosition()
        setFromMap(pos.lat(), pos.lng())
      })
    } else {
      markerRef.current.setPosition(p)
    }
    if (pan) {
      mapRef.current.panTo(p)
      if ((mapRef.current.getZoom() ?? 0) < 16) mapRef.current.setZoom(17)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** A point chosen by tapping/dragging on the map: write it into the paste box too. */
  function setFromMap(lat: number, lng: number) {
    const p = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
    const text = `${p.lat},${p.lng}`
    skipRaw.current = text
    setRaw(text)
    setPoint(p)
    setErr(null)
    setSource('manual')
    setPlaceId('')
    setAddress('')
  }

  // load the map once (optional: the paste box works without it)
  useEffect(() => {
    if (!MAPS_KEY) return
    let cancelled = false
    loadGoogleMaps(lang)
      .then(async (g) => {
        await Promise.all([g.maps.importLibrary('maps'), g.maps.importLibrary('marker'), g.maps.importLibrary('places')])
        if (cancelled || !mapEl.current) return
        mapRef.current = new g.maps.Map(mapEl.current, {
          center: BD_CENTER,
          zoom: 7,
          gestureHandling: 'greedy',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        })
        mapRef.current.addListener('click', (e: any) => {
          setFromMap(e.latLng.lat(), e.latLng.lng())
          showOnMap({ lat: e.latLng.lat(), lng: e.latLng.lng() }, false)
        })
        setMapsReady(true)
      })
      .catch(() => setMapsFailed(true))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // keep the marker in step with the chosen point once the map is ready
  useEffect(() => {
    if (mapsReady && point) showOnMap(point)
  }, [mapsReady, point, showOnMap])

  // turn the pasted text into a point (after a short pause while typing/pasting)
  useEffect(() => {
    if (skipRaw.current !== null && skipRaw.current === raw) {
      skipRaw.current = null
      return
    }
    const text = raw.trim()
    const id = ++runId.current
    if (!text) {
      setPoint(null)
      setErr(null)
      setBusy(false)
      return
    }
    const timer = setTimeout(async () => {
      const parsed = parseLocationInput(text)
      if (parsed.kind === 'point') {
        setPoint({ lat: Number(parsed.point.lat.toFixed(6)), lng: Number(parsed.point.lng.toFixed(6)) })
        setErr(null)
        setSource('manual')
        setPlaceId('')
        setAddress('')
        return
      }
      if (parsed.kind === 'error' && parsed.reason === 'short_link') {
        // maps.app.goo.gl/… : the server follows the link for us
        setBusy(true)
        setErr(null)
        const found = await resolveShortLink(text)
        if (id !== runId.current) return
        setBusy(false)
        if (found && isInBangladesh(found)) {
          setPoint({ lat: Number(found.lat.toFixed(6)), lng: Number(found.lng.toFixed(6)) })
          setSource('manual')
          setPlaceId('')
          setAddress('')
        } else {
          setPoint(null)
          setErr(d('loc_err_short_link'))
        }
        return
      }
      if (parsed.kind === 'error' && parsed.reason === 'need_area') {
        // short code with no town written: use the chosen district as the reference
        const dRow0 = districtRefs.find((x) => String(x.id) === districtId)
        const code = text.toUpperCase().match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/)?.[0]
        const rebuilt0 = dRow0 && dRow0.lat != null && dRow0.lng != null && code ? recoverShortCode(code, { lat: dRow0.lat, lng: dRow0.lng }) : null
        if (rebuilt0 && isInBangladesh(rebuilt0)) {
          setPoint({ lat: Number(rebuilt0.lat.toFixed(6)), lng: Number(rebuilt0.lng.toFixed(6)) })
          setErr(null)
          setSource('manual')
          setPlaceId('')
          setAddress('')
        } else {
          setPoint(null)
          setErr(d('loc_err_need_area'))
        }
        return
      }
      if (parsed.kind === 'error') {
        setPoint(null)
        setErr(d(`loc_err_${parsed.reason === 'empty' ? 'unreadable' : parsed.reason}`))
        return
      }
      // short Plus Code: find the town first, then rebuild the full code
      setBusy(true)
      setErr(null)
      const ref = await findReference(localityCandidates(parsed.locality), window.google?.maps ? window.google : undefined)
      if (id !== runId.current) return
      setBusy(false)
      // town lookup failed (offline, unknown name): fall back to the district the poster chose
      const dRow = districtRefs.find((x) => String(x.id) === districtId)
      const dRef = dRow && dRow.lat != null && dRow.lng != null ? { lat: dRow.lat, lng: dRow.lng } : null
      const rebuilt = ref ? recoverShortCode(parsed.code, ref) : dRef ? recoverShortCode(parsed.code, dRef) : null
      if (rebuilt && isInBangladesh(rebuilt)) {
        setPoint({ lat: Number(rebuilt.lat.toFixed(6)), lng: Number(rebuilt.lng.toFixed(6)) })
        setSource('manual')
        setPlaceId('')
        setAddress('')
      } else {
        setPoint(null)
        setErr(d('loc_err_lookup'))
      }
    }, 450)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, districtId])

  // the browser blocks "Post task" until a location has been understood
  useEffect(() => {
    pasteRef.current?.setCustomValidity(point ? '' : d('loc_pasteRequired'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point, dict])

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setRaw(text)
      else pasteRef.current?.focus()
    } catch {
      pasteRef.current?.focus() // permission denied: they can long-press and paste
    }
  }

  async function search() {
    const q = query.trim()
    if (q.length < 2 || !window.google) return
    setSearching(true)
    setSearchMsg(null)
    try {
      const { Place } = await window.google.maps.importLibrary('places')
      const center = mapRef.current?.getCenter()
      const { places } = await Place.searchByText({
        textQuery: q,
        fields: ['id', 'displayName', 'formattedAddress', 'location'],
        region: 'bd',
        language: lang,
        maxResultCount: 6,
        ...(center ? { locationBias: center } : {}),
      })
      const list: Result[] = (places ?? []).map((p: any) => ({
        id: p.id,
        name: p.displayName ?? '',
        address: p.formattedAddress ?? '',
        lat: p.location.lat(),
        lng: p.location.lng(),
      }))
      setResults(list)
      if (list.length === 0) setSearchMsg(d('loc_noResults'))
    } catch {
      setSearchMsg(d('loc_searchFailed2'))
    } finally {
      setSearching(false)
    }
  }

  function choose(r: Result) {
    setFromMap(r.lat, r.lng)
    setSource('geocoded')
    setPlaceId(r.id)
    setAddress(r.address)
    setPlaceName((cur) => cur || r.name)
    setResults([])
    showOnMap({ lat: r.lat, lng: r.lng })
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="place_name" className="mb-1 block text-sm font-semibold">{d('loc_placeName')}</label>
        <input id="place_name" name="place_name" required minLength={2} maxLength={160} value={placeName}
          onChange={(e) => setPlaceName(e.target.value)} placeholder={d('loc_placeNameHint')} className="field" />
      </div>

      <div className="space-y-2">
        <div>
          <label htmlFor="location_paste" className="mb-1 block text-sm font-semibold">{d('loc_pasteLabel')}</label>
          <div className="flex gap-2">
            <input id="location_paste" ref={pasteRef} value={raw} onChange={(e) => setRaw(e.target.value)}
              autoComplete="off" autoCorrect="off" spellCheck={false} placeholder={d('loc_pastePlaceholder')} className="field" />
            <button type="button" onClick={pasteFromClipboard} className="btn-ghost shrink-0 px-3" aria-label={d('loc_pasteBtn')}>
              <ClipboardPaste size={18} aria-hidden /> <span className="hidden sm:inline">{d('loc_pasteBtn')}</span>
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">{d('loc_pasteHint')}</p>
          <p className="mt-1 text-sm text-muted">{d('loc_pasteWhy')}</p>
        </div>

        {busy && <p role="status" className="text-sm font-semibold text-brand-dark">{d('loc_resolving')}</p>}
        {!busy && point && (
          <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 border-brand bg-brand-soft p-3 text-sm">
            <span className="font-semibold text-brand-dark">{d('loc_resolved')}: {point.lat}, {point.lng}</span>
            <a href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand underline underline-offset-2">
              {d('loc_checkOnMap')} <ExternalLink size={14} aria-hidden />
            </a>
          </p>
        )}
        {!busy && !point && err && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{err}</p>
        )}
      </div>

      <details className="group border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 font-semibold text-brand [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><MapPin size={18} aria-hidden /> {d('loc_stepsTitle')}</span>
          <ChevronDown size={18} aria-hidden className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-dashed border-line p-3">
          <p className="text-sm text-muted">{d('loc_stepsIntro')}</p>
          <ol className="space-y-5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden>{s.n}</span>
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold">{d(`loc_step${s.n}_title`)}</p>
                  <p className="text-sm text-ink/80">{d(`loc_step${s.n}_text`)}</p>
                  {s.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {s.images.map((img) => (
                        <Image key={img} src={`/steps/${img}.jpg`} alt={d(`loc_step${s.n}_title`)} width={360} height={780} unoptimized
                          className="h-auto w-40 border border-line sm:w-48" />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </details>

      {!mapsFailed && (
        <div className="space-y-2">
          {mapsReady && (
            <div>
              <label htmlFor="place_search" className="mb-1 block text-sm font-semibold">{d('loc_search')}</label>
              <div className="flex gap-2">
                <input id="place_search" value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search() } }}
                  placeholder={d('loc_searchHint')} className="field" enterKeyHint="search" />
                <button type="button" onClick={search} disabled={searching} className="btn-primary shrink-0 px-4" aria-label={d('loc_searchBtn')}>
                  <Search size={20} aria-hidden />
                </button>
              </div>
              {searchMsg && <p role="status" className="mt-1 text-sm text-muted">{searchMsg}</p>}
              {results.length > 0 && (
                <ul className="mt-2 divide-y divide-line border border-line bg-surface">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => choose(r)} className="flex w-full items-start gap-2 p-3 text-left hover:bg-brand-soft">
                        <MapPin size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                        <span>
                          <span className="block font-semibold">{r.name}</span>
                          <span className="block text-sm text-muted">{r.address}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div ref={mapEl} className="h-64 w-full border border-line bg-brand-soft" aria-label="map" />
          {mapsReady && <p className="text-sm text-muted">{d('loc_mapHint')}</p>}
        </div>
      )}

      <input type="hidden" name="latitude" value={point ? point.lat : ''} />
      <input type="hidden" name="longitude" value={point ? point.lng : ''} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="accuracy_m" value="" />
      <input type="hidden" name="google_place_id" value={placeId} />
      <input type="hidden" name="place_address" value={address} />
    </div>
  )
}
