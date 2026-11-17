// taskers/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeNext } from '@/lib/utils'

const PROTECTED = ['/profile', '/post', '/tasks', '/messages', '/task', '/chat', '/notifications', '/admin', '/u']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Validates the JWT with Supabase (do not replace with getSession on the server).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + '/'))
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    // keep the query string too (e.g. /tasks?tab=doing) so the person lands back on the same view
    url.searchParams.set('next', path + request.nextUrl.search)
    return NextResponse.redirect(url)
  }
  // already logged in: the login / signup pages make no sense, send them on
  if (user && (path === '/login' || path === '/signup')) {
    const redirect = NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get('next')), request.url))
    // carry over any refreshed session cookies
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }
  return response
}
