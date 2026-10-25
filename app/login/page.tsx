import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'
import { login } from '@/app/auth/actions'
import { getT } from '@/lib/i18n'
import { safeNext } from '@/lib/utils'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = await getT()
  const { next } = await searchParams
  return (
    <AuthForm
      mode="login"
      action={login}
      next={safeNext(next)}
      labels={{
        title: t('login'),
        submit: t('login'),
        email: t('email'),
        password: t('password'),
        switchPrompt: t('noAccount'),
        switchLink: t('signup'),
        switchHref: '/signup',
      }}
    />
  )
}
