// taskers/app/admin/reports/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT, type TKey } from '@/lib/i18n'
import { errorText } from '@/lib/errors'
import { fmtDateTime } from '@/lib/format'
import { resolveReport } from '../actions'

export const metadata: Metadata = { title: 'Report' }

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminReport({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  const { id } = await params
  const sp = await searchParams
  const t = await getT()
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/admin/reports/${id}`)
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true || !/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const { data: r } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(id, full_name), reported:profiles!reports_reported_user_id_fkey(id, full_name)')
    .eq('id', id)
    .maybeSingle()
  if (!r) notFound()

  // allowed by RLS only because this assignment has a report
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, sender_id, kind, body, sys_key, created_at')
    .eq('assignment_id', r.assignment_id)
    .order('id', { ascending: true })
    .limit(500)
  const { count: warnCount } = await supabase.from('user_warnings').select('id', { count: 'exact', head: true }).eq('user_id', r.reported_user_id)
  const err = errorText(t, sp.e)
  const name = (uid: string | null) => (uid === r.reporter.id ? `${r.reporter.full_name} (${t('admin_reporter')})` : uid === r.reported.id ? `${r.reported.full_name} (${t('admin_reported')})` : '')

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/admin/reports" className="text-sm font-semibold text-brand underline underline-offset-2">← {t('admin_title')}</Link>
      <h1 className="text-2xl font-bold">{t(`report_${r.reason}` as TKey)}</h1>
      {err && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{err}</p>}

      <dl className="divide-y divide-dashed divide-line border border-line bg-surface px-4 text-sm">
        <div className="flex justify-between py-2"><dt>{t('admin_reporter')}</dt><dd><Link href={`/u/${r.reporter.id}`} className="underline">{r.reporter.full_name}</Link></dd></div>
        <div className="flex justify-between py-2"><dt>{t('admin_reported')}</dt><dd><Link href={`/u/${r.reported.id}`} className="font-bold underline">{r.reported.full_name}</Link></dd></div>
        <div className="flex justify-between py-2"><dt>{t('admin_priorWarnings')}</dt><dd>{warnCount ?? 0}</dd></div>
        <div className="flex justify-between py-2"><dt>{t('admin_status')}</dt><dd>{t(`rstatus_${r.status}` as TKey)}</dd></div>
      </dl>
      {r.details && <p className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">{r.details}</p>}

      <section>
        <h2 className="mb-2 font-bold">{t('admin_conversation')}</h2>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto border border-line bg-surface p-3 text-sm">
          {(msgs ?? []).map((m: any) =>
            m.kind === 'system' ? (
              <li key={m.id} className="text-center text-xs text-brand-dark">• {t(`sys_${m.sys_key}` as TKey) ?? m.sys_key}</li>
            ) : (
              <li key={m.id}>
                <span className="font-semibold">{name(m.sender_id)}</span> <span className="text-xs text-muted">{fmtDateTime(m.created_at, locale)}</span>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </li>
            )
          )}
        </ul>
        <Link href={`/chat/${r.assignment_id}`} className="mt-2 inline-block text-sm font-semibold text-brand underline underline-offset-2">{t('admin_openDeal')}</Link>
      </section>

      {r.status === 'open' ? (
        <form action={resolveReport} className="space-y-3 border border-line bg-surface p-4">
          <input type="hidden" name="report_id" value={r.id} />
          <label htmlFor="note" className="block text-sm font-semibold">{t('admin_note')}</label>
          <textarea id="note" name="note" rows={3} maxLength={500} className="field" />
          <p className="text-xs text-muted">{t('admin_noteHint')}</p>
          <div className="grid gap-2">
            <button type="submit" name="action" value="warn" className="btn-ghost">{t('admin_warn')}</button>
            <button type="submit" name="action" value="ban" className="btn-danger" formNoValidate>{t('admin_ban')}</button>
            <button type="submit" name="action" value="dismiss" className="btn-ghost">{t('admin_dismiss')}</button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">{t('admin_handled')}: {r.admin_note}</p>
      )}
    </div>
  )
}
