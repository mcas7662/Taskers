// taskers/lib/site.ts
/** Public address of the site, used for share previews, sitemap and email links. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/+$/, '')
}
