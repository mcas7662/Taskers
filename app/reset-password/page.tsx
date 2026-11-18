// taskers/app/reset-password/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import SimpleAuthForm from '@/components/SimpleAuthForm'
import { updatePassword } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n'

export const metadata: Metadata = { title: 'New password' }

// Reached from the reset email: /auth/callback logs the person in, then sends them here.
export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // no session = the link was old, already used, or opened in another browser
  if (!user) redirect('/forgot-password?e=link')

  const t = await getT()
  return (
    <SimpleAuthForm
      action={updatePassword}
      title={t('resetTitle')}
      fields={[
        { name: 'password', label: t('newPassword'), type: 'password', autoComplete: 'new-password', hint: t('passwordHint') },
        { name: 'password_confirm', label: t('confirmPassword'), type: 'password', autoComplete: 'new-password' },
      ]}
      submit={t('resetSubmit')}
      doneLink={{ href: '/', label: t('goHome') }}
    />
  )
}
