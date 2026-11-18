/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // browsers ask for /favicon.ico on their own; the logo is an SVG
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: false }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
          // Browsers ignore this on http://localhost, so it only takes effect on the real https site.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
}
export default nextConfig
