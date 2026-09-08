/**
 * Development live-reload bridge.
 *
 * When `VITE_DEV_SERVER` is set at build time, the installed APK loads the UI
 * from that dev server instead of the bundle baked into the app. That means a
 * designer can edit React on their laptop and see it on a real phone instantly,
 * with no rebuild and no reinstall.
 *
 * Production builds leave this unset, so the app always serves its own bundle.
 */

const DEV_SERVER = import.meta.env.VITE_DEV_SERVER as string | undefined

export function devServerUrl(): string | null {
  return DEV_SERVER && DEV_SERVER.startsWith('http') ? DEV_SERVER : null
}

export function isLiveReloading(): boolean {
  return !!devServerUrl()
}

/** Shown in Profile so nobody is confused about which bundle they are looking at. */
export function buildLabel(): string {
  const mode = isLiveReloading() ? 'live-reload' : 'bundled'
  const stamp = import.meta.env.VITE_BUILD_ID || 'local'
  return `${stamp} · ${mode}`
}
