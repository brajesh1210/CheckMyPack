import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = { name: string; email: string; provider: "google" | "guest" } | null;
export type Screen = "onboarding" | "auth" | "app";

interface AppState {
  screen: Screen;
  user: User;
  lang: "en" | "hi";
  online: boolean;
  officerMode: boolean;
  onboarded: boolean;
  setScreen: (s: Screen) => void;
  setUser: (u: User) => void;
  setLang: (l: "en" | "hi") => void;
  toggleOfficer: () => void;
  setOnboarded: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      screen: "onboarding",
      user: null,
      lang: (typeof localStorage !== "undefined" && localStorage.getItem("cmp_lang") === "hi" ? "hi" : "en"),
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      officerMode: false,
      onboarded: false,
      setScreen: (screen) => set({ screen }),
      setUser: (user) => set({ user, screen: "app" }),
      setLang: (lang) => {
        localStorage.setItem("cmp_lang", lang);
        set({ lang });
      },
      toggleOfficer: () => set((s) => ({ officerMode: !s.officerMode })),
      setOnboarded: () => set({ onboarded: true, screen: "auth" })
    }),
    { name: "checkmypack-app" }
  )
);

// Keep online/offline status synced into the store.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => useApp.setState({ online: true }));
  window.addEventListener("offline", () => useApp.setState({ online: false }));
}
