// taskers/app/auth/actions.ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getT, type T } from '@/lib/i18n'
import { safeNext } from '@/lib/utils'

export type FormState = { error?: string; message?: string } | undefined

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
})

function isAdult(d: string) {
  const born = Date.parse(d)
  if (Number.isNaN(born)) return false
  const min = new Date()
  min.setFullYear(min.getFullYear() - 18)
  return born <= min.getTime() && born > Date.parse('1900-01-01')
}

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(200),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isAdult),
})

/** Turns a Supabase Auth error into a message the person can act on. */
function authErrorText(t: T, err: { code?: string; status?: number; message?: string }, fallback: string) {
  const code = err.code ?? ''
  const msg = (err.message ?? '').toLowerCase()
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return t('errLoginUnconfirmed')
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return t('errSignupExists')
  if (code === 'weak_password' || msg.includes('password should')) return t('errSignupWeakPassword')
  if (code.startsWith('over_') || err.status === 429 || msg.includes('rate limit')) return t('errRateLimit')
  return fallback
}

/** The public address of the site, used in the confirmation email link. */
async function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '')
  if (fromEnv) return fromEnv
  const h = await headers()
  return h.get('origin') ?? ''
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT()
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: t('errLogin') }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: authErrorText(t, error, t('errLogin')) }

  redirect(safeNext(String(formData.get('next') ?? '/')))
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT()
  const parsed = signupSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    date_of_birth: formData.get('date_of_birth'),
  })
  if (!parsed.success) {
    // say which field is wrong instead of a generic message
    const field = parsed.error.issues[0]?.path[0]
    if (field === 'date_of_birth') return { error: t('errSignupUnderage') }
    if (field === 'password') return { error: t('errSignupWeakPassword') }
    if (field === 'full_name') return { error: t('errSignupName') }
    if (field === 'email') return { error: t('errSignupEmail') }
    return { error: t('errSignup') }
  }

  const origin = await siteOrigin()
  const next = safeNext(String(formData.get('next') ?? '/'))

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, date_of_birth: parsed.data.date_of_birth },
      // "?next=" only when needed: the plain callback URL is the one listed in Supabase Redirect URLs
      emailRedirectTo: origin ? `${origin}/auth/callback${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}` : undefined,
    },
  })
  if (error) return { error: authErrorText(t, error, t('errSignup')) }

  // If email confirmation is on in Supabase, there is no session yet.
  if (!data.session) return { message: t('checkEmail') }
  redirect(next)
}
