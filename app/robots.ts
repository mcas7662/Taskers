// taskers/app/robots.ts
import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// Only the landing, login, signup and legal pages are public. Everything else needs an account,
// so search engines are asked not to crawl it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/$', '/login', '/signup', '/terms', '/privacy'],
      disallow: ['/admin', '/auth', '/chat', '/messages', '/notifications', '/post', '/profile', '/task', '/tasks', '/u',
        '/forgot-password', '/reset-password'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
