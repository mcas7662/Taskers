// taskers/lib/format.ts
import type { Locale } from './i18n'

const loc = (l: Locale) => (l === 'bn' ? 'bn-BD' : 'en-US')

export function taka(amount: number, locale: Locale) {
  return '৳' + amount.toLocaleString(loc(locale))
}

export function num(n: number, locale: Locale) {
  return n.toLocaleString(loc(locale))
}

export function fill(text: string, vars: Record<string, string | number | undefined | null>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])))
}

export function fmtDateTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtDuration(totalMin: number, locale: Locale) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const hu = locale === 'bn' ? 'ঘণ্টা' : 'h'
  const mu = locale === 'bn' ? 'মিনিট' : 'min'
  const parts: string[] = []
  if (h) parts.push(`${num(h, locale)} ${hu}`)
  if (m || !h) parts.push(`${num(m, locale)} ${mu}`)
  return parts.join(' ')
}

export function timeAgo(iso: string, locale: Locale) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1) return locale === 'bn' ? 'এইমাত্র' : 'just now'
  if (min < 60) return locale === 'bn' ? `${num(min, locale)} মিনিট আগে` : `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return locale === 'bn' ? `${num(h, locale)} ঘণ্টা আগে` : `${h}h ago`
  const d = Math.floor(h / 24)
  return locale === 'bn' ? `${num(d, locale)} দিন আগে` : `${d}d ago`
}
