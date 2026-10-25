import { Hammer } from 'lucide-react'
import { getT } from '@/lib/i18n'

export default async function ComingSoon({ title }: { title: string }) {
  const t = await getT()
  return (
    <section className="mx-auto max-w-xl py-10 text-center">
      <Hammer aria-hidden className="mx-auto mb-4 text-marigold" size={36} />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 font-semibold text-brand">{t('soonTitle')}</p>
      <p className="mx-auto mt-3 max-w-md text-muted">{t('soonBody')}</p>
    </section>
  )
}
