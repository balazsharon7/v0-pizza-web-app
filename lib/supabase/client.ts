import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Memoize the browser client so every component that calls createClient()
// during a session shares the same instance. Without this, each render of a
// hook that does `const supabase = createClient()` produces a new reference,
// which can re-trigger `useEffect([supabase])` dependencies and cause
// duplicated auth-state subscriptions.
//
// Guarded against accidental server-side reuse (which would leak session
// state between requests) by checking for `window`.
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Never cache on the server; each request must get its own client.
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  if (browserClient) return browserClient
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return browserClient
}
