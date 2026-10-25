import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Taskers',
    short_name: 'Taskers',
    description: 'Small physical errands, done by people who are already nearby.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2F5F4',
    theme_color: '#0A5C66',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
