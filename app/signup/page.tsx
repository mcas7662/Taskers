// taskers/app/signup/page.tsx
import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'
import { signup } from '@/app/auth/actions'
import { getT } from '@/lib/i18n'
import { safeNext } from '@/lib/utils'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = await getT()
  const { next } = await searchParams
  const safe = safeNext(next)
  return (
    <AuthForm
      mode="signup"
      action={signup}
      next={safe}
      labels={{
        title: t('signup'),
        submit: t('signup'),
        fullName: t('fullName'),
        dob: t('dob'),
        dobHint: t('signupDobHint'),
        email: t('email'),
        password: t('password'),
        passwordHint: t('passwordHint'),
        switchPrompt: t('haveAccount'),
        switchLink: t('login'),
        switchHref: safe !== '/' ? `/login?next=${encodeURIComponent(safe)}` : '/login',
      }}
    />
  )
}
