// taskers/app/forgot-password/page.tsx
import type { Metadata } from 'next'
import SimpleAuthForm from '@/components/SimpleAuthForm'
import { requestPasswordReset } from '@/app/auth/actions'
import { getT } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Reset password' }

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const t = await getT()
  const { e } = await searchParams
  return (
    <SimpleAuthForm
      action={requestPasswordReset}
      title={t('forgotTitle')}
      intro={t('forgotIntro')}
      notice={e === 'link' ? t('errAuthLink') : undefined}
      fields={[{ name: 'email', label: t('email'), type: 'email', autoComplete: 'email' }]}
      submit={t('forgotSubmit')}
      footerLink={{ href: '/login', label: `← ${t('backToLogin')}` }}
    />
  )
}
