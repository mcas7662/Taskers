import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'
import { login } from '@/app/auth/actions'
import { getT } from '@/lib/i18n'
import { safeNext } from '@/lib/utils'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const t = await getT()
  const { next, error } = await searchParams
  const safe = safeNext(next)
  return (
    <AuthForm
      mode="login"
      action={login}
      next={safe}
      notice={error === 'link' ? t('errAuthLink') : undefined}
      labels={{
        title: t('login'),
        submit: t('login'),
        email: t('email'),
        password: t('password'),
        forgot: t('forgotLink'),
        switchPrompt: t('noAccount'),
        switchLink: t('signup'),
        switchHref: safe !== '/' ? `/signup?next=${encodeURIComponent(safe)}` : '/signup',
      }}
    />
  )
}
