import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'
import { signup } from '@/app/auth/actions'
import { getT } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignupPage() {
  const t = await getT()
  return (
    <AuthForm
      mode="signup"
      action={signup}
      labels={{
        title: t('signup'),
        submit: t('signup'),
        fullName: t('fullName'),
        email: t('email'),
        password: t('password'),
        passwordHint: t('passwordHint'),
        switchPrompt: t('haveAccount'),
        switchLink: t('login'),
        switchHref: '/login',
      }}
    />
  )
}
