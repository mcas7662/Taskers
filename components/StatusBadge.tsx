// taskers/components/StatusBadge.tsx
import { getT, type TKey } from '@/lib/i18n'

const TONE: Record<string, string> = {
  open: 'bg-brand-soft text-brand-dark',
  assigned: 'bg-marigold-soft text-ink',
  negotiating: 'bg-marigold-soft text-ink',
  awaiting_payment: 'bg-marigold-soft text-ink',
  payment_submitted: 'bg-marigold-soft text-ink',
  in_progress: 'bg-brand text-white',
  awaiting_confirmation: 'bg-marigold text-ink',
  completed: 'bg-brand-dark text-white',
  cancelled: 'bg-line text-muted',
}

export default async function StatusBadge({ status }: { status: string }) {
  const t = await getT()
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[status] ?? 'bg-line text-muted'}`}>
      {t(`status_${status}` as TKey)}
    </span>
  )
}
