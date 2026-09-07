import { useTranslation } from "react-i18next";
import { useApp } from "../store/app";
import logo from "../assets/logo.png";

export default function Auth() {
  const { t } = useTranslation();
  const setUser = useApp((s) => s.setUser);

  // Guest path always works (demo-safe). Google path will wire to Supabase later;
  // for now it signs in locally so the full flow is testable.
  const guest = () => setUser({ name: "Guest", email: "", provider: "guest" });
  const google = () => setUser({ name: "Google User", email: "user@gmail.com", provider: "google" });

  return (
    <div className="app-shell flex flex-col items-center justify-center px-7 text-center">
      <img src={logo} alt="CheckMyPack" className="w-24 h-24 rounded-[1.4rem] shadow-soft" />
      <h1 className="mt-5 text-2xl font-extrabold text-brand">CheckMyPack</h1>
      <p className="mt-1 text-sm text-ink/60 max-w-xs">{t("auth.note")}</p>

      <div className="w-full mt-10 space-y-3">
        <button
          onClick={google}
          className="btn bg-white border border-slate-300 text-ink flex items-center justify-center gap-3 shadow-card"
        >
          <GoogleIcon /> {t("auth.google")}
        </button>
        <button onClick={guest} className="btn-ghost">
          {t("auth.guest")}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.9 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.6C41.4 36.4 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
