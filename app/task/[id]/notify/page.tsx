// taskers/app/task/[id]/notify/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLocale, getT } from '@/lib/i18n'
import TaskerSearch from '@/components/TaskerSearch'
import { searchTaskers, sendInvites } from './actions'
import type { District, Division } from '@/lib/types'

export const metadata: Metadata = { title: 'Find helpers' }

export default async function NotifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getT()
  const locale = await getLocale()
  const dict = await getDict('srch_', 'adr_')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/task/${id}/notify`)
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, poster_id, status, notify_radius_m, expires_at')
    .eq('id', id)
    .maybeSingle()
  if (!task || task.poster_id !== user.id) notFound()
  if (task.status !== 'open') redirect(`/task/${id}`)

  const [{ data: divisions }, { data: districts }] = await Promise.all([
    supabase.from('bd_divisions').select('id, name_en, name_bn').order('name_en'),
    supabase.from('bd_districts').select('id, division_id, name_en, name_bn').order('name_en'),
  ])

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href={`/task/${id}`} className="text-sm font-semibold text-brand underline underline-offset-2">← {task.title}</Link>
      <header>
        <h1 className="text-3xl font-bold">{t('task_findHelpers')}</h1>
        <p className="mt-1 text-muted">{t('srch_intro')}</p>
      </header>
      <TaskerSearch
        taskId={id}
        dict={dict}
        lang={locale}
        divisions={(divisions ?? []) as Division[]}
        districts={(districts ?? []) as District[]}
        defaultRadius={task.notify_radius_m}
        search={searchTaskers}
        invite={sendInvites}
      />
    </div>
  )
}
