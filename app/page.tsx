// taskers/app/page.tsx
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT } from '@/lib/i18n'
import TaskCard, { type TaskCardData } from '@/components/TaskCard'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user ? <FindTasks userId={user.id} /> : <Landing />
}

async function FindTasks({ userId }: { userId: string }) {
  const t = await getT()
  const supabase = await createClient()

  const [{ count }, { data: tasks }, { data: myOffers }] = await Promise.all([
    supabase.from('user_saved_locations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
    supabase
      .from('tasks')
      .select(
        'id, title, place_name, upazila_name, task_fee, expense_estimate, status, created_at, category:task_categories(name_en, name_bn), poster:profiles!tasks_poster_id_fkey(full_name, rating_avg, rating_count)'
      )
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .neq('poster_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('task_offers').select('task_id, status').eq('tasker_id', userId),
  ])

  const offered = new Map((myOffers ?? []).map((o) => [o.task_id as string, o.status as string]))
  const list = (tasks ?? []) as unknown as TaskCardData[]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('homeTitle')}</h1>

      {(count ?? 0) === 0 && (
        <aside className="flex flex-col gap-3 border-l-4 border-marigold bg-marigold-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <MapPin aria-hidden className="mt-1 shrink-0 text-brand" size={22} />
            <div>
              <h2 className="font-semibold">{t('nudgeLocationTitle')}</h2>
              <p className="text-sm text-ink/80">{t('nudgeLocationBody')}</p>
            </div>
          </div>
          <Link href="/profile/locations" className="btn-primary shrink-0">
            {t('nudgeLocationCta')}
          </Link>
        </aside>
      )}

      {list.length === 0 ? (
        <section className="border border-dashed border-line bg-surface px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">{t('emptyTasksTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">{t('find_emptyBody')}</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {list.map((task) => (
            <TaskCard key={task.id} task={task} badge={offered.has(task.id) ? 'find_offered' : undefined} />
          ))}
        </ul>
      )}
    </div>
  )
}

async function Landing() {
  const t = await getT()
  const locale = await getLocale()
  return (
    <div className="space-y-14">
      <section className="max-w-3xl py-4 md:py-10">
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-tight">{t('heroTitle')}</h1>
        <p className="mt-5 max-w-prose text-lg text-muted">{t('heroSub')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary">
            {t('ctaStart')}
          </Link>
          <Link href="/login" className="btn-ghost">
            {t('ctaLogin')}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{t('howTitle')}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {(['how1', 'how2', 'how3'] as const).map((k, i) => (
            <li key={k} className="border-t-4 border-brand bg-surface p-4">
              <span className="text-sm font-semibold text-brand">{(i + 1).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}</span>
              <p className="mt-1">{t(k)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
