/**
 * Native bridge.
 *
 * The app ships as an Android build (Capacitor) and also runs in a browser for
 * development. Every helper here degrades to the web implementation when no
 * native runtime is present, so one codebase serves both.
 */

import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const platform = () => Capacitor.getPlatform() as 'android' | 'ios' | 'web'

/* ------------------------------------------------------------------ camera */

/** Take a photo with the OS camera UI and return it as a Blob. */
export async function nativePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<Blob | null> {
  if (!isNative()) return null
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

  const photo = await Camera.getPhoto({
    quality: 92,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: source === 'gallery' ? CameraSource.Photos : CameraSource.Camera,
    correctOrientation: true,
    width: 1920,
    promptLabelHeader: 'Capture the label',
    promptLabelPhoto: 'Choose from gallery',
    promptLabelPicture: 'Take a photo',
  })

  if (!photo.webPath) return null
  const res = await fetch(photo.webPath)
  return res.blob()
}

/** Ask for camera permission up front so the denial can be explained. */
export async function ensureCameraPermission(): Promise<boolean> {
  if (!isNative()) return true
  const { Camera } = await import('@capacitor/camera')
  const status = await Camera.checkPermissions()
  if (status.camera === 'granted') return true
  const asked = await Camera.requestPermissions({ permissions: ['camera'] })
  return asked.camera === 'granted'
}

/* ------------------------------------------------------------------- share */

export async function nativeShare(title: string, text: string): Promise<boolean> {
  if (!isNative()) return false
  const { Share } = await import('@capacitor/share')
  try {
    await Share.share({ title, text, dialogTitle: 'Share this report' })
    return true
  } catch {
    return false
  }
}

/* --------------------------------------------------------------- chrome */

/** Tint the system status bar to match the brand. */
export async function initNativeChrome() {
  if (!isNative()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    try {
      await StatusBar.setOverlaysWebView({ overlay: true })
    } catch {
      /* iOS, or an older plugin */
    }
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    /* status bar unavailable */
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* no splash */
  }
}

/* ------------------------------------------------------------------ files */

/** Save a report to the device's Documents folder. Returns the path shown to the user. */
export async function saveTextFile(filename: string, contents: string): Promise<string | null> {
  if (!isNative()) return null
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  const res = await Filesystem.writeFile({
    path: filename,
    data: contents,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  })
  return res.uri
}

/**
 * Listens for the OAuth deep link that Google sends back to the app.
 */
export async function onAuthDeepLink(
  handler: (url: string) => void,
): Promise<() => void> {
  if (!isNative()) return () => {}
  try {
    const { App } = await import('@capacitor/app')
    const sub = await App.addListener('appUrlOpen', (data: any) => {
      const url = data?.url ?? ''
      if (url.includes('auth-callback') || url.includes('code=')) handler(url)
    })
    return () => void sub.remove()
  } catch {
    return () => {}
  }
}

/**
 * Writes a binary file to the device's Documents folder and hands it to the
 * system share sheet.
 */
export async function shareBinaryFile(
  filename: string,
  blob: Blob,
  title: string,
): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')

    const base64 = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '')
      fr.onerror = () => reject(fr.error)
      fr.readAsDataURL(blob)
    })

    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    })

    await Share.share({ title, url: written.uri, dialogTitle: title })
    return true
  } catch {
    return false
  }
}
