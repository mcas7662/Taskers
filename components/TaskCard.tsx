// taskers/components/TaskCard.tsx
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { getLocale, getT, type TKey } from '@/lib/i18n'
import { taka, timeAgo } from '@/lib/format'
import StatusBadge from './StatusBadge'
import Stars from './Stars'

export type TaskCardData = {
  id: string
  title: string
  place_name: string
  upazila_name: string | null
  task_fee: number
  expense_estimate: number
  status: string
  created_at: string
  custom_category?: string | null
  category?: { name_en: string; name_bn: string } | null
  poster?: { full_name: string; rating_avg: number; rating_count: number } | null
}

export default async function TaskCard({ task, badge, showStatus = false }: { task: TaskCardData; badge?: TKey; showStatus?: boolean }) {
  const t = await getT()
  const locale = await getLocale()
  return (
    <li>
      <Link href={`/task/${task.id}`} className="block border border-line bg-surface p-4 active:bg-brand-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {(task.custom_category || task.category) && (
              <p className="mb-1 text-xs font-semibold text-brand">{task.custom_category || (locale === 'bn' ? task.category!.name_bn : task.category!.name_en)}</p>
            )}
            <h3 className="text-lg font-bold leading-snug">{task.title}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold">{taka(task.task_fee, locale)}</p>
            {task.expense_estimate > 0 && (
              <p className="text-xs text-muted">+ {taka(task.expense_estimate, locale)} {t('cardExpense')}</p>
            )}
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MapPin size={14} aria-hidden className="shrink-0" />
          <span className="truncate">{[task.place_name, task.upazila_name].filter(Boolean).join(', ')}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1"><Clock size={14} aria-hidden /> {timeAgo(task.created_at, locale)}</span>
          {task.poster && task.poster.rating_count > 0 && (
            <span className="flex items-center gap-1"><Stars value={Number(task.poster.rating_avg)} size={13} /> ({task.poster.rating_count})</span>
          )}
          {showStatus && <StatusBadge status={task.status} />}
          {badge && <span className="rounded-full bg-marigold-soft px-2.5 py-0.5 text-xs font-semibold text-ink">{t(badge)}</span>}
        </div>
      </Link>
    </li>
  )
}
