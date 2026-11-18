// taskers/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'
import { LEGAL_UPDATED } from '@/lib/legal'

// Only public pages. Everything else needs an account (see app/robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/signup`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
