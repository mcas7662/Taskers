import Link from 'next/link'
import { getT } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { toggleLocale } from '@/app/actions'
import { BottomNav, TopNav, type NavItem } from './SiteNav'

export default async function Header() {
  const t = await getT()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const items: NavItem[] = [
    { href: '/', label: t('navHome'), icon: 'home' },
    { href: '/post', label: t('navPost'), icon: 'post' },
    { href: '/tasks', label: t('navTasks'), icon: 'tasks' },
    { href: '/messages', label: t('navMessages'), icon: 'messages' },
    { href: '/profile', label: t('navProfile'), icon: 'profile' },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-brand">
            <span aria-hidden className="relative grid size-7 place-items-center rounded-md bg-brand text-sm text-white">
              T
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-marigold" />
            </span>
            {t('appName')}
          </Link>
          {user && <TopNav items={items} />}
          <div className="flex items-center gap-2">
            <form action={toggleLocale}>
              <button type="submit" className="rounded-md px-2 py-1.5 text-sm text-muted hover:text-ink">
                {t('langSwitch')}
              </button>
            </form>
            {!user && (
              <>
                <Link href="/login" className="rounded-md px-2 py-1.5 text-sm font-semibold text-brand">
                  {t('login')}
                </Link>
                <Link href="/signup" className="btn-primary hidden min-h-9 py-1.5 text-sm sm:inline-flex">
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {user && <BottomNav items={items} />}
    </>
  )
}
