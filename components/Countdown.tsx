// taskers/components/Countdown.tsx
'use client'

import { useEffect, useState } from 'react'

type Props = { dueAt: string; dict: Record<string, string> }

function pad(n: number) { return String(n).padStart(2, '0') }

export default function Countdown({ dueAt, dict }: Props) {
  const due = new Date(dueAt).getTime()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (now === null) return <span aria-hidden>--:--:--</span>
  const diff = due - now
  const abs = Math.abs(diff)
  const h = Math.floor(abs / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const s = Math.floor((abs % 60000) / 1000)
  const text = `${pad(h)}:${pad(m)}:${pad(s)}`
  return diff >= 0 ? (
    <span className="font-mono font-bold tabular-nums">{text}</span>
  ) : (
    <span className="font-bold text-danger">
      {dict['cd_overdue'] ?? 'Overdue'} <span className="font-mono tabular-nums">{text}</span>
    </span>
  )
}
