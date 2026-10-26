// taskers/app/task/[id]/notify/actions.ts
'use server'

import { z } from 'zod'
import { getT } from '@/lib/i18n'
import { callRpc } from '@/lib/rpc'
import { errorText } from '@/lib/errors'

export type TaskerRow = {
  user_id: string
  full_name: string
  rating_avg: number
  rating_count: number
  tasks_completed_count: number
  distance_band_m: number | null
  invited: boolean
}

const base = z.object({
  taskId: z.string().uuid(),
  radius: z.number().int().min(200).max(10000).nullable(),
  districtId: z.number().int().positive().nullable(),
  upazila: z.string().trim().max(80).nullable(),
})

export async function searchTaskers(input: unknown): Promise<{ rows?: TaskerRow[]; error?: string }> {
  const t = await getT()
  const p = base.safeParse(input)
  if (!p.success || (p.data.radius === null && p.data.districtId === null)) return { error: t('errInvalid') }
  const { data, error } = await callRpc<TaskerRow[]>('search_taskers', {
    p_task_id: p.data.taskId,
    p_radius_m: p.data.radius,
    p_district_id: p.data.districtId,
    p_upazila: p.data.upazila || null,
  })
  if (error) return { error: errorText(t, error) ?? t('errGeneric') }
  return { rows: data ?? [] }
}

export async function sendInvites(input: unknown): Promise<{ sent?: number; error?: string }> {
  const t = await getT()
  const p = base.extend({ userIds: z.array(z.string().uuid()).max(100).nullable() }).safeParse(input)
  if (!p.success) return { error: t('errInvalid') }
  const { data, error } = await callRpc<number>('send_task_invites', {
    p_task_id: p.data.taskId,
    p_user_ids: p.data.userIds,
    p_radius_m: p.data.radius,
    p_district_id: p.data.districtId,
    p_upazila: p.data.upazila || null,
  })
  if (error) return { error: errorText(t, error) ?? t('errGeneric') }
  return { sent: data ?? 0 }
}
