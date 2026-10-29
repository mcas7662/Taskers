// taskers/components/AddressFields.tsx
'use client'

import { useState } from 'react'
import type { District, Division } from '@/lib/types'

type Props = {
  dict: Record<string, string>
  lang: 'bn' | 'en'
  divisions: Division[]
  districts: District[]
  defaults?: { division_id?: number | null; district_id?: number | null; upazila_name?: string | null; post_office?: string | null; village?: string | null }
  withDetail?: boolean // post office + village
  required?: boolean
  onDistrictChange?: (districtId: string) => void
}

export default function AddressFields({ dict, lang, divisions, districts, defaults, withDetail = true, required = false, onDistrictChange }: Props) {
  const d = (k: string) => dict[k] ?? k
  const [div, setDiv] = useState<string>(defaults?.division_id ? String(defaults.division_id) : '')
  const [dist, setDist] = useState<string>(defaults?.district_id ? String(defaults.district_id) : '')
  const name = (x: { name_bn: string; name_en: string }) => (lang === 'bn' ? x.name_bn : x.name_en)
  const list = districts.filter((x) => String(x.division_id) === div)

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="division_id" className="mb-1 block text-sm font-semibold">{d('adr_division')}</label>
          <select id="division_id" name="division_id" value={div} required={required}
            onChange={(e) => { setDiv(e.target.value); setDist(''); onDistrictChange?.('') }} className="field">
            <option value="">{d('adr_choose')}</option>
            {divisions.map((x) => <option key={x.id} value={x.id}>{name(x)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="district_id" className="mb-1 block text-sm font-semibold">{d('adr_district')}</label>
          <select id="district_id" name="district_id" value={dist} required={required} disabled={!div}
            onChange={(e) => { setDist(e.target.value); onDistrictChange?.(e.target.value) }} className="field">
            <option value="">{d('adr_choose')}</option>
            {list.map((x) => <option key={x.id} value={x.id}>{name(x)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="upazila_name" className="mb-1 block text-sm font-semibold">{d('adr_upazila')}</label>
        <input id="upazila_name" name="upazila_name" maxLength={80} required={required} defaultValue={defaults?.upazila_name ?? ''} className="field" />
      </div>
      {withDetail && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="post_office" className="mb-1 block text-sm font-semibold">{d('adr_postOffice')}</label>
            <input id="post_office" name="post_office" maxLength={80} defaultValue={defaults?.post_office ?? ''} className="field" />
          </div>
          <div>
            <label htmlFor="village" className="mb-1 block text-sm font-semibold">{d('adr_village')}</label>
            <input id="village" name="village" maxLength={80} defaultValue={defaults?.village ?? ''} className="field" />
          </div>
        </div>
      )}
    </div>
  )
}
