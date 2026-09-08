/**
 * Authentication.
 *
 * Signing in is entirely optional: a guest can scan, get a verdict, save
 * history and share a report without ever seeing a login screen. An account
 * only buys history that survives a reinstall, and the officer console.
 *
 * When Supabase is not configured, every function here still resolves — it
 * just produces a local guest identity. That is what keeps the demo working
 * with no network.
 */

import type { User } from '../store/app'
import { getSupabase, backendConfigured, currentSession } from './supabase'
import { isNative } from './native'

export interface AuthResult {
  user: User
  /** True when this is a local-only identity with no server session. */
  guest: boolean
  error?: string
}

const GUEST: User = { name: 'Guest', email: '', provider: 'guest' }

export function signInAsGuest(): AuthResult {
  return { user: GUEST, guest: true }
}

/**
 * Where the OAuth provider should send the user back to.
 *
 * In the Android shell the app is served from a capacitor:// origin that
 * Google will not redirect to, so we use the registered deep link instead.
 */
function redirectTarget(): string {
  if (isNative()) return 'in.checkmypack.app://auth-callback'
  return `${window.location.origin}${window.location.pathname}`
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const sb = await getSupabase()
  if (!sb) {
    // Not configured — fall back rather than blocking the user.
    return { ...signInAsGuest(), error: 'Sign-in is not available in this build.' }
  }

  try {
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget(),
        skipBrowserRedirect: isNative(),
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) return { ...signInAsGuest(), error: error.message }

    if (isNative() && data?.url) {
      // Hand off to the system browser; the deep link brings us back.
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: data.url, presentationStyle: 'popover' })
      return { user: null, guest: false } // resolved later by the deep link
    }

    return { user: null, guest: false } // web: the page is navigating away
  } catch (e) {
    return {
      ...signInAsGuest(),
      error: e instanceof Error ? e.message : 'Sign-in failed.',
    }
  }
}

/**
 * Completes a native OAuth round trip. The deep-link handler passes the URL it
 * received; we hand the code to Supabase to exchange for a session.
 */
export async function completeNativeSignIn(url: string): Promise<AuthResult> {
  const sb = await getSupabase()
  if (!sb) return signInAsGuest()

  try {
    const code = new URL(url).searchParams.get('code')
    if (!code) return signInAsGuest()

    const { data, error } = await sb.auth.exchangeCodeForSession(code)
    if (error || !data.session) {
      return { ...signInAsGuest(), error: error?.message }
    }

    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.close()
    } catch {
      // Browser may already be closed; harmless.
    }

    return { user: toUser(data.session.user), guest: false }
  } catch (e) {
    return { ...signInAsGuest(), error: e instanceof Error ? e.message : undefined }
  }
}

function toUser(u: { email?: string; user_metadata?: Record<string, unknown> }): User {
  const meta = u.user_metadata ?? {}
  return {
    name:
      (meta.full_name as string) ||
      (meta.name as string) ||
      u.email?.split('@')[0] ||
      'Signed in',
    email: u.email ?? '',
    provider: 'google',
  }
}

/** Restores a session on app start. Returns null when there is none. */
export async function restoreSession(): Promise<User> {
  if (!backendConfigured()) return null
  const session = await currentSession()
  return session ? toUser(session.user) : null
}

export async function signOut(): Promise<void> {
  const sb = await getSupabase()
  if (sb) {
    try {
      await sb.auth.signOut()
    } catch {
      // Even if the server call fails, the local state is cleared by caller.
    }
  }
}

/** True when the signed-in user is an approved enforcement officer. */
export async function isVerifiedOfficer(): Promise<boolean> {
  const sb = await getSupabase()
  if (!sb) return false
  try {
    const { data } = await sb
      .from('profiles')
      .select('role, officer_verified')
      .maybeSingle()
    return !!data && data.role === 'officer' && data.officer_verified === true
  } catch {
    return false
  }
}
