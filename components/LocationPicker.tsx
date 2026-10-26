// taskers/components/LocationPicker.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, Search, MapPin } from 'lucide-react'
import { loadGoogleMaps, MAPS_KEY } from '@/lib/maps'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Result = { id: string; name: string; address: string; lat: number; lng: number }
type Props = {
  dict: Record<string, string>
  lang: 'bn' | 'en'
  /** show the "name of the place" input (task location). Saved places use their own label fields. */
  withPlaceName?: boolean
  defaultPlaceName?: string
}

const BD_CENTER = { lat: 23.685, lng: 90.3563 }

export default function LocationPicker({ dict, lang, withPlaceName = true, defaultPlaceName = '' }: Props) {
  const d = (k: string) => dict[k] ?? k
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsFailed, setMapsFailed] = useState(!MAPS_KEY)

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [accuracy, setAccuracy] = useState('')
  const [source, setSource] = useState<'gps' | 'manual' | 'geocoded'>('manual')
  const [placeId, setPlaceId] = useState('')
  const [placeName, setPlaceName] = useState(defaultPlaceName)
  const [address, setAddress] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const place = useCallback((la: number, ln: number, pan = true) => {
    setLat(la.toFixed(6))
    setLng(ln.toFixed(6))
    const g = window.google
    if (g && mapRef.current) {
      const pos = { lat: la, lng: ln }
      if (!markerRef.current) {
        markerRef.current = new g.maps.Marker({ map: mapRef.current, position: pos, draggable: true })
        markerRef.current.addListener('dragend', () => {
          const p = markerRef.current.getPosition()
          setLat(p.lat().toFixed(6))
          setLng(p.lng().toFixed(6))
          setSource('manual')
          setPlaceId('')
          setAccuracy('')
        })
      } else {
        markerRef.current.setPosition(pos)
      }
      if (pan) {
        mapRef.current.panTo(pos)
        if ((mapRef.current.getZoom() ?? 0) < 16) mapRef.current.setZoom(17)
      }
    }
  }, [])

  // load the map once
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
          setSource('manual')
          setPlaceId('')
          setAccuracy('')
          place(e.latLng.lat(), e.latLng.lng(), false)
        })
        setMapsReady(true)
      })
      .catch(() => setMapsFailed(true))
    return () => {
      cancelled = true
    }
  }, [lang, place])

  async function search() {
    const q = query.trim()
    if (q.length < 2 || !window.google) return
    setBusy(true)
    setMsg(null)
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
      if (list.length === 0) setMsg(d('loc_noResults'))
    } catch {
      setMsg(d('loc_searchFailed'))
    } finally {
      setBusy(false)
    }
  }

  function choose(r: Result) {
    setSource('geocoded')
    setPlaceId(r.id)
    setAccuracy('')
    setAddress(r.address)
    if (withPlaceName) setPlaceName(r.name)
    setResults([])
    place(r.lat, r.lng)
  }

  function useGps() {
    if (!('geolocation' in navigator)) return setMsg(d('loc_gpsUnavailable'))
    setBusy(true)
    setMsg(d('loc_gpsWorking'))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSource('gps')
        setPlaceId('')
        setAccuracy(String(Math.round(pos.coords.accuracy)))
        place(pos.coords.latitude, pos.coords.longitude)
        setMsg(`${d('loc_gpsDone')} (±${Math.round(pos.coords.accuracy)} m)`)
        setBusy(false)
      },
      (err) => {
        setMsg(err.code === err.PERMISSION_DENIED ? d('loc_gpsDenied') : d('loc_gpsUnavailable'))
        setBusy(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function manual(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
      setSource('manual')
      setPlaceId('')
      setAccuracy('')
    }
  }

  const hasPoint = lat !== '' && lng !== ''

  return (
    <div className="space-y-3">
      {withPlaceName && (
        <div>
          <label htmlFor="place_name" className="mb-1 block text-sm font-semibold">{d('loc_placeName')}</label>
          <input id="place_name" name="place_name" required minLength={2} maxLength={160} value={placeName}
            onChange={(e) => setPlaceName(e.target.value)} placeholder={d('loc_placeNameHint')} className="field" />
        </div>
      )}

      {mapsReady && (
        <div>
          <label htmlFor="place_search" className="mb-1 block text-sm font-semibold">{d('loc_search')}</label>
          <div className="flex gap-2">
            <input id="place_search" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search() } }}
              placeholder={d('loc_searchHint')} className="field" enterKeyHint="search" />
            <button type="button" onClick={search} disabled={busy} className="btn-primary shrink-0 px-4" aria-label={d('loc_searchBtn')}>
              <Search size={20} aria-hidden />
            </button>
          </div>
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

      {!mapsFailed && <div ref={mapEl} className="h-64 w-full border border-line bg-brand-soft" aria-label="map" />}
      {mapsReady && <p className="text-sm text-muted">{d('loc_mapHint')}</p>}
      {mapsFailed && <p className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">{d('loc_noMap')}</p>}

      <div className="space-y-2 border-l-4 border-brand bg-brand-soft p-3">
        <button type="button" onClick={useGps} disabled={busy} className="btn-ghost">
          <Crosshair aria-hidden size={18} /> {d('loc_useGps')}
        </button>
        <p className="text-sm text-ink/80">{d('loc_gpsWhy')}</p>
        {msg && <p role="status" className="text-sm font-semibold text-brand-dark">{msg}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="latitude" className="mb-1 block text-sm font-semibold">{d('loc_lat')}</label>
          <input id="latitude" name="latitude" required inputMode="decimal" placeholder="23.8103" value={lat}
            onChange={manual(setLat)} onBlur={() => { const a = Number(lat), b = Number(lng); if (Number.isFinite(a) && Number.isFinite(b) && lat && lng) place(a, b) }} className="field" />
        </div>
        <div>
          <label htmlFor="longitude" className="mb-1 block text-sm font-semibold">{d('loc_lng')}</label>
          <input id="longitude" name="longitude" required inputMode="decimal" placeholder="90.4125" value={lng}
            onChange={manual(setLng)} onBlur={() => { const a = Number(lat), b = Number(lng); if (Number.isFinite(a) && Number.isFinite(b) && lat && lng) place(a, b) }} className="field" />
        </div>
      </div>
      {!hasPoint && <p className="text-sm text-muted">{d('loc_pickFirst')}</p>}

      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="accuracy_m" value={accuracy} />
      <input type="hidden" name="google_place_id" value={placeId} />
      <input type="hidden" name="place_address" value={address} />
    </div>
  )
}
