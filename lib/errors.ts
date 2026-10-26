// taskers/lib/errors.ts
import type { T, TKey } from './i18n'

// Tokens raised by the database functions (RAISE EXCEPTION '<token>').
const TOKENS = [
  'auth_required', 'account_restricted', 'profile_incomplete', 'underage', 'invalid_amount', 'invalid_input',
  'out_of_area', 'permission_required', 'too_many_open', 'not_found', 'task_not_open', 'offer_closed', 'own_task',
  'not_eligible', 'wrong_state', 'terms_changed', 'invalid_account', 'proof_required', 'note_required',
  'chat_closed', 'already_reviewed', 'already_reported', 'forbidden', 'invite_limit', 'dob_locked',
] as const

export function errorToken(message?: string | null): string {
  const m = message ?? ''
  return TOKENS.find((x) => m.includes(x)) ?? 'generic'
}

export function errorText(t: T, token?: string | null): string | null {
  if (!token) return null
  if (token === 'generic') return t('errGeneric')
  return t(`err_${token}` as TKey) ?? t('errGeneric')
}
