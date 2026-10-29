// taskers/app/tasks/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n'
import TaskCard, { type TaskCardData } from '@/components/TaskCard'

export const metadata: Metadata = { title: 'My tasks' }

const SELECT =
  'id, title, place_name, upazila_name, task_fee, expense_estimate, status, created_at, custom_category, category:task_categories(name_en, name_bn)'

export default async function MyTasksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const t = await getT()
  const { tab } = await searchParams
  const doing = tab === 'doing'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tasks')

  let tasks: TaskCardData[] = []
  if (doing) {
    const { data } = await supabase
      .from('assignments')
      .select(`status, task:tasks!assignments_task_id_fkey(${SELECT})`)
      .eq('tasker_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    tasks = (data ?? []).map((a) => ({ ...(a.task as unknown as TaskCardData), status: a.status }))
  } else {
    const { data } = await supabase.from('tasks').select(SELECT).eq('poster_id', user.id).order('created_at', { ascending: false }).limit(100)
    tasks = (data ?? []) as unknown as TaskCardData[]
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-bold">{t('navTasks')}</h1>
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {[
          { key: 'posted', href: '/tasks', label: t('mytasks_posted'), on: !doing },
          { key: 'doing', href: '/tasks?tab=doing', label: t('mytasks_doing'), on: doing },
        ].map((x) => (
          <Link key={x.key} href={x.href} role="tab" aria-selected={x.on}
            className={`flex min-h-11 items-center justify-center border px-3 font-semibold ${x.on ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-surface'}`}>
            {x.label}
          </Link>
        ))}
      </div>
      {tasks.length === 0 ? (
        <p className="border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">{t(doing ? 'mytasks_noneDoing' : 'mytasks_nonePosted')}</p>
      ) : (
        <ul className="space-y-3">{tasks.map((x) => <TaskCard key={x.id} task={x} showStatus />)}</ul>
      )}
    </div>
  )
}
