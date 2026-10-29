// taskers/components/PostTaskForm.tsx
'use client'

import { useActionState, useState } from 'react'
import TaskLocationPicker from './TaskLocationPicker'
import AddressFields from './AddressFields'
import type { PostState } from '@/app/post/actions'
import type { District, Division } from '@/lib/types'

type Cat = { id: number; label: string; requires_permission: boolean }
type DistrictRef = { id: number; lat: number | null; lng: number | null }
type Props = {
  action: (prev: PostState, fd: FormData) => Promise<PostState>
  dict: Record<string, string>
  lang: 'bn' | 'en'
  categories: Cat[]
  divisions: Division[]
  districts: District[]
  districtRefs: DistrictRef[]
  /** Category used when the poster writes their own type of task. */
  otherCategoryId: number | null
}

const EXPIRY = [6, 24, 48, 72, 168]
const CUSTOM = 'custom'

export default function PostTaskForm({ action, dict, lang, categories, divisions, districts, districtRefs, otherCategoryId }: Props) {
  const d = (k: string) => dict[k] ?? k
  const [state, formAction, pending] = useActionState(action, undefined)
  const [cat, setCat] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [area, setArea] = useState<'urban' | 'rural'>('urban')
  const [fee, setFee] = useState('')
  const [exp, setExp] = useState('')
  const isCustom = cat === CUSTOM
  const needsPermission = categories.find((c) => String(c.id) === cat)?.requires_permission ?? false
  const total = (Number(fee) || 0) + (Number(exp) || 0)
  const fmt = (n: number) => '৳' + n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4">
        <div>
          <label htmlFor="category_choice" className="mb-1 block text-sm font-semibold">{d('post_category')}</label>
          <select id="category_choice" required value={cat} onChange={(e) => setCat(e.target.value)} className="field">
            <option value="">{d('adr_choose')}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            {otherCategoryId != null && <option value={CUSTOM}>{d('post_categoryCustom')}</option>}
          </select>
          <input type="hidden" name="category_id" value={isCustom ? (otherCategoryId ?? '') : cat} />
        </div>
        {isCustom && (
          <div>
            <label htmlFor="custom_category" className="mb-1 block text-sm font-semibold">{d('post_customLabel')}</label>
            <input id="custom_category" name="custom_category" required minLength={3} maxLength={60} placeholder={d('post_customHint')} className="field" />
          </div>
        )}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-semibold">{d('post_title')}</label>
          <input id="title" name="title" required minLength={3} maxLength={120} placeholder={d('post_titleHint')} className="field" />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">{d('post_description')}</label>
          <textarea id="description" name="description" required minLength={5} maxLength={2000} rows={4} placeholder={d('post_descriptionHint')} className="field" />
        </div>
      </section>

      <section className="space-y-3 border-t border-dashed border-line pt-5">
        <h2 className="text-lg font-bold">{d('post_where')}</h2>
        <TaskLocationPicker dict={dict} lang={lang} districtId={districtId} districtRefs={districtRefs} />
        <AddressFields dict={dict} lang={lang} divisions={divisions} districts={districts} withDetail={false} required onDistrictChange={setDistrictId} />
        <p className="-mt-1 text-sm text-muted">{d('post_upazilaHint')}</p>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">{d('post_areaType')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['urban', 'rural'] as const).map((a) => (
              <label key={a} className={`flex min-h-12 cursor-pointer items-center gap-2 border px-3 py-2 ${area === a ? 'border-brand bg-brand-soft font-semibold' : 'border-line bg-surface'}`}>
                <input type="radio" name="area_type" value={a} checked={area === a} onChange={() => setArea(a)} className="accent-[#0A5C66]" />
                {d(a === 'urban' ? 'post_urban' : 'post_rural')}
              </label>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted">{d(area === 'urban' ? 'post_urbanHint' : 'post_ruralHint')}</p>
        </fieldset>
      </section>

      <section className="space-y-4 border-t border-dashed border-line pt-5">
        <h2 className="text-lg font-bold">{d('post_money')}</h2>
        <div>
          <label htmlFor="task_fee" className="mb-1 block text-sm font-semibold">{d('post_fee')}</label>
          <input id="task_fee" name="task_fee" type="number" inputMode="numeric" min={10} max={50000} required value={fee} onChange={(e) => setFee(e.target.value)} className="field" />
          <p className="mt-1 text-sm text-muted">{d('post_feeHint')}</p>
        </div>
        <div>
          <label htmlFor="expense_estimate" className="mb-1 block text-sm font-semibold">{d('post_expense')}</label>
          <input id="expense_estimate" name="expense_estimate" type="number" inputMode="numeric" min={0} max={100000} value={exp} onChange={(e) => setExp(e.target.value)} className="field" />
          <p className="mt-1 text-sm text-muted">{d('post_expenseHint')}</p>
        </div>
        <div>
          <label htmlFor="expense_note" className="mb-1 block text-sm font-semibold">{d('post_expenseNote')}</label>
          <input id="expense_note" name="expense_note" maxLength={300} placeholder={d('post_expenseNoteHint')} className="field" />
        </div>
        <dl className="divide-y divide-dashed divide-line border border-line bg-surface px-4 text-sm">
          <div className="flex justify-between py-2"><dt>{d('post_taskerEarns')}</dt><dd className="font-bold">{fmt(Number(fee) || 0)}</dd></div>
          <div className="flex justify-between py-2 text-muted"><dt>{d('post_expenseNotEarned')}</dt><dd>{fmt(Number(exp) || 0)}</dd></div>
          <div className="flex justify-between py-2 font-bold"><dt>{d('post_youPay')}</dt><dd>{fmt(total)}</dd></div>
        </dl>
        <p className="text-sm text-muted">{d('post_prepayNote')}</p>
      </section>

      <section className="space-y-4 border-t border-dashed border-line pt-5">
        <div>
          <label htmlFor="expires_hours" className="mb-1 block text-sm font-semibold">{d('post_expires')}</label>
          <select id="expires_hours" name="expires_hours" defaultValue="72" className="field">
            {EXPIRY.map((h) => <option key={h} value={h}>{h < 24 ? `${h} ${d('post_hours')}` : `${h / 24} ${d('post_days')}`}</option>)}
          </select>
        </div>
        {needsPermission && (
          <label className="flex gap-3 border-l-4 border-marigold bg-marigold-soft p-3 text-sm">
            <input type="checkbox" name="permission_confirmed" required className="mt-1 size-5 shrink-0 accent-[#0A5C66]" />
            <span>{d('post_permission')}</span>
          </label>
        )}
        <p className="text-sm text-muted">{d('post_rules')}</p>
      </section>

      {state?.error && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? d('post_posting') : d('post_submit')}</button>
    </form>
  )
}
