import ComingSoon from '@/components/ComingSoon'
import { getT } from '@/lib/i18n'

export default async function Page() {
  const t = await getT()
  return <ComingSoon title={t('navMessages')} />
}
