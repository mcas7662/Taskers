'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => {
      const ts = Date.parse(d)
      return !Number.isNaN(ts) && ts < Date.now() && ts > Date.parse('1900-01-01')
    })
    .nullable(),
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
  })
  if (!parsed.success) redirect('/profile?error=1')

  const { error: e1 } = await supabase.from('profiles').update({ full_name: parsed.data.full_name }).eq('id', user.id)
  const { error: e2 } = await supabase
    .from('profile_private')
    .update({ date_of_birth: parsed.data.date_of_birth })
    .eq('user_id', user.id)
  if (e1 || e2) redirect('/profile?error=1')

  revalidatePath('/profile')
  redirect('/profile?saved=1')
}
