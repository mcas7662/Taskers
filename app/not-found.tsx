// taskers/app/not-found.tsx
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { getT } from '@/lib/i18n'

export default async function NotFound() {
  const t = await getT()
  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <SearchX aria-hidden className="mx-auto mb-4 text-brand" size={40} />
      <h1 className="text-2xl font-bold">{t('notFoundTitle')}</h1>
      <p className="mt-2 text-muted">{t('notFoundBody')}</p>
      <Link href="/" className="btn-primary mt-6">{t('goHome')}</Link>
    </section>
  )
}
