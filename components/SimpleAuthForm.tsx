// taskers/components/SimpleAuthForm.tsx
'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useFormAction } from '@/lib/use-form-action'
import type { FormState } from '@/app/auth/actions'

type Field = { name: string; label: string; type: 'email' | 'password'; autoComplete: string; hint?: string }

/** Small form used by "forgot password" and "set a new password". */
export default function SimpleAuthForm({
  action, title, intro, fields, submit, notice, footerLink, doneLink,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  title: string
  intro?: string
  fields: Field[]
  submit: string
  notice?: string
  footerLink?: { href: string; label: string }
  /** shown instead of the form once the action succeeded */
  doneLink?: { href: string; label: string }
}) {
  const { state, formAction, pending, onSubmit } = useFormAction(action, undefined)
  // Next.js keeps the old scroll position when the top of the new page is still on screen,
  // which left the heading hidden under the sticky header (e.g. login -> signup). Start at the top.
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const done = !!state?.message && !!doneLink

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-3 text-3xl font-bold">{title}</h1>
      {intro && <p className="mb-6 text-muted">{intro}</p>}

      {notice && !state && (
        <p role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{notice}</p>
      )}

      {done ? (
        <div className="space-y-4">
          <p role="status" className="rounded-md border border-brand/30 bg-brand-soft px-3 py-2 text-sm text-brand-dark">{state.message}</p>
          <Link href={doneLink.href} className="btn-primary w-full">{doneLink.label}</Link>
        </div>
      ) : (
        <form action={formAction} onSubmit={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="mb-1 block text-sm font-semibold">{f.label}</label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                required
                minLength={f.type === 'password' ? 8 : undefined}
                maxLength={f.type === 'password' ? 200 : 254}
                autoComplete={f.autoComplete}
                inputMode={f.type === 'email' ? 'email' : undefined}
                className="field"
              />
              {f.hint && <p className="mt-1 text-sm text-muted">{f.hint}</p>}
            </div>
          ))}
          {state?.error && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          {state?.message && (
            <p role="status" className="rounded-md border border-brand/30 bg-brand-soft px-3 py-2 text-sm text-brand-dark">{state.message}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full">{submit}</button>
        </form>
      )}

      {footerLink && (
        <p className="mt-6 text-sm">
          <Link href={footerLink.href} className="inline-block py-2 font-semibold text-brand underline underline-offset-2">{footerLink.label}</Link>
        </p>
      )}
    </div>
  )
}
