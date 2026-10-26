// taskers/app/admin/reports/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT, type TKey } from '@/lib/i18n'
import { timeAgo } from '@/lib/format'

export const metadata: Metadata = { title: 'Reports' }

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminReports({ searchParams }: { searchParams: Promise<{ ok?: string; all?: string }> }) {
  const t = await getT()
  const locale = await getLocale()
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/reports')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) notFound()

  let q = supabase
    .from('reports')
    .select('id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (!sp.all) q = q.eq('status', 'open')
  const { data } = await q

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-bold">{t('admin_title')}</h1>
      {sp.ok && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">{t('admin_done')}</p>}
      <Link href={sp.all ? '/admin/reports' : '/admin/reports?all=1'} className="text-sm font-semibold text-brand underline underline-offset-2">
        {sp.all ? t('admin_showOpen') : t('admin_showAll')}
      </Link>
      {(data ?? []).length === 0 ? (
        <p className="border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">{t('admin_none')}</p>
      ) : (
        <ul className="space-y-2">
          {(data as any[]).map((r) => (
            <li key={r.id}>
              <Link href={`/admin/reports/${r.id}`} className="block border border-line bg-surface p-4 active:bg-brand-soft">
                <p className="font-semibold">{t(`report_${r.reason}` as TKey)} · {t(`rstatus_${r.status}` as TKey)}</p>
                <p className="text-sm">{r.reporter?.full_name} → <strong>{r.reported?.full_name}</strong></p>
                <p className="text-xs text-muted">{timeAgo(r.created_at, locale)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
