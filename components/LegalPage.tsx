// taskers/components/LegalPage.tsx
import Link from 'next/link'
import type { LegalDoc } from '@/lib/legal'

export default function LegalPage({ doc, updated, other }: { doc: LegalDoc; updated: string; other: { href: string; label: string } }) {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{doc.title}</h1>
        <p className="mt-1 text-sm text-muted">{updated}</p>
        <p className="mt-4">{doc.intro}</p>
      </header>
      {doc.sections.map((s) => (
        <section key={s.h} className="space-y-2">
          <h2 className="text-lg font-bold">{s.h}</h2>
          {s.p.map((p) => <p key={p} className="text-ink/90">{p}</p>)}
        </section>
      ))}
      <p className="border-t border-line pt-4 text-sm">
        <Link href={other.href} className="inline-block py-2 font-semibold text-brand underline underline-offset-2">{other.label}</Link>
      </p>
    </article>
  )
}
