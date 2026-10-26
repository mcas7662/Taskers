// taskers/components/TaskerSearch.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { District, Division } from '@/lib/types'
import type { TaskerRow } from '@/app/task/[id]/notify/actions'

type Props = {
  taskId: string
  dict: Record<string, string>
  lang: 'bn' | 'en'
  divisions: Division[]
  districts: District[]
  defaultRadius: number
  search: (input: unknown) => Promise<{ rows?: TaskerRow[]; error?: string }>
  invite: (input: unknown) => Promise<{ sent?: number; error?: string }>
}

const RADII = [500, 1000, 2000, 3000, 5000, 10000]

export default function TaskerSearch({ taskId, dict, lang, divisions, districts, defaultRadius, search, invite }: Props) {
  const d = (k: string) => dict[k] ?? k
  const nf = (n: number) => n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')
  const [mode, setMode] = useState<'radius' | 'area'>('radius')
  const [radius, setRadius] = useState(defaultRadius)
  const [div, setDiv] = useState('')
  const [dist, setDist] = useState('')
  const [upazila, setUpazila] = useState('')
  const [rows, setRows] = useState<TaskerRow[] | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const name = (x: { name_bn: string; name_en: string }) => (lang === 'bn' ? x.name_bn : x.name_en)

  const query = () => ({
    taskId,
    radius: mode === 'radius' ? radius : null,
    districtId: mode === 'area' && dist ? Number(dist) : null,
    upazila: mode === 'area' && upazila.trim() ? upazila.trim() : null,
  })

  function runSearch() {
    setMsg(null)
    start(async () => {
      const r = await search(query())
      if (r.error) return setMsg({ ok: false, text: r.error })
      setRows(r.rows ?? [])
      setPicked(new Set())
    })
  }

  function send(all: boolean) {
    setMsg(null)
    start(async () => {
      const r = await invite({ ...query(), userIds: all ? null : Array.from(picked) })
      if (r.error) return setMsg({ ok: false, text: r.error })
      setMsg({ ok: true, text: `${d('srch_sent')}: ${nf(r.sent ?? 0)}` })
      const s = await search(query())
      if (s.rows) setRows(s.rows)
      setPicked(new Set())
    })
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const fresh = (rows ?? []).filter((r) => !r.invited)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {(['radius', 'area'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setRows(null) }}
            className={`min-h-11 border px-3 font-semibold ${mode === m ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-surface'}`}>
            {d(m === 'radius' ? 'srch_byRadius' : 'srch_byArea')}
          </button>
        ))}
      </div>

      {mode === 'radius' ? (
        <div>
          <label htmlFor="radius" className="mb-1 block text-sm font-semibold">{d('srch_radius')}</label>
          <select id="radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="field">
            {RADII.map((r) => <option key={r} value={r}>{r < 1000 ? `${nf(r)} ${d('srch_m')}` : `${nf(r / 1000)} ${d('srch_km')}`}</option>)}
          </select>
          <p className="mt-1 text-sm text-muted">{d('srch_radiusHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label={d('adr_division')} value={div} onChange={(e) => { setDiv(e.target.value); setDist('') }} className="field">
              <option value="">{d('adr_division')}</option>
              {divisions.map((x) => <option key={x.id} value={x.id}>{name(x)}</option>)}
            </select>
            <select aria-label={d('adr_district')} value={dist} disabled={!div} onChange={(e) => setDist(e.target.value)} className="field">
              <option value="">{d('adr_district')}</option>
              {districts.filter((x) => String(x.division_id) === div).map((x) => <option key={x.id} value={x.id}>{name(x)}</option>)}
            </select>
          </div>
          <input aria-label={d('adr_upazila')} placeholder={d('adr_upazila')} value={upazila} onChange={(e) => setUpazila(e.target.value)} maxLength={80} className="field" />
        </div>
      )}

      <button type="button" onClick={runSearch} disabled={pending || (mode === 'area' && !dist)} className="btn-primary w-full">
        {pending ? d('srch_searching') : d('srch_search')}
      </button>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-brand-soft text-brand-dark' : 'border border-danger/30 bg-danger/5 text-danger'}`}>{msg.text}</p>
      )}

      {rows && (
        <section className="space-y-3">
          <p className="font-semibold">{nf(rows.length)} {d('srch_found')}</p>
          {rows.length === 0 && <p className="border border-dashed border-line bg-surface px-4 py-6 text-center text-muted">{d('srch_none')}</p>}
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.user_id} className="flex items-center gap-3 border border-line bg-surface p-3">
                <input type="checkbox" aria-label={r.full_name} disabled={r.invited} checked={picked.has(r.user_id)} onChange={() => toggle(r.user_id)} className="size-6 shrink-0 accent-[#0A5C66]" />
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${r.user_id}`} className="block truncate font-semibold underline-offset-2 hover:underline">{r.full_name || '—'}</Link>
                  <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    {r.rating_count > 0 && <span className="flex items-center gap-0.5"><Star size={13} className="fill-marigold text-marigold" aria-hidden />{Number(r.rating_avg).toFixed(1)} ({nf(r.rating_count)})</span>}
                    <span>{nf(r.tasks_completed_count)} {d('srch_done')}</span>
                    {r.distance_band_m && <span>{d('srch_within')} {r.distance_band_m < 1000 ? `${nf(r.distance_band_m)} ${d('srch_m')}` : `${nf(r.distance_band_m / 1000)} ${d('srch_km')}`}</span>}
                  </p>
                </div>
                {r.invited && <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-dark">{d('srch_notified')}</span>}
              </li>
            ))}
          </ul>
          {fresh.length > 0 && (
            <div className="sticky bottom-20 grid grid-cols-2 gap-2 bg-bg/95 py-2 md:bottom-4">
              <button type="button" disabled={pending || picked.size === 0} onClick={() => send(false)} className="btn-primary">{d('srch_sendSelected')} ({nf(picked.size)})</button>
              <button type="button" disabled={pending} onClick={() => send(true)} className="btn-ghost">{d('srch_sendAll')} ({nf(fresh.length)})</button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
