import type { Metadata, Viewport } from 'next'
import { Hind_Siliguri } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Link from 'next/link'
import { getLocale, getT } from '@/lib/i18n'
import { siteUrl } from '@/lib/site'

const font = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getT()
  const description = t('metaDescription')
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: 'Taskers', template: '%s | Taskers' },
    description,
    applicationName: 'Taskers',
    icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], apple: '/icon.svg' },
    openGraph: {
      type: 'website',
      siteName: 'Taskers',
      title: 'Taskers',
      description,
      url: '/',
      locale: locale === 'bn' ? 'bn_BD' : 'en_US',
      alternateLocale: locale === 'bn' ? 'en_US' : 'bn_BD',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Taskers' }],
    },
    twitter: { card: 'summary_large_image', title: 'Taskers', description, images: ['/og.png'] },
  }
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
        <footer className="mx-auto max-w-4xl space-y-2 px-4 pb-24 text-sm text-muted md:pb-10">
          <p>{t('footer')}</p>
          <p className="flex gap-4">
            <Link href="/terms" className="inline-block py-2 underline underline-offset-2 hover:text-ink">{t('termsLink')}</Link>
            <Link href="/privacy" className="inline-block py-2 underline underline-offset-2 hover:text-ink">{t('privacyLink')}</Link>
          </p>
        </footer>
      </body>
    </html>
  )
}
