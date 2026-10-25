import type { Metadata, Viewport } from 'next'
import { Hind_Siliguri } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import { getLocale, getT } from '@/lib/i18n'

const font = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: { default: 'Taskers', template: '%s | Taskers' },
  description: 'Small physical errands, done by people who are already nearby.',
  applicationName: 'Taskers',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A5C66',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const t = await getT()
  return (
    <html lang={locale} className={font.variable}>
      <body className="font-sans">
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-4xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 pb-24 text-sm text-muted md:pb-10">{t('footer')}</footer>
      </body>
    </html>
  )
}
