import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MapPin, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT } from '@/lib/i18n'
import { updateProfile } from './actions'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const t = await getT()
  const locale = await getLocale()
  const { saved, error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/profile')

  const [{ data: profile }, { data: priv }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, tasks_posted_count, tasks_completed_count, rating_avg, rating_count, phone_verified')
      .eq('id', user.id)
      .single(),
    supabase.from('profile_private').select('date_of_birth').eq('user_id', user.id).single(),
  ])

  const num = (n: number) => n.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t('profileTitle')}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
        {!profile?.phone_verified && <p className="mt-1 text-sm text-muted">{t('phoneNotVerified')}</p>}
      </header>

      <dl className="grid grid-cols-3 divide-x divide-line border-y border-line bg-surface text-center">
        <div className="py-4">
          <dd className="text-2xl font-bold">{num(profile?.tasks_posted_count ?? 0)}</dd>
          <dt className="text-sm text-muted">{t('statsPosted')}</dt>
        </div>
        <div className="py-4">
          <dd className="text-2xl font-bold">{num(profile?.tasks_completed_count ?? 0)}</dd>
          <dt className="text-sm text-muted">{t('statsDone')}</dt>
        </div>
        <div className="py-4">
          <dd className="text-2xl font-bold">
            {(profile?.rating_count ?? 0) > 0 ? num(Number(profile?.rating_avg)) : '–'}
          </dd>
          <dt className="text-sm text-muted">{(profile?.rating_count ?? 0) > 0 ? t('statsRating') : t('noRating')}</dt>
        </div>
      </dl>

      <Link
        href="/profile/locations"
        className="flex items-center justify-between border border-line bg-surface p-4 hover:bg-brand-soft"
      >
        <span className="flex items-center gap-3 font-semibold">
          <MapPin aria-hidden className="text-brand" size={20} />
          {t('locationsTitle')}
        </span>
        <ChevronRight aria-hidden className="text-muted" size={20} />
      </Link>

      <form action={updateProfile} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-semibold">
            {t('fullName')}
          </label>
          <input id="full_name" name="full_name" required minLength={2} maxLength={100} defaultValue={profile?.full_name ?? ''} className="field" />
        </div>
        <div>
          <label htmlFor="date_of_birth" className="mb-1 block text-sm font-semibold">
            {t('dob')}
          </label>
          <input id="date_of_birth" name="date_of_birth" type="date" defaultValue={priv?.date_of_birth ?? ''} className="field" />
          <p className="mt-1 text-sm text-muted">{t('dobHint')}</p>
        </div>
        {saved && (
          <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            {t('saved')}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {t('errInvalid')}
          </p>
        )}
        <button type="submit" className="btn-primary w-full sm:w-auto">
          {t('saveChanges')}
        </button>
      </form>

      <form action="/auth/signout" method="post">
        <button type="submit" className="btn-ghost w-full sm:w-auto">
          {t('logout')}
        </button>
      </form>
    </div>
  )
}
