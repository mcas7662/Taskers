// taskers/lib/use-form-action.ts
'use client'

import { useActionState, useTransition, type FormEvent } from 'react'

/**
 * Like useActionState, but the form is NOT cleared when the server returns an error.
 *
 * React 19 resets every <form action={fn}> after the action finishes, even when the action
 * returned an error, so people lost everything they had typed (title, description, email...).
 * Submitting through onSubmit + startTransition keeps the values. `action` is still passed to
 * the <form> so the form works before JavaScript has loaded.
 */
export function useFormAction<S>(action: (prev: Awaited<S>, formData: FormData) => Promise<S>, initial: Awaited<S>) {
  const [state, formAction, actionPending] = useActionState<S, FormData>(action, initial)
  const [transitionPending, startTransition] = useTransition()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => formAction(fd))
  }

  return { state, formAction, pending: actionPending || transitionPending, onSubmit }
}
