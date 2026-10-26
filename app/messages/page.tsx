// taskers/app/messages/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT } from '@/lib/i18n'
import { taka, timeAgo } from '@/lib/format'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'Messages' }

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function MessagesPage() {
  const t = await getT()
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/messages')

  const { data } = await supabase
    .from('assignments')
    .select(
      'id, status, total_amount, poster_id, created_at, task:tasks!assignments_task_id_fkey(title), poster:profiles!assignments_poster_id_fkey(full_name), tasker:profiles!assignments_tasker_id_fkey(full_name)'
    )
    .order('created_at', { ascending: false })
    .limit(100)
  const rows = (data ?? []) as any[]

  // last message per conversation
  const last = new Map<string, { body: string | null; kind: string; sys_key: string | null; created_at: string }>()
  if (rows.length) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('assignment_id, body, kind, sys_key, created_at')
      .in('assignment_id', rows.map((r) => r.id))
      .order('id', { ascending: false })
      .limit(300)
    for (const m of msgs ?? []) if (!last.has(m.assignment_id)) last.set(m.assignment_id, m as any)
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-bold">{t('navMessages')}</h1>
      {rows.length === 0 ? (
        <p className="border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">{t('msgs_none')}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const mine = r.poster_id === user.id
            const other = mine ? r.tasker?.full_name : r.poster?.full_name
            const m = last.get(r.id)
            return (
              <li key={r.id}>
                <Link href={`/chat/${r.id}`} className="block border border-line bg-surface p-4 active:bg-brand-soft">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-2 font-semibold"><MessageCircle size={18} aria-hidden className="shrink-0 text-brand" /><span className="truncate">{other}</span></p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 truncate text-sm">{r.task?.title}</p>
                  <p className="mt-1 truncate text-sm text-muted">{m ? (m.kind === 'system' ? '• ' + t('msgs_system') : m.body) : t('msgs_noMessages')}</p>
                  <p className="mt-1 text-xs text-muted">{taka(r.total_amount, locale)} · {timeAgo(m?.created_at ?? r.created_at, locale)} · {t(mine ? 'msgs_asPoster' : 'msgs_asTasker')}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
