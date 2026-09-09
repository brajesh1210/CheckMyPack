import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ScanOutcome } from '../lib/pipeline'
import { queueScan } from '../lib/sync'
import { rulesMeta } from '../lib/engine'
import { setLanguage } from '../i18n'

export type Role = 'consumer' | 'officer' | 'manufacturer' | null
export type User = { name: string; email: string; provider: 'google' | 'gov' | 'guest' } | null

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
  reader: 'gemini' | 'tesseract' | 'none'
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
    reader: o.reader,
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

const DEFAULT_SCANS: StoredScan[] = [
  {
    id: 'CMP-1005-8403',
    createdAt: '2026-05-12T20:21:00.000Z',
    productName: 'Amul Taaza Milk',
    verdict: 'PASS',
    grade: 'A',
    score: 98,
    expired: false,
    imageDataUrl: '',
    place: 'Delhi, India',
    barcode: '8901262010052',
    reader: 'gemini',
    synced: true,
    findings: [
      { id: 'MRP_PRESENT', label: 'Maximum Retail Price', statute: 'LMPC Rules 2011 — Rule 6(1)(g)', message: 'MRP ₹34.00 inclusive of all taxes', guidance: 'Compliant', severity: 'critical', passed: true, value: '₹34.00 (incl. of all taxes)', box: { x: 0.15, y: 0.42, w: 0.7, h: 0.08 } },
      { id: 'NETQTY_PRESENT', label: 'Net Quantity', statute: 'LMPC Rules 2011 — Rule 6(1)(d)', message: 'Net volume 500 mL', guidance: 'Standard unit', severity: 'critical', passed: true, value: '500 mL', box: { x: 0.15, y: 0.35, w: 0.5, h: 0.06 } },
      { id: 'MFG_DATE_PRESENT', label: 'Manufacturing Date', statute: 'LMPC Rules 2011 — Rule 6(1)(e)', message: 'Mfg: 10/05/2026', guidance: 'Valid format', severity: 'critical', passed: true, value: '10/05/2026', box: { x: 0.15, y: 0.52, w: 0.35, h: 0.06 } },
      { id: 'EXPIRY_PRESENT', label: 'Best Before', statute: 'FSSAI Labelling Regulations', message: 'Use By: 14/05/2026', guidance: 'Unexpired', severity: 'major', passed: true, value: '14/05/2026', box: { x: 0.52, y: 0.52, w: 0.35, h: 0.06 } },
      { id: 'FSSAI_LICENCE_PRESENT', label: 'FSSAI Licence', statute: 'FSSAI Regulations 2020', message: 'Lic. No. 10012021000123', guidance: '14-digit verified', severity: 'critical', passed: true, value: '10012021000123', box: { x: 0.15, y: 0.62, w: 0.7, h: 0.07 } },
      { id: 'MANUFACTURER_PRESENT', label: 'Manufacturer Details', statute: 'LMPC Rules 2011 — Rule 6(1)(a)', message: 'Gujarat Co-operative Milk Marketing Federation Ltd., Anand', guidance: 'Valid address', severity: 'critical', passed: true, value: 'GCMMF Ltd., Anand 388001', box: { x: 0.15, y: 0.72, w: 0.7, h: 0.09 } },
      { id: 'CUSTOMER_CARE_PRESENT', label: 'Consumer Care', statute: 'LMPC Rules 2011 — Rule 6(1)(j)', message: '1800 258 3333 / customercare@amul.coop', guidance: 'Toll-free verified', severity: 'major', passed: true, value: '1800 258 3333', box: { x: 0.15, y: 0.83, w: 0.7, h: 0.06 } },
      { id: 'VEG_SYMBOL_PRESENT', label: 'Veg/Non-Veg Symbol', statute: 'FSSAI Labelling Regulations', message: 'Green dot in square mark detected', guidance: 'Present on FOP', severity: 'major', passed: true, value: 'Vegetarian mark', box: { x: 0.78, y: 0.88, w: 0.12, h: 0.08 } },
    ],
    quality: { sharpness: 3800, glare: 0.02, luma: 185, contrast: 55, pass: true, reasons: [] },
  },
  {
    id: 'CMP-1004-9214',
    createdAt: '2026-05-10T11:37:00.000Z',
    productName: 'Britannia Sunfeast',
    verdict: 'VIOLATION',
    grade: 'C',
    score: 45,
    expired: false,
    imageDataUrl: '',
    place: 'Noida, Uttar Pradesh',
    barcode: '8901063128910',
    reader: 'gemini',
    synced: true,
    findings: [
      { id: 'MRP_PRESENT', label: 'MRP Declaration', statute: 'LMPC Rules 2011 — Rule 6', message: 'MRP declaration does not follow the required format.', guidance: 'The package must declare the retail sale price in the prescribed manner.', severity: 'critical', passed: false, value: null, box: { x: 0.15, y: 0.42, w: 0.7, h: 0.1 } },
      { id: 'CUSTOMER_CARE_PRESENT', label: 'Consumer care details', statute: 'LMPC Rules 2011 — Rule 6(1)(j)', message: 'Mandatory customer care telephone or email missing from back panel.', guidance: 'Must provide helpline.', severity: 'major', passed: false, value: null, box: { x: 0.15, y: 0.82, w: 0.7, h: 0.08 } },
      { id: 'NETQTY_PRESENT', label: 'Net Quantity', statute: 'LMPC Rules 2011 — Rule 6(1)(d)', message: 'Net Weight: 120 g', guidance: 'Standard unit', severity: 'critical', passed: true, value: '120 g', box: { x: 0.15, y: 0.35, w: 0.5, h: 0.06 } },
      { id: 'MFG_DATE_PRESENT', label: 'Manufacturing Date', statute: 'LMPC Rules 2011 — Rule 6(1)(e)', message: 'Mfg: 04/2026', guidance: 'Valid format', severity: 'critical', passed: true, value: '04/2026' },
      { id: 'FSSAI_LICENCE_PRESENT', label: 'FSSAI Licence', statute: 'FSSAI Regulations 2020', message: 'Lic. No. 10015043000888', guidance: '14-digit verified', severity: 'critical', passed: true, value: '10015043000888' },
    ],
    quality: { sharpness: 3200, glare: 0.04, luma: 172, contrast: 48, pass: true, reasons: [] },
  },
  {
    id: 'CMP-1003-7182',
    createdAt: '2026-05-08T18:11:00.000Z',
    productName: 'Bikano Aloo Bhujia',
    verdict: 'PASS',
    grade: 'A',
    score: 95,
    expired: false,
    imageDataUrl: '',
    place: 'Gurgaon, Haryana',
    barcode: '8901725181211',
    reader: 'gemini',
    synced: true,
    findings: [
      { id: 'MRP_PRESENT', label: 'Maximum Retail Price', statute: 'LMPC Rules 2011 — Rule 6(1)(g)', message: 'MRP ₹50.00 (incl. of all taxes)', guidance: 'Compliant', severity: 'critical', passed: true, value: '₹50.00 (incl. of all taxes)' },
      { id: 'NETQTY_PRESENT', label: 'Net Quantity', statute: 'LMPC Rules 2011 — Rule 6(1)(d)', message: 'Net Weight: 200 g', guidance: 'Standard unit', severity: 'critical', passed: true, value: '200 g' },
      { id: 'MFG_DATE_PRESENT', label: 'Manufacturing Date', statute: 'LMPC Rules 2011 — Rule 6(1)(e)', message: 'Mfg: 03/2026', guidance: 'Valid', severity: 'critical', passed: true, value: '03/2026' },
      { id: 'EXPIRY_PRESENT', label: 'Best Before', statute: 'FSSAI Labelling Regulations', message: 'Best Before 6 Months from Mfg', guidance: 'Unexpired', severity: 'major', passed: true, value: '09/2026' },
      { id: 'FSSAI_LICENCE_PRESENT', label: 'FSSAI Licence', statute: 'FSSAI Regulations 2020', message: 'Lic. No. 10014011000210', guidance: 'Verified', severity: 'critical', passed: true, value: '10014011000210' },
      { id: 'MANUFACTURER_PRESENT', label: 'Manufacturer Details', statute: 'LMPC Rules 2011 — Rule 6(1)(a)', message: 'Bikanervala Foods Pvt Ltd, Rai, Sonipat', guidance: 'Valid', severity: 'critical', passed: true, value: 'Bikanervala Foods Pvt Ltd' },
      { id: 'CUSTOMER_CARE_PRESENT', label: 'Consumer Care', statute: 'LMPC Rules 2011 — Rule 6(1)(j)', message: '1800 102 7788 / care@bikano.com', guidance: 'Valid', severity: 'major', passed: true, value: '1800 102 7788' },
      { id: 'VEG_SYMBOL_PRESENT', label: 'Veg Symbol', statute: 'FSSAI Labelling Regulations', message: 'Veg symbol verified', guidance: 'Present', severity: 'major', passed: true, value: 'Veg mark' },
    ],
    quality: { sharpness: 4100, glare: 0.01, luma: 190, contrast: 60, pass: true, reasons: [] },
  },
  {
    id: 'CMP-1002-6120',
    createdAt: '2026-05-05T14:15:00.000Z',
    productName: 'Fortune Oil',
    verdict: 'VIOLATION',
    grade: 'C',
    score: 52,
    expired: false,
    imageDataUrl: '',
    place: 'Delhi, India',
    barcode: '8906007281001',
    reader: 'gemini',
    synced: true,
    findings: [
      { id: 'MRP_INCLUSIVE_OF_TAXES', label: 'MRP Declaration', statute: 'LMPC Rules 2011 — Rule 6', message: 'MRP missing tax inclusion statement', guidance: 'LMPC Rule 6 requires explicit tax mention', severity: 'critical', passed: false, value: 'MRP 165' },
      { id: 'NETQTY_PRESENT', label: 'Net Quantity', statute: 'LMPC Rules 2011 — Rule 6(1)(d)', message: 'Net Qty: 1 L', guidance: 'Valid', severity: 'critical', passed: true, value: '1 L' },
    ],
    quality: { sharpness: 3000, glare: 0.03, luma: 180, contrast: 50, pass: true, reasons: [] },
  },
  {
    id: 'CMP-1001-5099',
    createdAt: '2026-05-03T16:40:00.000Z',
    productName: 'Nestle Maggi',
    verdict: 'VIOLATION',
    grade: 'C',
    score: 48,
    expired: false,
    imageDataUrl: '',
    place: 'Delhi, India',
    barcode: '8901058852391',
    reader: 'gemini',
    synced: true,
    findings: [
      { id: 'CUSTOMER_CARE_PRESENT', label: 'Customer Care Details', statute: 'LMPC Rules 2011 — Rule 6(1)(j)', message: 'Customer grievance email missing', guidance: 'Rule 6(1)(j)', severity: 'major', passed: false, value: null },
      { id: 'MRP_PRESENT', label: 'Maximum Retail Price', statute: 'LMPC Rules 2011 — Rule 6(1)(g)', message: 'MRP ₹14.00 incl. taxes', guidance: 'Valid', severity: 'critical', passed: true, value: '₹14.00' },
    ],
    quality: { sharpness: 3400, glare: 0.02, luma: 185, contrast: 52, pass: true, reasons: [] },
  },
]

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
      role: 'consumer',
      user: { name: 'Anah Sharma', email: 'anah.sharma@example.com', provider: 'google' },
      lang: 'en',
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      voice: true,
      scans: DEFAULT_SCANS,
      lastScanId: 'CMP-1005-8403',
      setRole: (role) => set({ role }),
      setUser: (user) => set({ user }),
      setLang: (lang) => {
        set({ lang })
        setLanguage(lang)
      },
      setVoice: (voice) => set({ voice }),
      addScan: (s) => {
        set((st) => ({ scans: [s, ...st.scans].slice(0, 60), lastScanId: s.id }))
        queueScan(s, rulesMeta.version)
      },
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
