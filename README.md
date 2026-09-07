# CheckMyPack 🛡️

**Scan the packet. Know the truth.**

A Progressive Web App (mobile app + website) that scans a packaged-food label and checks
it against the **Legal Metrology (Packaged Commodities) Rules, 2011** and **FSSAI** labelling
regulations — returning **PASS / VIOLATION / RETAKE** with the exact rule cited.

> Smart India Hackathon 2026 · Problem **SIH26034** · Software · Agriculture/FoodTech/Rural

---

## Status
**Phase 1 (foundation) is live in this repo:**
- ✅ Vite + React + TypeScript + Tailwind, configured as an installable **PWA**
- ✅ Brand theme (emerald), app icons from the CheckMyPack logo
- ✅ **Landing / install page** (mobile-first)
- ✅ 5-page **onboarding**, **Google + Guest** auth screens
- ✅ Bottom-nav app shell: **Home/Scan · History · Complaint · Profile**
- ✅ **Hindi + English** (react-i18next) with a language toggle
- ✅ **Zustand** store (screen, user, language, online/offline, officer mode)
- ✅ **Officer Mode** toggle + officer web-portal placeholder

**Next phases:** camera capture + quality gate + image compression → Gemini (online) /
Tesseract (offline) extraction with bounding boxes → rule engine + verdict screen with
expired banner and on-label boxes → PDF/QR, WhatsApp, 14404, history → Supabase auth/DB →
officer command center with map/analytics.

---

## Run locally
```bash
npm install
npm run dev        # start dev server
npm run build      # production build (also generates the PWA service worker)
npm run preview    # preview the built app
```
Open the shown URL on your phone (same Wi-Fi) to install it: **browser menu → Add to Home Screen**.

## Stack (zero-cost)
React (Vite) · TypeScript · Tailwind · PWA (vite-plugin-pwa) · Zustand · react-i18next ·
Supabase (auth + Postgres, added next) · Google Gemini API (online extraction) · Tesseract.js
(offline OCR) · Open Food Facts (barcode cross-check) · OpenStreetMap/Leaflet (officer map).

## Project structure
```
src/
  i18n/         en.json + hi.json strings
  store/        Zustand store
  pages/        Landing, AppFlow, onboarding, Auth, MainTabs, tabs/*, OfficerPortal
  assets/       logo
public/icons/   PWA icons (192/512)
```
