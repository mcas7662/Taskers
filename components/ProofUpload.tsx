// taskers/components/ProofUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Item = { path: string; preview: string }
type Props = { assignmentId: string; kind: 'payment' | 'completion'; max: number; dict: Record<string, string> }

/** Shrinks a phone photo (often 4-8 MB) to ~1600px JPEG before upload. */
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('compress'))), 'image/jpeg', 0.82)
  )
}

export default function ProofUpload({ assignmentId, kind, max, dict }: Props) {
  const d = (k: string) => dict[k] ?? k
  const input = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, max - items.length)
    e.target.value = ''
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const added: Item[] = []
    for (const f of files) {
      try {
        const blob = await compress(f)
        const path = `${assignmentId}/${kind}/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await supabase.storage.from('task-proofs').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (upErr) throw upErr
        added.push({ path, preview: URL.createObjectURL(blob) })
      } catch {
        setError(d('up_failed'))
      }
    }
    setItems((prev) => [...prev, ...added])
    setBusy(false)
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/*" multiple={max > 1} onChange={onPick} className="hidden" />
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <div key={it.path} className="relative size-24 border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.preview} alt="" className="size-full object-cover" />
            <button type="button" aria-label={d('up_remove')} onClick={() => setItems((p) => p.filter((x) => x.path !== it.path))}
              className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-danger text-white">
              <X size={16} aria-hidden />
            </button>
            <input type="hidden" name="proof_path" value={it.path} />
          </div>
        ))}
        {items.length < max && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="grid size-24 place-items-center border-2 border-dashed border-brand/50 bg-brand-soft text-sm font-semibold text-brand">
            <span className="flex flex-col items-center gap-1">
              <Camera size={22} aria-hidden />
              {busy ? d('up_uploading') : d('up_add')}
            </span>
          </button>
        )}
      </div>
      {/* makes the browser block submit until at least one photo is uploaded */}
      <input required tabIndex={-1} aria-hidden value={items[0]?.path ?? ''} onChange={() => {}} className="sr-only" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}
