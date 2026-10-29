// taskers/app/task/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { MapPin, MessageCircle, BellRing, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT, type TKey } from '@/lib/i18n'
import { errorText } from '@/lib/errors'
import { fmtDateTime, taka, timeAgo, num } from '@/lib/format'
import StatusBadge from '@/components/StatusBadge'
import Stars from '@/components/Stars'
import DeleteLocationButton from '@/components/DeleteLocationButton'
import { acceptOffer, cancelTask, declineOffer, makeOffer, withdrawOffer } from './actions'

export const metadata: Metadata = { title: 'Task' }

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ e?: string; ok?: string; new?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const t = await getT()
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/task/${id}`)
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const { data: task } = await supabase
    .from('tasks')
    .select(
      '*, category:task_categories(name_en, name_bn), poster:profiles!tasks_poster_id_fkey(id, full_name, rating_avg, rating_count, tasks_completed_count)'
    )
    .eq('id', id)
    .maybeSingle()
  if (!task) notFound()

  const isPoster = task.poster_id === user.id
  const poster = task.poster as any
  const cat = task.category as any

  const [{ data: assignmentRows }, { data: offers }] = await Promise.all([
    supabase.from('assignments').select('id, tasker_id, status').eq('task_id', id).neq('status', 'cancelled').limit(1),
    supabase
      .from('task_offers')
      .select('id, tasker_id, amount, kind, message, status, decline_reason, created_at, tasker:profiles!task_offers_tasker_id_fkey(id, full_name, rating_avg, rating_count, tasks_completed_count)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
  ])
  const assignment = assignmentRows?.[0] as { id: string; tasker_id: string; status: string } | undefined
  const myOffer = (offers ?? []).find((o: any) => o.tasker_id === user.id) as any
  const expired = task.status === 'open' && new Date(task.expires_at) <= new Date()
  const open = task.status === 'open' && !expired
  const errMsg = errorText(t, sp.e)

  return (
    <article className="mx-auto max-w-xl space-y-6">
      <Link href={isPoster ? '/tasks' : '/'} className="text-sm font-semibold text-brand underline underline-offset-2">
        ← {t(isPoster ? 'navTasks' : 'navHome')}
      </Link>

      {sp.new && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">{t('task_posted')}</p>}
      {sp.ok && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">{t(`task_ok_${sp.ok}` as TKey)}</p>}
      {errMsg && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{errMsg}</p>}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={expired ? 'cancelled' : task.status} />
          {(task.custom_category || cat) && <span className="text-sm font-semibold text-brand">{task.custom_category || (locale === 'bn' ? cat.name_bn : cat.name_en)}</span>}
        </div>
        <h1 className="text-3xl font-bold leading-tight">{task.title}</h1>
        <p className="flex items-center gap-1 text-sm text-muted"><Clock size={14} aria-hidden /> {timeAgo(task.created_at, locale)} · {t('task_expires')} {fmtDateTime(task.expires_at, locale)}</p>
      </header>

      <section className="space-y-2 border border-line bg-surface p-4">
        <p className="flex items-start gap-2 font-semibold">
          <MapPin size={18} aria-hidden className="mt-0.5 shrink-0 text-brand" />
          <span>
            {task.place_name}
            <span className="block text-sm font-normal text-muted">{[task.place_address, task.village, task.post_office, task.upazila_name].filter(Boolean).join(', ')}</span>
          </span>
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-semibold text-brand underline underline-offset-2"
        >
          {t('task_openMap')}
        </a>
      </section>

      <section>
        <h2 className="mb-1 font-bold">{t('post_description')}</h2>
        <p className="whitespace-pre-wrap text-ink/90">{task.description}</p>
      </section>

      <dl className="divide-y divide-dashed divide-line border border-line bg-surface px-4">
        <div className="-mx-4 flex items-baseline justify-between gap-4 bg-marigold-soft/70 px-4 py-3">
          <dt className="font-semibold">{t('feeTask')}</dt>
          <dd className="text-xl font-bold">{taka(task.task_fee, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3 text-muted">
          <dt>{t('task_expenseEst')}</dt>
          <dd>{taka(task.expense_estimate, locale)}</dd>
        </div>
        {task.expense_note && <p className="py-2 text-sm text-muted">{task.expense_note}</p>}
        <p className="py-2 text-xs text-muted">{t('task_expenseNote')}</p>
      </dl>

      {!isPoster && poster && (
        <Link href={`/u/${poster.id}`} className="flex items-center justify-between border border-line bg-surface p-4">
          <span>
            <span className="block text-xs text-muted">{t('task_postedBy')}</span>
            <span className="font-semibold">{poster.full_name}</span>
          </span>
          <span className="text-right text-sm text-muted">
            {poster.rating_count > 0 ? (<><Stars value={Number(poster.rating_avg)} size={14} /> ({num(poster.rating_count, locale)})</>) : t('noRating')}
            <br />{num(poster.tasks_completed_count, locale)} {t('statsDone')}
          </span>
        </Link>
      )}

      {/* ---- assigned: go to chat ---- */}
      {assignment && (isPoster || assignment.tasker_id === user.id) && (
        <Link href={`/chat/${assignment.id}`} className="btn-primary w-full">
          <MessageCircle size={20} aria-hidden /> {t('task_openChat')}
        </Link>
      )}

      {/* ---- tasker view ---- */}
      {!isPoster && open && (!myOffer || myOffer.status === 'pending') && (
        <section className="space-y-4 border-t border-dashed border-line pt-5">
          <h2 className="text-lg font-bold">{t('task_yourOffer')}</h2>
          {myOffer && (
            <p className="rounded-md bg-marigold-soft px-3 py-2 text-sm">
              {t('task_offerPending')} <strong>{taka(myOffer.amount, locale)}</strong>
            </p>
          )}
          <form action={makeOffer}>
            <input type="hidden" name="task_id" value={task.id} />
            <input type="hidden" name="amount" value={task.task_fee} />
            <button type="submit" className="btn-primary w-full">{t('task_acceptPrice')} {taka(task.task_fee, locale)}</button>
            <p className="mt-1 text-sm text-muted">{t('task_acceptPriceHint')}</p>
          </form>
          <form action={makeOffer} className="space-y-3 border border-line bg-surface p-4">
            <input type="hidden" name="task_id" value={task.id} />
            <p className="font-semibold">{t('task_counter')}</p>
            <div>
              <label htmlFor="amount" className="mb-1 block text-sm">{t('task_counterAmount')}</label>
              <input id="amount" name="amount" type="number" inputMode="numeric" min={10} max={50000} required className="field" />
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm">{t('task_message')}</label>
              <input id="message" name="message" maxLength={300} className="field" />
            </div>
            <button type="submit" className="btn-ghost w-full">{t('task_sendOffer')}</button>
          </form>
          {myOffer && (
            <form action={withdrawOffer}>
              <input type="hidden" name="task_id" value={task.id} />
              <input type="hidden" name="offer_id" value={myOffer.id} />
              <button type="submit" className="btn-danger w-full">{t('task_withdraw')}</button>
            </form>
          )}
        </section>
      )}

      {!isPoster && myOffer && myOffer.status !== 'pending' && myOffer.status !== 'accepted' && (
        <p className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">
          {t(`offer_${myOffer.status}` as TKey)}
          {myOffer.decline_reason && <> — {t(`reason_${myOffer.decline_reason}` as TKey)}</>}
        </p>
      )}
      {!isPoster && !myOffer && !open && !assignment && (
        <p className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">{t('task_notAvailable')}</p>
      )}

      {/* ---- poster view ---- */}
      {isPoster && (
        <section className="space-y-4 border-t border-dashed border-line pt-5">
          {open && (
            <Link href={`/task/${task.id}/notify`} className="btn-ghost w-full">
              <BellRing size={20} aria-hidden /> {t('task_findHelpers')}
            </Link>
          )}

          <h2 className="text-lg font-bold">{t('task_offers')} ({num((offers ?? []).length, locale)})</h2>
          {(offers ?? []).length === 0 ? (
            <p className="border border-dashed border-line bg-surface px-4 py-6 text-center text-muted">{t('task_noOffers')}</p>
          ) : (
            <ul className="space-y-3">
              {(offers as any[]).map((o) => (
                <li key={o.id} className="space-y-2 border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/u/${o.tasker.id}`} className="min-w-0">
                      <span className="block truncate font-semibold">{o.tasker.full_name}</span>
                      <span className="text-sm text-muted">
                        {o.tasker.rating_count > 0 ? (<><Stars value={Number(o.tasker.rating_avg)} size={13} /> ({num(o.tasker.rating_count, locale)}) · </>) : null}
                        {num(o.tasker.tasks_completed_count, locale)} {t('statsDone')}
                      </span>
                    </Link>
                    <div className="text-right">
                      <p className="text-xl font-bold">{taka(o.amount, locale)}</p>
                      <p className="text-xs text-muted">{o.amount === task.task_fee ? t('task_samePrice') : t('task_counterPrice')}</p>
                    </div>
                  </div>
                  {o.message && <p className="text-sm text-ink/80">“{o.message}”</p>}
                  {o.status === 'pending' && open ? (
                    <div className="grid grid-cols-2 gap-2">
                      <form action={acceptOffer}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="offer_id" value={o.id} />
                        <button type="submit" className="btn-primary w-full">{t('task_accept')}</button>
                      </form>
                      <form action={declineOffer}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="offer_id" value={o.id} />
                        <button type="submit" className="btn-ghost w-full">{t('task_decline')}</button>
                      </form>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-muted">
                      {t(`offer_${o.status}` as TKey)}
                      {o.decline_reason && <> — {t(`reason_${o.decline_reason}` as TKey)}</>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {open && (
            <form action={cancelTask}>
              <input type="hidden" name="task_id" value={task.id} />
              <DeleteLocationButton label={t('task_cancel')} confirmText={t('task_cancelConfirm')} />
            </form>
          )}
        </section>
      )}
    </article>
  )
}
