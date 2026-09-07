import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useApp } from "../../store/app";
import { Link } from "react-router-dom";

export default function ProfileTab() {
  const { t } = useTranslation();
  const { user, lang, setLang, officerMode, toggleOfficer } = useApp();

  const setLanguage = (l: "en" | "hi") => {
    i18n.changeLanguage(l);
    setLang(l);
  };

  return (
    <div className="px-5 py-6 space-y-5">
      <h2 className="text-2xl font-extrabold text-ink">{t("nav.profile")}</h2>

      <div className="card flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold">
          {(user?.name?.[0] ?? "G").toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-ink">{user?.name ?? "Guest"}</div>
          <div className="text-sm text-ink/50">
            {user?.provider === "google" ? user.email : "Signed in as guest"}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="font-semibold text-ink mb-2">{t("common.language")}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`py-2.5 rounded-xl font-semibold ${
              lang === "en" ? "bg-brand text-white" : "bg-brand-light text-brand"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`py-2.5 rounded-xl font-semibold ${
              lang === "hi" ? "bg-brand text-white" : "bg-brand-light text-brand"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Officer mode */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-ink">Officer Mode</div>
            <div className="text-sm text-ink/50">For Legal Metrology officers</div>
          </div>
          <button
            onClick={toggleOfficer}
            className={`w-14 h-8 rounded-full relative transition ${
              officerMode ? "bg-brand" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                officerMode ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
        <Link
          to="/officer"
          className="mt-3 block text-center text-sm font-semibold text-brand-mid underline underline-offset-4"
        >
          {t("landing.officerLink")}
        </Link>
      </div>
    </div>
  );
}
