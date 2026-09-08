import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ScanOutcome } from '../lib/pipeline'

export type Role = 'consumer' | 'officer' | 'manufacturer' | null
export type User = { name: string; email: string; provider: 'google' | 'gov' | 'guest' } | null

/** A scan trimmed down for long-term storage (full OCR text is dropped). */
export interface StoredScan {
  id: string
  createdAt: string
  productName: string
  verdict: 'PASS' | 'VIOLATION' | 'RETAKE'
  grade: 'A' | 'B' | 'C'
  score: number
  expired: boolean
  imageDataUrl: string
  place: string
  barcode: string | null
  synced: boolean
  findings: {
    id: string
    label: string
    statute: string
    message: string
    guidance: string
    severity: 'critical' | 'major' | 'minor'
    passed: boolean
    value: string | null
    box?: { x: number; y: number; w: number; h: number }
  }[]
  quality: { sharpness: number; glare: number; luma: number; contrast: number; pass: boolean; reasons: string[] }
}

export function toStored(o: ScanOutcome, place = 'Delhi, India'): StoredScan {
  return {
    id: o.id,
    createdAt: o.createdAt,
    productName: o.productName,
    verdict: o.engine.verdict,
    grade: o.engine.grade,
    score: o.engine.score,
    expired: o.engine.expired,
    imageDataUrl: o.imageDataUrl,
    place,
    barcode: o.barcode,
    synced: false,
    findings: o.engine.findings.map((f) => ({
      id: f.id,
      label: f.label,
      statute: f.statute,
      message: f.message,
      guidance: f.guidance,
      severity: f.severity,
      passed: f.passed,
      value: f.value,
      box: f.box,
    })),
    quality: {
      sharpness: o.quality.sharpness,
      glare: o.quality.glare,
      luma: o.quality.luma,
      contrast: o.quality.contrast,
      pass: o.quality.pass,
      reasons: o.quality.reasons,
    },
  }
}

interface AppState {
  role: Role
  user: User
  lang: 'en' | 'hi'
  online: boolean
  voice: boolean
  scans: StoredScan[]
  lastScanId: string | null
  setRole: (r: Role) => void
  setUser: (u: User) => void
  setLang: (l: 'en' | 'hi') => void
  setVoice: (v: boolean) => void
  addScan: (s: StoredScan) => void
  removeScan: (id: string) => void
  markSynced: (ids: string[]) => void
  clearScans: () => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      role: null,
      user: null,
      lang: 'en',
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      voice: true,
      scans: [],
      lastScanId: null,
      setRole: (role) => set({ role }),
      setUser: (user) => set({ user }),
      setLang: (lang) => set({ lang }),
      setVoice: (voice) => set({ voice }),
      addScan: (s) => set((st) => ({ scans: [s, ...st.scans].slice(0, 60), lastScanId: s.id })),
      removeScan: (id) => set((st) => ({ scans: st.scans.filter((x) => x.id !== id) })),
      markSynced: (ids) =>
        set((st) => ({ scans: st.scans.map((s) => (ids.includes(s.id) ? { ...s, synced: true } : s)) })),
      clearScans: () => set({ scans: [], lastScanId: null }),
    }),
    {
      name: 'checkmypack-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        role: s.role,
        user: s.user,
        lang: s.lang,
        voice: s.voice,
        scans: s.scans,
        lastScanId: s.lastScanId,
      }),
    },
  ),
)

if (typeof window !== 'undefined') {
  const sync = () => useApp.setState({ online: navigator.onLine })
  window.addEventListener('online', sync)
  window.addEventListener('offline', sync)
}
