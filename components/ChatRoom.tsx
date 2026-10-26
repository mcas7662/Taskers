// taskers/components/ChatRoom.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { errorToken } from '@/lib/errors'
import type { ChatMessage } from '@/lib/types'

type Props = {
  assignmentId: string
  meId: string
  initial: ChatMessage[]
  closed: boolean
  closedKey?: string
  dict: Record<string, string>
  lang: 'bn' | 'en'
}

function fill(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export default function ChatRoom({ assignmentId, meId, initial, closed, closedKey = 'chat_closed', dict, lang }: Props) {
  const d = (k: string) => dict[k] ?? k
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initial)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastId = useRef(initial.length ? initial[initial.length - 1].id : 0)
  const bottom = useRef<HTMLDivElement>(null)
  const nf = (n: number) => n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')

  const fetchNew = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('id, assignment_id, sender_id, kind, body, sys_key, meta, created_at')
      .eq('assignment_id', assignmentId)
      .gt('id', lastId.current)
      .order('id', { ascending: true })
      .limit(100)
    if (data && data.length) {
      lastId.current = data[data.length - 1].id
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id))
        return [...prev, ...(data as ChatMessage[]).filter((m) => !seen.has(m.id))]
      })
      if (data.some((m) => m.kind === 'system')) router.refresh()
    }
  }, [assignmentId, router])

  // realtime + polling fallback (mobile networks drop websockets often)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${assignmentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `assignment_id=eq.${assignmentId}` }, () => void fetchNew())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `id=eq.${assignmentId}` }, () => router.refresh())
      .subscribe()
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchNew()
    }, 12000)
    return () => {
      clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [assignmentId, fetchNew, router])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.rpc('send_message', { p_assignment_id: assignmentId, p_body: body })
    if (err) {
      const tok = errorToken(err.message)
      setError(dict[`err_${tok}`] ?? d('chat_sendFailed'))
    } else {
      setText('')
      await fetchNew()
    }
    setSending(false)
  }

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' })

  return (
    <section aria-label={d('chat_title')} className="border border-line bg-surface">
      <p className="border-b border-dashed border-line px-3 py-2 text-xs text-muted">{d('chat_notice')}</p>
      <ul className="max-h-[50vh] min-h-40 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {messages.length === 0 && <li className="py-6 text-center text-sm text-muted">{d('chat_empty')}</li>}
        {messages.map((m) => {
          if (m.kind === 'system') {
            const tpl = dict[`sys_${m.sys_key}`] ?? m.sys_key ?? ''
            const meta = m.meta ?? {}
            return (
              <li key={m.id} className="mx-auto max-w-[90%] rounded-md bg-brand-soft px-3 py-1.5 text-center text-xs text-brand-dark">
                {fill(tpl, {
                  fee: meta.fee != null ? '৳' + nf(Number(meta.fee)) : '',
                  expense: meta.expense != null ? '৳' + nf(Number(meta.expense)) : '',
                  total: meta.total != null ? '৳' + nf(Number(meta.total)) : '',
                  minutes: meta.minutes != null ? nf(Number(meta.minutes)) : '',
                })}
              </li>
            )
          }
          const mine = m.sender_id === meId
          return (
            <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${mine ? 'bg-brand text-white' : 'bg-bg text-ink'}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-0.5 text-right text-[11px] ${mine ? 'text-white/70' : 'text-muted'}`}>{time(m.created_at)}</p>
              </div>
            </li>
          )
        })}
        <div ref={bottom} />
      </ul>
      {closed ? (
        <p className="border-t border-line px-3 py-3 text-center text-sm text-muted">{d(closedKey)}</p>
      ) : (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-2">
          <label htmlFor="chat_input" className="sr-only">{d('chat_placeholder')}</label>
          <textarea id="chat_input" value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder={d('chat_placeholder')}
            className="field max-h-32 min-h-11 resize-none" />
          <button type="submit" disabled={sending || !text.trim()} aria-label={d('chat_send')} className="btn-primary size-11 shrink-0 px-0">
            <Send size={20} aria-hidden />
          </button>
        </form>
      )}
      {error && <p role="alert" className="px-3 pb-2 text-sm text-danger">{error}</p>}
    </section>
  )
}
