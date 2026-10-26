// taskers/components/MarkAllRead.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!hasUnread) return
    const supabase = createClient()
    supabase.from('notifications').update({ is_read: true }).eq('is_read', false).then(() => router.refresh())
  }, [hasUnread, router])
  return null
}
