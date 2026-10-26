// taskers/app/admin/reports/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { callRpc } from '@/lib/rpc'

export async function resolveReport(fd: FormData) {
  const id = z.string().uuid().safeParse(fd.get('report_id'))
  const action = z.enum(['warn', 'ban', 'dismiss']).safeParse(fd.get('action'))
  if (!id.success || !action.success) redirect('/admin/reports')
  const { error } = await callRpc('admin_resolve_report', {
    p_report_id: id.data,
    p_action: action.data,
    p_note: String(fd.get('note') ?? '').trim().slice(0, 500) || null,
  })
  revalidatePath('/admin/reports')
  redirect(error ? `/admin/reports/${id.data}?e=${error}` : '/admin/reports?ok=1')
}
