// taskers/components/AuthForm.tsx
'use client'

import Link from 'next/link'
import { useFormAction } from '@/lib/use-form-action'
import type { FormState } from '@/app/auth/actions'

type Props = {
  mode: 'login' | 'signup'
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  next?: string
  /** e.g. "the email link has expired" after /auth/callback fails */
  notice?: string
  labels: {
    title: string
    submit: string
    email: string
    password: string
    passwordHint?: string
    fullName?: string
    dob?: string
    dobHint?: string
    switchPrompt: string
    switchLink: string
    switchHref: string
  }
}

export default function AuthForm({ mode, action, next, notice, labels }: Props) {
  const { state, formAction, pending, onSubmit } = useFormAction(action, undefined)

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold">{labels.title}</h1>
      <form action={formAction} onSubmit={onSubmit} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === 'signup' && (
          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-semibold">
              {labels.fullName}
            </label>
            <input id="full_name" name="full_name" required minLength={2} maxLength={100} autoComplete="name" className="field" />
          </div>
        )}
        {mode === 'signup' && (
          <div>
            <label htmlFor="date_of_birth" className="mb-1 block text-sm font-semibold">{labels.dob}</label>
            <input id="date_of_birth" name="date_of_birth" type="date" required max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10)} autoComplete="bday" className="field" />
            <p className="mt-1 text-sm text-muted">{labels.dobHint}</p>
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold">
            {labels.email}
          </label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold">
            {labels.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === 'signup' ? 8 : undefined}
            maxLength={200}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="field"
          />
          {labels.passwordHint && <p className="mt-1 text-sm text-muted">{labels.passwordHint}</p>}
        </div>

        {notice && !state && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {notice}
          </p>
        )}
        {state?.error && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" className="rounded-md border border-brand/30 bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            {state.message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {labels.submit}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {labels.switchPrompt}{' '}
        <Link href={labels.switchHref} className="font-semibold text-brand underline underline-offset-2">
          {labels.switchLink}
        </Link>
      </p>
    </div>
  )
}
