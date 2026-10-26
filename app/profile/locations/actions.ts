// taskers/app/profile/locations/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n'

export type LocationState = { error?: string; ok?: boolean } | undefined

const LABELS = ['home', 'office', 'school', 'college', 'university', 'regular_visit', 'other'] as const

const schema = z.object({
  label: z.enum(LABELS),
  custom_label: z.string().trim().max(40).optional(),
  locality_name: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(['gps', 'manual', 'geocoded']),
  division_id: z.number().int().positive().optional(),
  district_id: z.number().int().positive().optional(),
  upazila_name: z.string().trim().max(80).optional(),
  accuracy_m: z.number().min(0).max(100000).optional(),
})

function text(v: FormDataEntryValue | null) {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? undefined : s
}
function numeric(v: FormDataEntryValue | null) {
  const s = text(v)
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

export async function addLocation(_prev: LocationState, formData: FormData): Promise<LocationState> {
  const t = await getT()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: t('errAuth') }

  const parsed = schema.safeParse({
    label: text(formData.get('label')),
    custom_label: text(formData.get('custom_label')),
    locality_name: text(formData.get('locality_name')),
    latitude: numeric(formData.get('latitude')),
    longitude: numeric(formData.get('longitude')),
    source: text(formData.get('source')) ?? 'manual',
    accuracy_m: numeric(formData.get('accuracy_m')),
    division_id: numeric(formData.get('division_id')),
    district_id: numeric(formData.get('district_id')),
    upazila_name: text(formData.get('upazila_name')),
  })
  if (!parsed.success) return { error: t('errInvalid') }

  const { error } = await supabase.from('user_saved_locations').insert({
    user_id: user.id,
    ...parsed.data,
  })

  if (error) {
    // The database trigger is the real enforcement; this just gives a friendly message.
    if (error.message.includes('Maximum of 3')) return { error: t('limitReached') }
    return { error: t('errGeneric') }
  }

  revalidatePath('/profile/locations')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteLocation(formData: FormData) {
  const id = text(formData.get('id'))
  if (!id || !z.string().uuid().safeParse(id).success) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // RLS also restricts this to the owner's rows.
  await supabase.from('user_saved_locations').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/profile/locations')
  revalidatePath('/')
}
