// taskers/lib/maps.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any
  }
}

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

let loading: Promise<any> | null = null

/** Loads the Google Maps JS API once. Resolves to window.google. Rejects if no key or the script fails. */
export function loadGoogleMaps(language: string): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('server'))
  if (!MAPS_KEY) return Promise.reject(new Error('no_key'))
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&v=weekly&loading=async&language=${language}&region=BD`
    s.async = true
    s.onload = () => (window.google?.maps?.importLibrary ? resolve(window.google) : reject(new Error('load_failed')))
    s.onerror = () => {
      loading = null
      reject(new Error('load_failed'))
    }
    document.head.appendChild(s)
  })
  return loading
}
