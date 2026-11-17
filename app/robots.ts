// taskers/app/robots.ts
import type { MetadataRoute } from 'next'

// Only the landing, login and signup pages are public. Everything else needs an account,
// so search engines are asked not to crawl it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/$', '/login', '/signup'],
      disallow: ['/admin', '/auth', '/chat', '/messages', '/notifications', '/post', '/profile', '/task', '/tasks', '/u'],
    },
  }
}
