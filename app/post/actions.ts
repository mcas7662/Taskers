// taskers/app/post/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getT } from '@/lib/i18n'
import { callRpc } from '@/lib/rpc'
import { errorText } from '@/lib/errors'

export type PostState = { error?: string } | undefined

const txt = (max: number) => z.string().trim().max(max)
const optInt = z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().positive().nullable())

const schema = z.object({
  category_id: z.coerce.number().int().positive(),
  title: txt(120).min(3),
  description: txt(2000).min(5),
  place_name: txt(160).min(2),
  place_address: txt(300).optional(),
  google_place_id: txt(200).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  division_id: optInt,
  district_id: optInt,
  upazila_name: txt(80).min(1),
  post_office: txt(80).optional(),
  village: txt(80).optional(),
  area_type: z.enum(['urban', 'rural']),
  task_fee: z.coerce.number().int().min(10).max(50000),
  expense_estimate: z.coerce.number().int().min(0).max(100000).default(0),
  expense_note: txt(300).optional(),
  permission_confirmed: z.preprocess((v) => v === 'on', z.boolean()),
  expires_hours: z.coerce.number().int().min(1).max(168).default(72),
})

export async function createTask(_prev: PostState, formData: FormData): Promise<PostState> {
  const t = await getT()
  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: t('errInvalid') }
  const v = parsed.data

  const { data, error } = await callRpc<string>('create_task', {
    p_category_id: v.category_id,
    p_title: v.title,
    p_description: v.description,
    p_place_name: v.place_name,
    p_place_address: v.place_address || null,
    p_google_place_id: v.google_place_id || null,
    p_latitude: v.latitude,
    p_longitude: v.longitude,
    p_division_id: v.division_id,
    p_district_id: v.district_id,
    p_upazila_name: v.upazila_name,
    p_post_office: v.post_office || null,
    p_village: v.village || null,
    p_area_type: v.area_type,
    p_task_fee: v.task_fee,
    p_expense_estimate: v.expense_estimate,
    p_expense_note: v.expense_note || null,
    p_permission_confirmed: v.permission_confirmed,
    p_expires_hours: v.expires_hours,
  })
  if (error || !data) return { error: errorText(t, error) ?? t('errGeneric') }
  redirect(`/task/${data}?new=1`)
}
