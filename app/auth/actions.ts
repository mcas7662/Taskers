'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n'
import { safeNext } from '@/lib/utils'

export type FormState = { error?: string; message?: string } | undefined

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
})

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(200),
})

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT()
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: t('errLogin') }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: t('errLogin') }

  redirect(safeNext(String(formData.get('next') ?? '/')))
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT()
  const parsed = signupSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: t('errSignup') }

  const h = await headers()
  const origin = h.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  })
  if (error) return { error: t('errSignup') }

  // If email confirmation is on in Supabase, there is no session yet.
  if (!data.session) return { message: t('checkEmail') }
  redirect('/')
}
