// taskers/app/profile/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const opt = (max: number) => z.string().trim().max(max).transform((v) => (v === '' ? null : v))
const optInt = z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().positive().nullable())

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => {
      const born = Date.parse(d)
      if (Number.isNaN(born)) return false
      const min = new Date()
      min.setFullYear(min.getFullYear() - 18)
      return born <= min.getTime() && born > Date.parse('1900-01-01')
    })
    .nullable(),
  division_id: optInt,
  district_id: optInt,
  upazila_name: opt(80),
  post_office: opt(80),
  village: opt(80),
  receives_task_alerts: z.boolean(),
})

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dobRaw = String(formData.get('date_of_birth') ?? '').trim()
  const parsed = schema.safeParse({
    full_name: formData.get('full_name'),
    date_of_birth: dobRaw === '' ? null : dobRaw,
    division_id: formData.get('division_id'),
    district_id: formData.get('district_id'),
    upazila_name: String(formData.get('upazila_name') ?? ''),
    post_office: String(formData.get('post_office') ?? ''),
    village: String(formData.get('village') ?? ''),
    receives_task_alerts: formData.get('receives_task_alerts') === 'on',
  })
  if (!parsed.success) redirect('/profile?error=1')
  const v = parsed.data

  const { error: e1 } = await supabase
    .from('profiles')
    .update({
      full_name: v.full_name,
      division_id: v.division_id,
      district_id: v.district_id,
      upazila_name: v.upazila_name,
      receives_task_alerts: v.receives_task_alerts,
    })
    .eq('id', user.id)

  // date of birth can only be set once (DB trigger enforces it); only send it when the field is editable
  const priv: Record<string, string | null> = { post_office: v.post_office, village: v.village }
  if (v.date_of_birth) priv.date_of_birth = v.date_of_birth
  const { error: e2 } = await supabase.from('profile_private').update(priv).eq('user_id', user.id)
  if (e1 || e2) redirect('/profile?error=1')

  revalidatePath('/profile')
  redirect('/profile?saved=1')
}
