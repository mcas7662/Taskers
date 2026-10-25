import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLocale, getT } from '@/lib/i18n'

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
  const { count } = await supabase
    .from('user_saved_locations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

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

      <section className="border border-dashed border-line bg-surface px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">{t('emptyTasksTitle')}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{t('emptyTasksBody')}</p>
      </section>
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
