'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Crosshair } from 'lucide-react'
import type { LocationState } from '@/app/profile/locations/actions'

type Labels = Record<
  | 'addLocation' | 'labelField' | 'customLabel' | 'locality' | 'useGps' | 'gpsWhy' | 'gpsWorking'
  | 'gpsDenied' | 'gpsUnavailable' | 'gpsDone' | 'latitude' | 'longitude' | 'manualNote' | 'savePlace' | 'saved',
  string
> & { options: { value: string; label: string }[] }

type Props = {
  action: (prev: LocationState, formData: FormData) => Promise<LocationState>
  labels: Labels
}

export default function LocationForm({ action, labels }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [accuracy, setAccuracy] = useState('')
  const [source, setSource] = useState<'gps' | 'manual'>('manual')
  const [gpsMsg, setGpsMsg] = useState<string | null>(null)
  const [gpsBusy, setGpsBusy] = useState(false)

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      setLat('')
      setLng('')
      setAccuracy('')
      setSource('manual')
      setGpsMsg(null)
    }
  }, [state])

  function useCurrentPosition() {
    if (!('geolocation' in navigator)) {
      setGpsMsg(labels.gpsUnavailable)
      return
    }
    setGpsBusy(true)
    setGpsMsg(labels.gpsWorking)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setAccuracy(String(Math.round(pos.coords.accuracy)))
        setSource('gps')
        setGpsMsg(`${labels.gpsDone} (±${Math.round(pos.coords.accuracy)} m)`)
        setGpsBusy(false)
      },
      (err) => {
        setGpsMsg(err.code === err.PERMISSION_DENIED ? labels.gpsDenied : labels.gpsUnavailable)
        setGpsBusy(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function manualEdit(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
      setSource('manual')
      setAccuracy('')
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4 border border-line bg-surface p-4">
      <h2 className="text-lg font-bold">{labels.addLocation}</h2>

      <div>
        <label htmlFor="label" className="mb-1 block text-sm font-semibold">{labels.labelField}</label>
        <select id="label" name="label" required defaultValue="home" className="field">
          {labels.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="custom_label" className="mb-1 block text-sm font-semibold">{labels.customLabel}</label>
          <input id="custom_label" name="custom_label" maxLength={40} className="field" />
        </div>
        <div>
          <label htmlFor="locality_name" className="mb-1 block text-sm font-semibold">{labels.locality}</label>
          <input id="locality_name" name="locality_name" maxLength={120} className="field" />
        </div>
      </div>

      <div className="space-y-2 border-l-4 border-brand bg-brand-soft p-3">
        <button type="button" onClick={useCurrentPosition} disabled={gpsBusy} className="btn-ghost">
          <Crosshair aria-hidden size={18} /> {labels.useGps}
        </button>
        <p className="text-sm text-ink/80">{labels.gpsWhy}</p>
        {gpsMsg && <p role="status" className="text-sm font-semibold text-brand-dark">{gpsMsg}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="latitude" className="mb-1 block text-sm font-semibold">{labels.latitude}</label>
          <input id="latitude" name="latitude" required inputMode="decimal" placeholder="23.8103" value={lat} onChange={manualEdit(setLat)} className="field" />
        </div>
        <div>
          <label htmlFor="longitude" className="mb-1 block text-sm font-semibold">{labels.longitude}</label>
          <input id="longitude" name="longitude" required inputMode="decimal" placeholder="90.4125" value={lng} onChange={manualEdit(setLng)} className="field" />
        </div>
      </div>
      <p className="text-sm text-muted">{labels.manualNote}</p>

      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="accuracy_m" value={accuracy} />

      {state?.error && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">{labels.saved}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">{labels.savePlace}</button>
    </form>
  )
}
