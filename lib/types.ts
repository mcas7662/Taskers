// taskers/lib/types.ts
export type Division = { id: number; name_en: string; name_bn: string }
export type District = { id: number; division_id: number; name_en: string; name_bn: string }

export type AssignmentStatus =
  | 'negotiating' | 'awaiting_payment' | 'payment_submitted' | 'in_progress'
  | 'awaiting_confirmation' | 'completed' | 'cancelled'

export type Assignment = {
  id: string
  task_id: string
  poster_id: string
  tasker_id: string
  agreed_fee: number
  expense_amount: number
  expense_note: string | null
  duration_minutes: number | null
  total_amount: number
  terms_proposed: boolean
  tasker_agreed: boolean
  status: AssignmentStatus
  payment_method: string | null
  payment_account: string | null
  poster_trx_id: string | null
  payment_proof_path: string | null
  paid_at: string | null
  payment_reject_note: string | null
  started_at: string | null
  due_at: string | null
  ext_minutes: number | null
  ext_reason: string | null
  ext_status: 'pending' | 'approved' | 'rejected' | null
  completion_proof_paths: string[]
  completion_note: string | null
  completion_submitted_at: string | null
  completed_at: string | null
  reject_note: string | null
  cancel_reason: string | null
  created_at: string
}

export type ChatMessage = {
  id: number
  assignment_id: string
  sender_id: string | null
  kind: 'text' | 'system'
  body: string | null
  sys_key: string | null
  meta: Record<string, string | number>
  created_at: string
}

export const DURATION_PRESETS = [10, 15, 30, 45, 60, 90, 120, 180, 360, 720, 1440, 2880, 4320] as const
