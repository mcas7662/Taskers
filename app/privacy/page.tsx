// taskers/app/privacy/page.tsx
import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { getLocale, getT } from '@/lib/i18n'
import { LEGAL_UPDATED, privacyDoc } from '@/lib/legal'
import { fmtDate } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  return { title: privacyDoc(await getLocale()).title }
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const t = await getT()
  return (
    <LegalPage
      doc={privacyDoc(locale)}
      updated={`${locale === 'bn' ? 'সর্বশেষ হালনাগাদ' : 'Last updated'}: ${fmtDate(LEGAL_UPDATED, locale)}`}
      other={{ href: '/terms', label: t('termsLink') }}
    />
  )
}
