// taskers/app/u/[id]/page.tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT } from '@/lib/i18n'
import { fmtDate, num } from '@/lib/format'
import Stars from '@/components/Stars'

export const metadata: Metadata = { title: 'Profile' }

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getT()
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/u/${id}`)
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const { data: p } = await supabase
    .from('profiles')
    .select('id, full_name, tasks_posted_count, tasks_completed_count, rating_avg, rating_count, upazila_name, created_at, account_status, district:bd_districts(name_en, name_bn)')
    .eq('id', id)
    .maybeSingle()
  if (!p) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, stars, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name)')
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })
    .limit(30)

  const district = p.district as any
  // Public location stops at sub-district level (post office / village stay private).
  const area = [p.upazila_name, district ? (locale === 'bn' ? district.name_bn : district.name_en) : null].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{p.full_name}</h1>
        {area && <p className="mt-1 text-muted">{area}</p>}
        <p className="text-sm text-muted">{t('u_member')} {fmtDate(p.created_at, locale)}</p>
        {p.account_status === 'suspended' && <p className="mt-2 rounded-md bg-danger px-3 py-1 text-sm font-semibold text-white">{t('u_suspended')}</p>}
      </header>

      <dl className="grid grid-cols-3 divide-x divide-line border-y border-line bg-surface text-center">
        <div className="py-4"><dd className="text-2xl font-bold">{num(p.tasks_posted_count, locale)}</dd><dt className="text-sm text-muted">{t('statsPosted')}</dt></div>
        <div className="py-4"><dd className="text-2xl font-bold">{num(p.tasks_completed_count, locale)}</dd><dt className="text-sm text-muted">{t('statsDone')}</dt></div>
        <div className="py-4">
          <dd className="text-2xl font-bold">{p.rating_count > 0 ? num(Number(p.rating_avg), locale) : '–'}</dd>
          <dt className="text-sm text-muted">{p.rating_count > 0 ? `${t('statsRating')} (${num(p.rating_count, locale)})` : t('noRating')}</dt>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('u_reviews')}</h2>
        {(reviews ?? []).length === 0 ? (
          <p className="border border-dashed border-line bg-surface px-4 py-8 text-center text-muted">{t('u_noReviews')}</p>
        ) : (
          <ul className="space-y-2">
            {(reviews as any[]).map((r) => (
              <li key={r.id} className="border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2"><Stars value={r.stars} /><span className="text-xs text-muted">{fmtDate(r.created_at, locale)}</span></div>
                {r.comment && <p className="mt-1">{r.comment}</p>}
                <p className="mt-1 text-sm text-muted">— {r.reviewer?.full_name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
