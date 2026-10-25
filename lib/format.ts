import type { Locale } from './i18n'

export function taka(amount: number, locale: Locale) {
  return '৳' + amount.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')
}
