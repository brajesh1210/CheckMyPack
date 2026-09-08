import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "consumer" | "officer" | "manufacturer" | null;
export type User = { name: string; email: string; provider: "google" | "gov" | "guest" } | null;

export interface ScanItem {
  label: string;
  value?: string;
  status: "pass" | "fail" | "warn";
  rule?: string;
}
export interface ScanResult {
  id: string;
  product: string;
  image: string;
  state: "PASS" | "VIOLATION" | "RETAKE";
  grade: "A" | "B" | "C";
  date: string;
  place: string;
  items: ScanItem[];
  issues: { title: string; rule: string; detail: string }[];
}

interface AppState {
  onboarded: boolean;
  role: Role;
  user: User;
  lang: "en" | "hi";
  online: boolean;
  scans: ScanResult[];
  lastScan: ScanResult | null;
  setOnboarded: () => void;
  setRole: (r: Role) => void;
  setUser: (u: User) => void;
  setLang: (l: "en" | "hi") => void;
  setLastScan: (s: ScanResult | null) => void;
}

const sampleScans: ScanResult[] = [
  {
    id: "CMP-1005-8403",
    product: "Amul Taaza Milk",
    image: "./img/packet.png",
    state: "PASS",
    grade: "A",
    date: "12 May 2026, 08:21 PM",
    place: "Delhi, India",
    items: [
      { label: "MRP", value: "₹30", status: "pass" },
      { label: "Net Quantity", value: "500 ml", status: "pass" },
      { label: "Manufacturing Date", value: "10/2026", status: "pass" },
      { label: "Best Before", value: "06/2028", status: "pass" },
      { label: "FSSAI Licence", value: "12345678901234", status: "pass" },
      { label: "Manufacturer Details", value: "Amul, Anand", status: "pass" },
      { label: "Consumer Care", value: "1800-xxx", status: "pass" },
      { label: "Veg / Non-Veg Symbol", value: "Veg", status: "pass" }
    ],
    issues: []
  },
  {
    id: "CMP-1006-1120",
    product: "Britannia Sunfeast",
    image: "./img/packet.png",
    state: "VIOLATION",
    grade: "C",
    date: "10 May 2026, 11:31 AM",
    place: "Delhi, India",
    items: [
      { label: "MRP Declaration", status: "fail", rule: "LMPC Rules 2011 - Rule 6" },
      { label: "Consumer Care Details", status: "fail", rule: "LMPC Rules 2011 - Rule 6(1)(j)" },
      { label: "Net Quantity", value: "200 g", status: "pass" },
      { label: "FSSAI Licence", value: "98765432109876", status: "pass" }
    ],
    issues: [
      { title: "MRP declaration", rule: "LMPC Rules 2011 - Rule 6", detail: "The buyer may not declare the retail sale price in the prescribed manner." },
      { title: "Consumer care details", rule: "LMPC Rules 2011 - Rule 6(1)(j)", detail: "A customer-care number or email must be printed on the label." }
    ]
  },
  {
    id: "CMP-1007-5567",
    product: "Bikano Aloo Bhujia",
    image: "./img/packet.png",
    state: "PASS",
    grade: "A",
    date: "08 May 2026, 08:11 PM",
    place: "Delhi, India",
    items: [
      { label: "MRP", value: "₹45", status: "pass" },
      { label: "Net Quantity", value: "200 g", status: "pass" },
      { label: "FSSAI Licence", value: "11223344556677", status: "pass" }
    ],
    issues: []
  }
];

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      role: null,
      user: null,
      lang: "en",
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      scans: sampleScans,
      lastScan: null,
      setOnboarded: () => set({ onboarded: true }),
      setRole: (role) => set({ role }),
      setUser: (user) => set({ user }),
      setLang: (lang) => {
        localStorage.setItem("cmp_lang", lang);
        set({ lang });
      },
      setLastScan: (lastScan) => set({ lastScan })
    }),
    { name: "checkmypack-app" }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("online", () => useApp.setState({ online: true }));
  window.addEventListener("offline", () => useApp.setState({ online: false }));
}
