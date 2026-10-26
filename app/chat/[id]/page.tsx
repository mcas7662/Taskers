// taskers/app/chat/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Flag, Wallet, Timer, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLocale, getT, type TKey } from '@/lib/i18n'
import { errorText } from '@/lib/errors'
import { fmtDateTime, fmtDuration, taka } from '@/lib/format'
import { DURATION_PRESETS, type Assignment, type ChatMessage } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import Stars from '@/components/Stars'
import ChatRoom from '@/components/ChatRoom'
import ProofUpload from '@/components/ProofUpload'
import Countdown from '@/components/Countdown'
import DeleteLocationButton from '@/components/DeleteLocationButton'
import * as A from './actions'

export const metadata: Metadata = { title: 'Deal' }

/* eslint-disable @typescript-eslint/no-explicit-any */
const EXT = [10, 15, 30, 60, 120]
const METHODS = ['bkash', 'nagad', 'rocket', 'bank', 'other'] as const

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ e?: string; ok?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const t = await getT()
  const locale = await getLocale()
  const dict = await getDict('chat_', 'sys_', 'up_', 'cd_', 'err_')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/chat/${id}`)
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const { data: row } = await supabase
    .from('assignments')
    .select(
      '*, task:tasks!assignments_task_id_fkey(id, title, place_name, upazila_name, task_fee, expense_estimate), poster:profiles!assignments_poster_id_fkey(id, full_name, rating_avg, rating_count), tasker:profiles!assignments_tasker_id_fkey(id, full_name, rating_avg, rating_count)'
    )
    .eq('id', id)
    .maybeSingle()
  if (!row) notFound()

  const a = row as unknown as Assignment & { task: any; poster: any; tasker: any }
  const isPoster = a.poster_id === user.id
  const isTasker = a.tasker_id === user.id
  const party = isPoster || isTasker // otherwise this is an admin reading a reported conversation
  const other = isPoster ? a.tasker : a.poster
  const total = a.total_amount

  const [{ data: msgs }, { data: reviews }, { data: myReports }] = await Promise.all([
    supabase.from('messages').select('id, assignment_id, sender_id, kind, body, sys_key, meta, created_at').eq('assignment_id', id).order('id', { ascending: false }).limit(200),
    supabase.from('reviews').select('reviewer_id, stars, comment').eq('assignment_id', id),
    supabase.from('reports').select('id').eq('assignment_id', id).eq('reporter_id', user.id).eq('status', 'open'),
  ])
  const messages = ((msgs ?? []) as ChatMessage[]).reverse()
  const myReview = (reviews ?? []).find((r) => r.reviewer_id === user.id)
  const theirReview = (reviews ?? []).find((r) => r.reviewer_id !== user.id)
  const reported = (myReports ?? []).length > 0

  // signed links for private proof photos
  const paths = [a.payment_proof_path, ...(a.completion_proof_paths ?? [])].filter(Boolean) as string[]
  const signed = new Map<string, string>()
  if (paths.length) {
    const { data } = await supabase.storage.from('task-proofs').createSignedUrls(paths, 3600)
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl)
  }

  const errMsg = errorText(t, sp.e)
  const closed = a.status === 'completed' || a.status === 'cancelled' || !party
  const methodLabel = (m: string | null) => (m ? t(`pay_${m}` as TKey) : '')
  const Hidden = () => <input type="hidden" name="assignment_id" value={a.id} />
  const box = 'space-y-3 border border-line bg-surface p-4'
  const h = 'flex items-center gap-2 text-lg font-bold'

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href={party ? '/messages' : '/admin/reports'} className="text-sm font-semibold text-brand underline underline-offset-2">← {t('navMessages')}</Link>

      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-snug">{a.task?.title}</h1>
          <StatusBadge status={a.status} />
        </div>
        <p className="text-sm text-muted">
          <Link href={`/u/${other.id}`} className="font-semibold text-brand underline underline-offset-2">{other.full_name}</Link>
          {other.rating_count > 0 && <> · <Stars value={Number(other.rating_avg)} size={13} /></>}
          {' · '}{t(isPoster ? 'deal_roleTasker' : 'deal_rolePoster')}
        </p>
        <Link href={`/task/${a.task_id}`} className="text-sm text-muted underline underline-offset-2">{a.task?.place_name}</Link>
      </header>

      {sp.ok && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">{t(`ok_${sp.ok}` as TKey)}</p>}
      {errMsg && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{errMsg}</p>}
      {!party && <p className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">{t('deal_adminView')}</p>}

      {/* ---------- money summary ---------- */}
      <dl className="divide-y divide-dashed divide-line border border-line bg-surface px-4 text-sm">
        <div className="flex justify-between py-2"><dt>{t('deal_taskerEarns')}</dt><dd className="font-bold">{taka(a.agreed_fee, locale)}</dd></div>
        <div className="flex justify-between py-2 text-muted"><dt>{t('deal_expense')}{a.expense_note ? ` (${a.expense_note})` : ''}</dt><dd>{taka(a.expense_amount, locale)}</dd></div>
        <div className="flex justify-between py-2 text-base font-bold"><dt>{t('deal_total')}</dt><dd>{taka(total, locale)}</dd></div>
        {a.duration_minutes && <div className="flex justify-between py-2"><dt>{t('deal_time')}</dt><dd>{fmtDuration(a.duration_minutes, locale)}</dd></div>}
      </dl>

      {/* ---------- stage panel ---------- */}
      {party && a.status === 'negotiating' && (
        isPoster ? (
          <form action={A.proposeTerms} className={box}>
            <Hidden />
            <h2 className={h}><Wallet size={20} aria-hidden /> {t('deal_setTerms')}</h2>
            <p className="text-sm text-muted">{t('deal_setTermsHint')}</p>
            <div>
              <label htmlFor="expense" className="mb-1 block text-sm font-semibold">{t('deal_expenseField')}</label>
              <input id="expense" name="expense" type="number" inputMode="numeric" min={0} max={100000} defaultValue={a.expense_amount} required className="field" />
            </div>
            <div>
              <label htmlFor="note" className="mb-1 block text-sm font-semibold">{t('deal_expenseNoteField')}</label>
              <input id="note" name="note" maxLength={300} defaultValue={a.expense_note ?? ''} placeholder={t('deal_expenseNoteHint')} className="field" />
            </div>
            <div>
              <label htmlFor="duration_min" className="mb-1 block text-sm font-semibold">{t('deal_durationField')}</label>
              <select id="duration_min" name="duration_min" defaultValue={a.duration_minutes ?? 30} className="field">
                {DURATION_PRESETS.map((m) => <option key={m} value={m}>{fmtDuration(m, locale)}</option>)}
              </select>
              <input name="custom_minutes" type="number" inputMode="numeric" min={5} max={43200} placeholder={t('deal_customMinutes')} className="field mt-2" />
            </div>
            <button type="submit" className="btn-primary w-full">{a.terms_proposed ? t('deal_updateTerms') : t('deal_sendTerms')}</button>
            {a.terms_proposed && <p className="text-sm text-muted">{t('deal_waitingAgree')}</p>}
          </form>
        ) : a.terms_proposed ? (
          <form action={A.agreeTerms} className={box}>
            <Hidden />
            <input type="hidden" name="expected_total" value={total} />
            <input type="hidden" name="expected_minutes" value={a.duration_minutes ?? 0} />
            <h2 className={h}><CheckCircle2 size={20} aria-hidden /> {t('deal_proposed')}</h2>
            <p className="text-sm">{t('deal_proposedBody')}</p>
            <div>
              <label htmlFor="method" className="mb-1 block text-sm font-semibold">{t('deal_receiveVia')}</label>
              <select id="method" name="method" defaultValue="bkash" className="field">
                {METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="account" className="mb-1 block text-sm font-semibold">{t('deal_receiveAccount')}</label>
              <input id="account" name="account" required maxLength={60} inputMode="tel" placeholder="01XXXXXXXXX" className="field" />
              <p className="mt-1 text-sm text-muted">{t('deal_receiveHint')}</p>
            </div>
            <button type="submit" className="btn-primary w-full">{t('deal_agree')}</button>
          </form>
        ) : (
          <p className={box + ' text-sm text-muted'}>{t('deal_waitingTerms')}</p>
        )
      )}

      {party && a.status === 'awaiting_payment' && (
        isPoster ? (
          <form action={A.markPaid} className={box}>
            <Hidden />
            <h2 className={h}><Wallet size={20} aria-hidden /> {t('deal_payNow')}</h2>
            <div className="border-l-4 border-marigold bg-marigold-soft p-3">
              <p className="text-sm">{t('deal_sendTo')}</p>
              <p className="text-lg font-bold">{methodLabel(a.payment_method)}: <span className="select-all font-mono">{a.payment_account}</span></p>
              <p className="text-sm">{t('deal_amount')}: <strong>{taka(total, locale)}</strong></p>
            </div>
            <p className="text-sm text-muted">{t('deal_prepayWhy')}</p>
            {a.payment_reject_note && <p className="text-sm text-danger">{t('deal_payRejected')}: {a.payment_reject_note}</p>}
            <div>
              <p className="mb-1 text-sm font-semibold">{t('deal_screenshot')}</p>
              <ProofUpload assignmentId={a.id} kind="payment" max={1} dict={dict} />
            </div>
            <div>
              <label htmlFor="trx" className="mb-1 block text-sm font-semibold">{t('deal_trx')}</label>
              <input id="trx" name="trx" maxLength={60} className="field" />
            </div>
            <button type="submit" className="btn-primary w-full">{t('deal_markPaid')}</button>
          </form>
        ) : (
          <p className={box + ' text-sm'}>{t('deal_waitingPayment')} <strong>{taka(total, locale)}</strong></p>
        )
      )}

      {party && a.status === 'payment_submitted' && (
        isTasker ? (
          <div className={box}>
            <h2 className={h}><Wallet size={20} aria-hidden /> {t('deal_checkPayment')}</h2>
            <p className="text-sm">{t('deal_checkPaymentBody')} <strong>{taka(total, locale)}</strong> → {methodLabel(a.payment_method)} {a.payment_account}</p>
            {a.poster_trx_id && <p className="text-sm">{t('deal_trx')}: <span className="font-mono">{a.poster_trx_id}</span></p>}
            {a.payment_proof_path && signed.get(a.payment_proof_path) && (
              // eslint-disable-next-line @next/next/no-img-element
              <a href={signed.get(a.payment_proof_path)} target="_blank" rel="noopener noreferrer"><img src={signed.get(a.payment_proof_path)} alt={t('deal_screenshot')} className="max-h-72 w-full border border-line object-contain" /></a>
            )}
            <form action={A.confirmPayment}><Hidden /><button type="submit" className="btn-primary w-full">{t('deal_gotPayment')}</button></form>
            <form action={A.rejectPayment} className="space-y-2">
              <Hidden />
              <input name="note" maxLength={300} placeholder={t('deal_notReceivedNote')} className="field" />
              <button type="submit" className="btn-danger w-full">{t('deal_notReceived')}</button>
            </form>
          </div>
        ) : (
          <p className={box + ' text-sm'}>{t('deal_waitingConfirmPayment')}</p>
        )
      )}

      {party && a.status === 'in_progress' && (
        <section className={box}>
          <h2 className={h}><Timer size={20} aria-hidden /> {t('deal_inProgress')}</h2>
          {a.due_at && (
            <p className="text-center">
              <span className="block text-sm text-muted">{t('deal_timeLeft')}</span>
              <span className="text-3xl"><Countdown dueAt={a.due_at} dict={dict} /></span>
              <span className="block text-xs text-muted">{t('deal_dueAt')} {fmtDateTime(a.due_at, locale)}</span>
            </p>
          )}
          {a.reject_note && <p className="border-l-4 border-danger bg-danger/5 p-3 text-sm">{t('deal_rejectedNote')}: {a.reject_note}</p>}
          {a.ext_status === 'pending' && (
            <div className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">
              <p className="font-semibold">{t('deal_extPending')}: +{fmtDuration(a.ext_minutes ?? 0, locale)}</p>
              <p>{a.ext_reason}</p>
              {isPoster && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <form action={A.respondExtension}><Hidden /><input type="hidden" name="approve" value="1" /><button type="submit" className="btn-primary w-full">{t('deal_extApprove')}</button></form>
                  <form action={A.respondExtension}><Hidden /><input type="hidden" name="approve" value="0" /><button type="submit" className="btn-ghost w-full">{t('deal_extReject')}</button></form>
                </div>
              )}
            </div>
          )}
          {a.ext_status === 'rejected' && isTasker && <p className="text-sm text-danger">{t('deal_extRejected')}</p>}

          {isTasker && (
            <>
              <form action={A.submitCompletion} className="space-y-3 border-t border-dashed border-line pt-4">
                <Hidden />
                <h3 className="font-bold">{t('deal_finish')}</h3>
                <p className="text-sm text-muted">{t('deal_finishHint')}</p>
                <ProofUpload assignmentId={a.id} kind="completion" max={5} dict={dict} />
                <input name="note" maxLength={500} placeholder={t('deal_finishNote')} className="field" />
                <button type="submit" className="btn-primary w-full">{t('deal_markDone')}</button>
              </form>
              {a.ext_status !== 'pending' && (
                <details className="border-t border-dashed border-line pt-3">
                  <summary className="cursor-pointer font-semibold text-brand">{t('deal_needMore')}</summary>
                  <form action={A.requestExtension} className="mt-3 space-y-2">
                    <Hidden />
                    <select name="minutes" defaultValue={30} className="field" aria-label={t('deal_extraTime')}>
                      {EXT.map((m) => <option key={m} value={m}>+{fmtDuration(m, locale)}</option>)}
                    </select>
                    <input name="reason" required minLength={3} maxLength={300} placeholder={t('deal_extReason')} className="field" />
                    <button type="submit" className="btn-ghost w-full">{t('deal_extSend')}</button>
                  </form>
                </details>
              )}
            </>
          )}
          {isPoster && (
            <form action={A.extendTimer} className="flex gap-2 border-t border-dashed border-line pt-3">
              <Hidden />
              <select name="minutes" defaultValue={30} className="field" aria-label={t('deal_extraTime')}>
                {EXT.map((m) => <option key={m} value={m}>+{fmtDuration(m, locale)}</option>)}
              </select>
              <button type="submit" className="btn-ghost shrink-0">{t('deal_addTime')}</button>
            </form>
          )}
        </section>
      )}

      {party && a.status === 'awaiting_confirmation' && (
        <section className={box}>
          <h2 className={h}><CheckCircle2 size={20} aria-hidden /> {t('deal_doneReview')}</h2>
          {isPoster ? <p className="text-sm">{t('deal_confirmBody')}</p> : <p className="text-sm">{t('deal_waitingConfirm')}</p>}
          <div className="grid grid-cols-2 gap-2">
            {a.completion_proof_paths.map((p) => signed.get(p) && (
              <a key={p} href={signed.get(p)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signed.get(p)} alt={t('deal_proof')} className="h-40 w-full border border-line object-cover" />
              </a>
            ))}
          </div>
          {a.completion_note && <p className="text-sm">“{a.completion_note}”</p>}
          {isPoster && (
            <>
              <form action={A.confirmCompletion}><Hidden /><button type="submit" className="btn-primary w-full">{t('deal_yesDone')}</button></form>
              <form action={A.rejectCompletion} className="space-y-2">
                <Hidden />
                <input name="note" required minLength={3} maxLength={300} placeholder={t('deal_notDoneNote')} className="field" />
                <button type="submit" className="btn-danger w-full">{t('deal_notDone')}</button>
              </form>
            </>
          )}
        </section>
      )}

      {party && a.status === 'completed' && (
        <section className={box}>
          <h2 className={h}><CheckCircle2 size={20} aria-hidden /> {t('deal_completed')}</h2>
          {myReview ? (
            <p className="text-sm">{t('deal_yourReview')}: <Stars value={myReview.stars} /> {myReview.comment && <>— “{myReview.comment}”</>}</p>
          ) : (
            <form action={A.submitReview} className="space-y-3">
              <Hidden />
              <p className="text-sm text-muted">{t('deal_reviewEncourage')}</p>
              <fieldset>
                <legend className="mb-1 text-sm font-semibold">{t('deal_stars')}</legend>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="cursor-pointer">
                      <input type="radio" name="stars" value={n} required className="peer sr-only" defaultChecked={n === 5} />
                      <span className="flex min-h-12 items-center justify-center border border-line bg-surface font-bold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2">{n}★</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <textarea name="comment" rows={3} maxLength={500} placeholder={t('deal_reviewPlaceholder')} className="field" />
              <button type="submit" className="btn-primary w-full">{t('deal_sendReview')}</button>
              <p className="text-xs text-muted">{t('deal_reviewOptional')}</p>
            </form>
          )}
          {theirReview && <p className="border-t border-dashed border-line pt-3 text-sm">{t('deal_theirReview')}: <Stars value={theirReview.stars} /> {theirReview.comment && <>— “{theirReview.comment}”</>}</p>}
        </section>
      )}

      {a.status === 'cancelled' && (
        <p className={box + ' text-sm'}>{t('deal_cancelled')}{a.cancel_reason && a.cancel_reason !== 'user_banned' ? `: ${a.cancel_reason}` : ''}{a.cancel_reason === 'user_banned' && ` ${t('deal_cancelledBan')}`}</p>
      )}

      {/* ---------- chat ---------- */}
      <ChatRoom assignmentId={a.id} meId={user.id} initial={messages} closed={closed} closedKey={party ? 'chat_closed' : 'chat_readonly'} dict={dict} lang={locale} />

      {/* ---------- cancel + report ---------- */}
      {party && (a.status === 'negotiating' || a.status === 'awaiting_payment') && (
        <form action={A.cancelDeal} className="space-y-2">
          <Hidden />
          <input name="reason" maxLength={300} placeholder={t('deal_cancelReason')} className="field" />
          <DeleteLocationButton label={t('deal_cancelDeal')} confirmText={t('deal_cancelConfirm')} />
        </form>
      )}

      {party && (
        <details className="border border-line bg-surface p-4">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-danger"><Flag size={18} aria-hidden /> {t('report_title')}</summary>
          {reported ? (
            <p className="mt-3 text-sm">{t('report_already')}</p>
          ) : (
            <form action={A.submitReport} className="mt-3 space-y-3">
              <Hidden />
              <p className="text-sm text-muted">{t('report_intro')}</p>
              <select name="reason" required defaultValue="" className="field" aria-label={t('report_reason')}>
                <option value="" disabled>{t('report_reason')}</option>
                {['scam', 'no_show', 'fake_payment', 'abuse', 'wrong_work', 'other'].map((r) => <option key={r} value={r}>{t(`report_${r}` as TKey)}</option>)}
              </select>
              <textarea name="details" rows={3} maxLength={1000} placeholder={t('report_details')} className="field" />
              <button type="submit" className="btn-danger w-full">{t('report_send')}</button>
            </form>
          )}
        </details>
      )}
    </div>
  )
}
