// taskers/app/profile/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MapPin, ChevronRight, ShieldAlert, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLocale, getT } from '@/lib/i18n'
import AddressFields from '@/components/AddressFields'
import type { District, Division } from '@/lib/types'
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

  const dict = await getDict('adr_')
  const [{ data: profile }, { data: priv }, { data: divisions }, { data: districts }, { data: warnings }, { data: isAdmin }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, tasks_posted_count, tasks_completed_count, rating_avg, rating_count, phone_verified, division_id, district_id, upazila_name, receives_task_alerts, account_status')
      .eq('id', user.id)
      .single(),
    supabase.from('profile_private').select('date_of_birth, post_office, village').eq('user_id', user.id).single(),
    supabase.from('bd_divisions').select('id, name_en, name_bn').order('name_en'),
    supabase.from('bd_districts').select('id, division_id, name_en, name_bn').order('name_en'),
    supabase.from('user_warnings').select('id, message').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.rpc('is_admin'),
  ])

  const num = (n: number) => n.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t('profileTitle')}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
        {!profile?.phone_verified && <p className="mt-1 text-sm text-muted">{t('phoneNotVerified')}</p>}
      </header>

      {(warnings ?? []).length > 0 && (
        <section className="space-y-2 border-l-4 border-danger bg-danger/5 p-4">
          <h2 className="flex items-center gap-2 font-bold text-danger"><ShieldAlert size={18} aria-hidden /> {t('profile_warnings')}</h2>
          {(warnings ?? []).map((w) => <p key={w.id} className="text-sm">{w.message}</p>)}
          <p className="text-xs text-muted">{t('profile_warningNote')}</p>
        </section>
      )}

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

      <div className="grid gap-3 sm:grid-cols-2">
      <Link href={`/u/${user.id}`} className="flex items-center justify-between border border-line bg-surface p-4 hover:bg-brand-soft">
        <span className="font-semibold">{t('profile_public')}</span>
        <ChevronRight aria-hidden className="text-muted" size={20} />
      </Link>
      {isAdmin === true && (
        <Link href="/admin/reports" className="flex items-center justify-between border border-line bg-surface p-4 hover:bg-brand-soft">
          <span className="flex items-center gap-2 font-semibold"><Shield size={18} aria-hidden className="text-brand" /> {t('admin_title')}</span>
          <ChevronRight aria-hidden className="text-muted" size={20} />
        </Link>
      )}
      </div>

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
          <input id="date_of_birth" name="date_of_birth" type="date" required={!priv?.date_of_birth} readOnly={!!priv?.date_of_birth} defaultValue={priv?.date_of_birth ?? ''} className="field read-only:bg-bg" />
          <p className="mt-1 text-sm text-muted">{priv?.date_of_birth ? t('profile_dobLocked') : t('dobHint')}</p>
        </div>

        <div className="space-y-3 border-t border-dashed border-line pt-4">
          <h2 className="font-bold">{t('profile_address')}</h2>
          <p className="text-sm text-muted">{t('profile_addressHint')}</p>
          <AddressFields
            dict={dict}
            lang={locale}
            divisions={(divisions ?? []) as Division[]}
            districts={(districts ?? []) as District[]}
            defaults={{ ...profile, post_office: priv?.post_office, village: priv?.village }}
          />
        </div>

        <label className="flex items-start gap-3 border border-line bg-surface p-3">
          <input type="checkbox" name="receives_task_alerts" defaultChecked={profile?.receives_task_alerts ?? true} className="mt-1 size-5 accent-[#0A5C66]" />
          <span><span className="block font-semibold">{t('profile_alerts')}</span><span className="text-sm text-muted">{t('profile_alertsHint')}</span></span>
        </label>
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
