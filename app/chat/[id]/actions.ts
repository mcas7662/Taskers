// taskers/app/chat/[id]/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { callRpc } from '@/lib/rpc'

const uuid = z.string().uuid()

function aid(fd: FormData) {
  const p = uuid.safeParse(fd.get('assignment_id'))
  if (!p.success) redirect('/messages')
  return p.data
}
function str(fd: FormData, k: string, max = 500) {
  return String(fd.get(k) ?? '').trim().slice(0, max)
}
function int(fd: FormData, k: string) {
  const n = Number(fd.get(k))
  return Number.isFinite(n) ? Math.round(n) : NaN
}
function done(id: string, error: string | null, ok?: string): never {
  revalidatePath(`/chat/${id}`)
  revalidatePath('/messages')
  redirect(`/chat/${id}?${error ? `e=${error}` : `ok=${ok ?? 'done'}`}`)
}

export async function proposeTerms(fd: FormData) {
  const id = aid(fd)
  const custom = int(fd, 'custom_minutes')
  const minutes = Number.isFinite(custom) && custom > 0 ? custom : int(fd, 'duration_min')
  const { error } = await callRpc('propose_terms', {
    p_assignment_id: id,
    p_expense: int(fd, 'expense') || 0,
    p_note: str(fd, 'note', 300) || null,
    p_duration_min: minutes,
  })
  done(id, error, 'terms_proposed')
}

export async function agreeTerms(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('agree_terms', {
    p_assignment_id: id,
    p_method: str(fd, 'method', 20),
    p_account: str(fd, 'account', 60),
    p_expected_total: int(fd, 'expected_total'),
    p_expected_minutes: int(fd, 'expected_minutes'),
  })
  done(id, error, 'terms_agreed')
}

export async function markPaid(fd: FormData) {
  const id = aid(fd)
  const path = String(fd.getAll('proof_path')[0] ?? '')
  const { error } = await callRpc('mark_paid', { p_assignment_id: id, p_proof_path: path, p_trx: str(fd, 'trx', 60) || null })
  done(id, error, 'paid')
}

export async function confirmPayment(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('confirm_payment', { p_assignment_id: id })
  done(id, error, 'payment_confirmed')
}

export async function rejectPayment(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('reject_payment', { p_assignment_id: id, p_note: str(fd, 'note', 300) || null })
  done(id, error, 'payment_rejected')
}

export async function requestExtension(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('request_extension', { p_assignment_id: id, p_minutes: int(fd, 'minutes'), p_reason: str(fd, 'reason', 300) })
  done(id, error, 'ext_requested')
}

export async function respondExtension(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('respond_extension', { p_assignment_id: id, p_approve: fd.get('approve') === '1' })
  done(id, error, 'ext_answered')
}

export async function extendTimer(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('extend_timer', { p_assignment_id: id, p_minutes: int(fd, 'minutes') })
  done(id, error, 'timer_extended')
}

export async function submitCompletion(fd: FormData) {
  const id = aid(fd)
  const paths = fd.getAll('proof_path').map(String).slice(0, 5)
  const { error } = await callRpc('submit_completion', { p_assignment_id: id, p_paths: paths, p_note: str(fd, 'note', 500) || null })
  done(id, error, 'completion_submitted')
}

export async function confirmCompletion(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('confirm_completion', { p_assignment_id: id })
  done(id, error, 'completed')
}

export async function rejectCompletion(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('reject_completion', { p_assignment_id: id, p_note: str(fd, 'note', 300) })
  done(id, error, 'completion_rejected')
}

export async function cancelDeal(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('cancel_assignment', { p_assignment_id: id, p_reason: str(fd, 'reason', 300) || null })
  done(id, error, 'cancelled')
}

export async function submitReview(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('submit_review', { p_assignment_id: id, p_stars: int(fd, 'stars'), p_comment: str(fd, 'comment', 500) || null })
  done(id, error, 'reviewed')
}

export async function submitReport(fd: FormData) {
  const id = aid(fd)
  const { error } = await callRpc('submit_report', { p_assignment_id: id, p_reason: str(fd, 'reason', 30), p_details: str(fd, 'details', 1000) || null })
  done(id, error, 'reported')
}
