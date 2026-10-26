// taskers/components/LocationForm.tsx
'use client'

import { useActionState, useEffect, useRef } from 'react'
import LocationPicker from './LocationPicker'
import AddressFields from './AddressFields'
import type { LocationState } from '@/app/profile/locations/actions'
import type { District, Division } from '@/lib/types'

type Props = {
  action: (prev: LocationState, formData: FormData) => Promise<LocationState>
  dict: Record<string, string>
  lang: 'bn' | 'en'
  options: { value: string; label: string }[]
  divisions: Division[]
  districts: District[]
}

export default function LocationForm({ action, dict, lang, options, divisions, districts }: Props) {
  const d = (k: string) => dict[k] ?? k
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4 border border-line bg-surface p-4">
      <h2 className="text-lg font-bold">{d('sp_addLocation')}</h2>

      <div>
        <label htmlFor="label" className="mb-1 block text-sm font-semibold">{d('sp_labelField')}</label>
        <select id="label" name="label" required defaultValue="home" className="field">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="custom_label" className="mb-1 block text-sm font-semibold">{d('sp_customLabel')}</label>
        <input id="custom_label" name="custom_label" maxLength={40} className="field" />
      </div>
      <div>
        <label htmlFor="locality_name" className="mb-1 block text-sm font-semibold">{d('sp_locality')}</label>
        <input id="locality_name" name="locality_name" maxLength={120} className="field" />
      </div>

      <LocationPicker dict={dict} lang={lang} withPlaceName={false} />
      <AddressFields dict={dict} lang={lang} divisions={divisions} districts={districts} withDetail={false} />
      <p className="text-sm text-muted">{d('sp_privacyNote')}</p>

      {state?.error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">{d('sp_saved')}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">{d('sp_savePlace')}</button>
    </form>
  )
}
