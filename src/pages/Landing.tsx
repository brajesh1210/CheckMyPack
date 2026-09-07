import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="landing-shell">
      <div className="mx-auto max-w-[480px] px-5 pt-10 pb-16">
        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-6">
          <img src={logo} alt="CheckMyPack" className="w-28 h-28 rounded-[1.6rem] shadow-soft" />
          <h1 className="mt-4 text-3xl font-extrabold text-brand tracking-tight">CheckMyPack</h1>
          <p className="mt-1 text-brand-mid font-semibold">{t("app.tagline")}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70 max-w-sm">{t("landing.heroSub")}</p>

          <a href="#install" className="btn-primary mt-7 flex items-center justify-center gap-2">
            <span className="text-2xl leading-none">⬇</span> {t("landing.install")}
          </a>
          <p className="mt-2 text-xs text-ink/50">{t("landing.installHint")}</p>

          <Link to="/app" className="mt-3 text-brand font-semibold underline underline-offset-4">
            {t("landing.openApp")} →
          </Link>
        </div>

        {/* How it works */}
        <h2 className="mt-12 text-xl font-bold text-brand">{t("landing.howTitle")}</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { n: "1", t: t("landing.step1"), d: t("landing.step1d"), e: "📷" },
            { n: "2", t: t("landing.step2"), d: t("landing.step2d"), e: "⚖️" },
            { n: "3", t: t("landing.step3"), d: t("landing.step3d"), e: "✅" }
          ].map((s) => (
            <div key={s.n} className="card flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                {s.n}
              </div>
              <div className="text-2xl mt-2">{s.e}</div>
              <div className="font-semibold text-brand mt-1 text-sm">{s.t}</div>
              <div className="text-xs text-ink/60 mt-1 leading-snug">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <h2 className="mt-12 text-xl font-bold text-brand">{t("landing.featTitle")}</h2>
        <ul className="mt-4 space-y-2.5">
          {["f1", "f2", "f3", "f4", "f5"].map((k) => (
            <li key={k} className="card flex items-start gap-3 py-3">
              <span className="text-mint text-xl leading-none mt-0.5">✓</span>
              <span className="text-[15px] text-ink/80">{t(`landing.${k}`)}</span>
            </li>
          ))}
        </ul>

        {/* Legal */}
        <div id="install" className="mt-12 card bg-brand-light border border-brand/10">
          <div className="font-bold text-brand flex items-center gap-2">⚖️ {t("landing.legalTitle")}</div>
          <p className="mt-2 text-sm text-ink/70 leading-relaxed">{t("landing.legal")}</p>
          <Link to="/app" className="btn-primary mt-5 block text-center">{t("landing.install")}</Link>
          <p className="mt-2 text-center text-xs text-ink/50">{t("landing.installHint")}</p>
        </div>

        <div className="mt-10 text-center">
          <Link to="/officer" className="text-sm font-semibold text-brand-mid underline underline-offset-4">
            {t("landing.officerLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
