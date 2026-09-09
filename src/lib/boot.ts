/**
 * Start-up wiring that has to happen once, before React renders anything.
 *
 * Everything here is best-effort. A failure in any step must leave the app
 * fully usable as an offline, guest-mode scanner — that is the mode the demo
 * falls back to, and it has to be bulletproof.
 */

import { useApp } from '../store/app'
import { startSync, flush } from './sync'
import { restoreSession, completeNativeSignIn } from './auth'
import { onAuthDeepLink } from './native'
import { backendConfigured } from './supabase'

let booted = false

export async function boot() {
  if (booted) return
  booted = true

  if (!backendConfigured()) return // offline-only build; nothing else to do

  // Catch the redirect back from Google in the Android shell.
  void onAuthDeepLink(async (url) => {
    const result = await completeNativeSignIn(url)
    if (result.user) {
      useApp.getState().setUser(result.user)
      // A fresh session means queued guest scans can finally go up.
      void flush()
    }
  })

  try {
    const user = await restoreSession()
    if (user) useApp.getState().setUser(user)
  } catch {
    // A broken stored session must not block start-up; the user stays a guest.
  }

  startSync()
}
