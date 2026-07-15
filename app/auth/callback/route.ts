import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const locale = searchParams.get('locale') || 'hu'
  const next = searchParams.get('next') ?? `/${locale}`

  // Behind a proxy (Vercel) request.nextUrl.origin can resolve to an internal
  // host, which is how OAuth/redirects can bounce to localhost. Prefer the
  // forwarded host/proto so we always redirect back to the public origin.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const baseUrl = forwardedHost
    ? `${forwardedProto ?? 'https'}://${forwardedHost}`
    : origin

  // The provider returned an error (denied consent, misconfig, etc.).
  if (error) {
    console.error('[auth/callback] provider error', error, errorDescription)
    return NextResponse.redirect(`${baseUrl}/${locale}/auth/login?error=oauth_error`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      // `next` may be an absolute path (e.g. /hu/auth/update-password) or a
      // full URL from Supabase; only trust internal paths.
      const target = next.startsWith('/') ? `${baseUrl}${next}` : `${baseUrl}/${locale}`
      return NextResponse.redirect(target)
    }
    console.error('[auth/callback] exchange error', exchangeError.message)
  }

  return NextResponse.redirect(`${baseUrl}/${locale}/auth/login?error=auth_callback_error`)
}
