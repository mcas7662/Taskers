'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, SquarePlus, ClipboardList, MessageCircle, User } from 'lucide-react'

const ICONS = { home: Search, post: SquarePlus, tasks: ClipboardList, messages: MessageCircle, profile: User }

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS }

function active(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(href + '/')
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon]
          const on = active(path, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs ${
                  on ? 'font-semibold text-brand' : 'text-muted'
                }`}
              >
                <Icon size={22} aria-hidden strokeWidth={on ? 2.5 : 2} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function TopNav({ items }: { items: NavItem[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map(({ href, label }) => {
          const on = active(path, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm ${
                  on ? 'bg-brand-soft font-semibold text-brand' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
