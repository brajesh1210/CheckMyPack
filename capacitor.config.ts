import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Set CMP_DEV_SERVER to your laptop's LAN address to make the installed APK
 * load the UI live from Vite instead of its bundled copy:
 *
 *   set CMP_DEV_SERVER=http://192.168.1.7:5173
 *   npm run android:live
 *
 * Leave it unset for real builds — the app then serves its own bundle offline.
 */
const devServer = process.env.CMP_DEV_SERVER

const config: CapacitorConfig = {
  appId: 'in.checkmypack.app',
  appName: 'CheckMyPack',
  webDir: 'dist',
  android: {
    allowMixedContent: !!devServer, // plain-HTTP dev server only
  },
  ...(devServer
    ? {
        server: {
          url: devServer,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#2E7D32',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1D5322',
    },
  },
}

export default config
