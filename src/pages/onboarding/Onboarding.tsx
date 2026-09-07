import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../store/app";

export default function Onboarding() {
  const { t } = useTranslation();
  const setOnboarded = useApp((s) => s.setOnboarded);
  const [i, setI] = useState(0);

  const pages = [
    { e: "🛡️", title: t("onboard.s1t"), body: t("onboard.s1d") },
    { e: "🔍", title: t("onboard.s2t"), body: t("onboard.s2d") },
    { e: "📷", title: t("onboard.s3t"), body: t("onboard.s3d") },
    { e: "🤝", title: t("onboard.s4t"), body: t("onboard.s4d") },
    { e: "📶", title: t("onboard.s5t"), body: t("onboard.s5d") }
  ];
  const last = i === pages.length - 1;

  return (
    <div className="app-shell flex flex-col px-6 pt-6 pb-8">
      <button
        onClick={setOnboarded}
        className="self-end text-sm font-semibold text-ink/50"
      >
        {t("onboard.skip")}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-7xl mb-6">{pages[i].e}</div>
        <h2 className="text-2xl font-extrabold text-brand">{pages[i].title}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-ink/70 max-w-xs">{pages[i].body}</p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {pages.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-brand" : "w-2 bg-brand/25"
            }`}
          />
        ))}
      </div>

      {last ? (
        <button onClick={setOnboarded} className="btn-primary">
          {t("onboard.s5b")}
        </button>
      ) : (
        <button onClick={() => setI(i + 1)} className="btn-primary">
          {t("onboard.next")}
        </button>
      )}
    </div>
  );
}
