'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function toggleLocale() {
  const store = await cookies()
  const current = store.get('locale')?.value === 'en' ? 'en' : 'bn'
  store.set('locale', current === 'en' ? 'bn' : 'en', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
