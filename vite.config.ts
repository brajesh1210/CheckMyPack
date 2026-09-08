import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base './' makes the built app work on ANY host (Vercel, Netlify, GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'CheckMyPack — label compliance scanner',
        short_name: 'CheckMyPack',
        description: 'Scan a packet and check its label against LMPC 2011 and FSSAI rules.',
        theme_color: '#2E7D32',
        background_color: '#FBFAF8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        categories: ['utilities', 'shopping', 'government'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Scan a pack', short_name: 'Scan', url: './#/app/scan' },
          { name: 'Scan history', short_name: 'History', url: './#/app/history' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Tesseract WASM core + language data — cache so OCR works offline
            // after the first successful scan.
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|tessdata\.projectnaptha\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-assets',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'off-lookups',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true, port: 5173, allowedHosts: true },
  preview: { host: true, port: 4173, allowedHosts: true },
})
