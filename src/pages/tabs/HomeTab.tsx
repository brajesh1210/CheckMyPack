import { useTranslation } from "react-i18next";
import { useApp } from "../../store/app";

export default function HomeTab() {
  const { t } = useTranslation();
  const online = useApp((s) => s.online);
  const officer = useApp((s) => s.officerMode);

  return (
    <div className="px-5 py-6">
      {!online && (
        <div className="mb-4 rounded-xl bg-amber/15 text-amber-700 text-sm font-semibold px-4 py-2.5 text-center">
          {t("home.offline")}
        </div>
      )}

      <h2 className="text-2xl font-extrabold text-ink">{t("home.title")}</h2>
      <p className="text-ink/55 mt-1">{t("home.subtitle")}</p>

      {/* Hero scan button */}
      <button
        onClick={() => alert("📷 Camera scan arrives in Phase 2 (next build).")}
        className="mt-7 w-full rounded-3xl bg-brand text-white py-9 shadow-soft flex flex-col items-center gap-2 active:scale-[0.99] transition"
      >
        <span className="text-5xl">📷</span>
        <span className="text-2xl font-extrabold">{t("home.scan")}</span>
      </button>

      <button
        onClick={() => alert("🧪 Sample Packs mode arrives in Phase 2.")}
        className="mt-3 w-full rounded-2xl bg-brand-light text-brand font-bold py-4 flex items-center justify-center gap-2"
      >
        🧪 {t("home.sample")}
      </button>
      <p className="mt-1.5 text-center text-xs text-ink/45">{t("home.sampleHint")}</p>

      {officer && (
        <div className="mt-7 card bg-brand-light">
          <div className="font-bold text-brand">Officer Mode</div>
          <p className="text-sm text-ink/60 mt-1">
            Area feed, quick stats and nearby violations will appear here (mobile command view).
          </p>
        </div>
      )}
    </div>
  );
}
