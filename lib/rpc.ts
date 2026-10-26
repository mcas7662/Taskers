// taskers/lib/rpc.ts
import { createClient } from '@/lib/supabase/server'
import { errorToken } from '@/lib/errors'

/** Calls a Postgres function (all business rules live in the database). Returns an error token, never raw SQL errors. */
export async function callRpc<T = unknown>(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(fn, args)
  return { data: (data ?? null) as T | null, error: error ? errorToken(error.message) : null }
}
