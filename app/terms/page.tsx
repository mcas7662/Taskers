// taskers/app/terms/page.tsx
import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { getLocale, getT } from '@/lib/i18n'
import { LEGAL_UPDATED, termsDoc } from '@/lib/legal'
import { fmtDate } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  return { title: termsDoc(await getLocale()).title }
}

export default async function TermsPage() {
  const locale = await getLocale()
  const t = await getT()
  return (
    <LegalPage
      doc={termsDoc(locale)}
      updated={`${locale === 'bn' ? 'সর্বশেষ হালনাগাদ' : 'Last updated'}: ${fmtDate(LEGAL_UPDATED, locale)}`}
      other={{ href: '/privacy', label: t('privacyLink') }}
    />
  )
}
