/**
 * Only allow same-site relative redirects (prevents open redirect).
 * Rejects "//evil.com", "/\evil.com" and tricks with tabs/newlines ("/\t/evil.com"),
 * which browsers strip and would turn into a link to another site.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\s]/.test(value)) return '/'
  try {
    const base = 'http://local.invalid'
    const u = new URL(value, base)
    if (u.origin !== base) return '/'
    return u.pathname + u.search + u.hash
  } catch {
    return '/'
  }
}
