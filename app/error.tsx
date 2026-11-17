// taskers/app/error.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

// Error pages are client components, so they cannot use getT(); the few strings live here.
const TEXT = {
  bn: { title: 'কিছু একটা সমস্যা হয়েছে', body: 'পেজটি লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।', retry: 'আবার চেষ্টা করুন', home: 'হোম পেজে যান' },
  en: { title: 'Something went wrong', body: 'The page could not be loaded. Check your internet connection and try again.', retry: 'Try again', home: 'Go to home page' },
}

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<'bn' | 'en'>('bn')
  useEffect(() => {
    setLang(/(?:^|;\s*)locale=en(?:;|$)/.test(document.cookie) ? 'en' : 'bn')
    console.error(error)
  }, [error])
  const s = TEXT[lang]

  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <TriangleAlert aria-hidden className="mx-auto mb-4 text-marigold" size={40} />
      <h1 className="text-2xl font-bold">{s.title}</h1>
      <p className="mt-2 text-muted">{s.body}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">#{error.digest}</p>}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary">{s.retry}</button>
        <Link href="/" className="btn-ghost">{s.home}</Link>
      </div>
    </section>
  )
}
