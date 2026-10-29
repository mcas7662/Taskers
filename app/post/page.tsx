// taskers/app/post/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLocale, getT } from '@/lib/i18n'
import PostTaskForm from '@/components/PostTaskForm'
import { createTask } from './actions'
import type { District, Division } from '@/lib/types'

export const metadata: Metadata = { title: 'Post a task' }

export default async function PostPage() {
  const t = await getT()
  const locale = await getLocale()
  const dict = await getDict('loc_', 'adr_', 'post_')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/post')

  const [{ data: cats }, { data: divisions }, { data: districts }] = await Promise.all([
    supabase.from('task_categories').select('id, slug, name_en, name_bn, requires_institution_permission').eq('is_active', true).order('sort_order'),
    supabase.from('bd_divisions').select('id, name_en, name_bn').order('name_en'),
    supabase.from('bd_districts').select('id, division_id, name_en, name_bn, lat, lng').order('name_en'),
  ])
  // "Other (write my own)" is the last dropdown option; it is filed under the general "other" category.
  const list = cats ?? []
  const otherCategoryId = list.find((c) => c.slug === 'other')?.id ?? null
  const rows = districts ?? []

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t('navPost')}</h1>
        <p className="mt-1 text-muted">{t('post_intro')}</p>
      </header>
      <PostTaskForm
        action={createTask}
        dict={dict}
        lang={locale}
        categories={list
          .filter((c) => c.slug !== 'other')
          .map((c) => ({
            id: c.id,
            label: locale === 'bn' ? c.name_bn : c.name_en,
            requires_permission: c.requires_institution_permission,
          }))}
        divisions={(divisions ?? []) as Division[]}
        districts={rows.map(({ id, division_id, name_en, name_bn }) => ({ id, division_id, name_en, name_bn })) as District[]}
        districtRefs={rows.map((x) => ({ id: x.id, lat: x.lat as number | null, lng: x.lng as number | null }))}
        otherCategoryId={otherCategoryId}
      />
    </div>
  )
}
