// taskers/app/notifications/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT, type TKey } from '@/lib/i18n'
import { fill, taka, timeAgo } from '@/lib/format'
import MarkAllRead from '@/components/MarkAllRead'

export const metadata: Metadata = { title: 'Notifications' }

type N = {
  id: string
  type: string
  task_id: string | null
  assignment_id: string | null
  data: Record<string, string | number>
  is_read: boolean
  resolved_reason: string | null
  created_at: string
}

function href(n: N): string | null {
  switch (n.type) {
    case 'task_nearby':
    case 'offer_received':
    case 'offer_declined':
    case 'task_reopened':
      return n.task_id ? `/task/${n.task_id}` : null
    case 'warning':
      return '/profile'
    case 'report_resolved':
      return null
    default:
      return n.assignment_id ? `/chat/${n.assignment_id}` : null
  }
}

export default async function NotificationsPage() {
  const t = await getT()
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/notifications')

  const { data } = await supabase
    .from('notifications')
    .select('id, type, task_id, assignment_id, data, is_read, resolved_reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)
  const list = (data ?? []) as N[]

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <MarkAllRead hasUnread={list.some((n) => !n.is_read)} />
      <h1 className="text-3xl font-bold">{t('notifTitle')}</h1>
      {list.length === 0 ? (
        <p className="border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">{t('notifNone')}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => {
            const d = n.data ?? {}
            const key = `n_${n.type}` as TKey
            const text = fill(t(key) ?? n.type, {
              title: d.title as string,
              amount: d.amount != null ? taka(Number(d.amount), locale) : '',
              fee: d.fee != null ? taka(Number(d.fee), locale) : '',
              total: d.total != null ? taka(Number(d.total), locale) : '',
              by: d.by as string,
              place: d.place as string,
              minutes: d.minutes as number,
              stars: d.stars as number,
              message: d.message as string,
              reason: d.reason ? t(`reason_${d.reason}` as TKey) : '',
              action: d.action ? t(`act_${d.action}` as TKey) : '',
            })
            const to = href(n)
            const resolved = n.type === 'task_nearby' && n.resolved_reason
            const body = (
              <>
                <p className={`${n.is_read ? '' : 'font-semibold'} ${resolved ? 'text-muted line-through' : ''}`}>{text}</p>
                {resolved && (
                  <p className="mt-1 text-sm font-semibold text-danger">
                    {t('notif_autoDeclined')}: {t(`reason_${n.resolved_reason}` as TKey)}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">{timeAgo(n.created_at, locale)}</p>
              </>
            )
            const cls = `block border bg-surface p-4 ${n.is_read ? 'border-line' : 'border-brand border-l-4'}`
            return <li key={n.id}>{to ? <Link href={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}</li>
          })}
        </ul>
      )}
    </div>
  )
}
