// taskers/app/task/[id]/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { callRpc } from '@/lib/rpc'

const id = z.string().uuid()

function back(taskId: string, params: string): never {
  redirect(`/task/${taskId}?${params}`)
}

export async function makeOffer(formData: FormData) {
  const taskId = id.safeParse(formData.get('task_id'))
  if (!taskId.success) redirect('/')
  const amount = Number(formData.get('amount'))
  if (!Number.isInteger(amount)) back(taskId.data, 'e=invalid_amount')
  const message = String(formData.get('message') ?? '').slice(0, 300)
  const { data, error } = await callRpc<{ offer_id: string; assignment_id: string | null }>('submit_offer', {
    p_task_id: taskId.data,
    p_amount: amount,
    p_message: message || null,
  })
  if (error) back(taskId.data, `e=${error}`)
  revalidatePath(`/task/${taskId.data}`)
  if (data?.assignment_id) redirect(`/chat/${data.assignment_id}`)
  back(taskId.data, 'ok=offer')
}

export async function withdrawOffer(formData: FormData) {
  const taskId = id.safeParse(formData.get('task_id'))
  const offerId = id.safeParse(formData.get('offer_id'))
  if (!taskId.success || !offerId.success) redirect('/')
  const { error } = await callRpc('withdraw_offer', { p_offer_id: offerId.data })
  revalidatePath(`/task/${taskId.data}`)
  back(taskId.data, error ? `e=${error}` : 'ok=withdrawn')
}

export async function acceptOffer(formData: FormData) {
  const taskId = id.safeParse(formData.get('task_id'))
  const offerId = id.safeParse(formData.get('offer_id'))
  if (!taskId.success || !offerId.success) redirect('/')
  const { data, error } = await callRpc<string>('accept_offer', { p_offer_id: offerId.data })
  if (error || !data) back(taskId.data, `e=${error ?? 'generic'}`)
  redirect(`/chat/${data}`)
}

export async function declineOffer(formData: FormData) {
  const taskId = id.safeParse(formData.get('task_id'))
  const offerId = id.safeParse(formData.get('offer_id'))
  if (!taskId.success || !offerId.success) redirect('/')
  const { error } = await callRpc('decline_offer', { p_offer_id: offerId.data })
  revalidatePath(`/task/${taskId.data}`)
  back(taskId.data, error ? `e=${error}` : 'ok=declined')
}

export async function cancelTask(formData: FormData) {
  const taskId = id.safeParse(formData.get('task_id'))
  if (!taskId.success) redirect('/')
  const { error } = await callRpc('cancel_task', { p_task_id: taskId.data })
  revalidatePath('/tasks')
  if (error) back(taskId.data, `e=${error}`)
  redirect('/tasks')
}
