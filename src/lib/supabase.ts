/**
 * Supabase client.
 *
 * The whole backend is optional. If the project URL is not configured, every
 * export here degrades to a no-op and the app runs exactly as it does today:
 * scans live in local storage, login is a guest session, and nothing is sent
 * anywhere. This keeps the demo bulletproof on a venue's bad WiFi.
 */

import type { SupabaseClient, Session } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null
let loading: Promise<SupabaseClient | null> | null = null

export function backendConfigured(): boolean {
  return !!(URL && ANON)
}

/**
 * Lazily loads supabase-js so the ~40 KB never lands in the initial bundle for
 * users who scan as guests.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!backendConfigured()) return null
  if (client) return client
  if (loading) return loading

  loading = (async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      client = createClient(URL!, ANON!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // The app runs on a hash router inside a WebView, where the implicit
          // OAuth fragment cannot be reliably parsed.
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
        global: { headers: { 'x-application-name': 'checkmypack' } },
      })
      return client
    } catch {
      return null
    } finally {
      loading = null
    }
  })()

  return loading
}

export async function currentSession(): Promise<Session | null> {
  const sb = await getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function currentUserId(): Promise<string | null> {
  return (await currentSession())?.user.id ?? null
}
