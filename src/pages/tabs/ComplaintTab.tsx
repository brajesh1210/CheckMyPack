import { useTranslation } from "react-i18next";

export default function ComplaintTab() {
  const { t } = useTranslation();
  return (
    <div className="px-5 py-6">
      <h2 className="text-2xl font-extrabold text-ink">{t("nav.complaint")}</h2>
      <div className="mt-5 card">
        <div className="font-bold text-brand text-lg">National Consumer Helpline</div>
        <div className="text-4xl font-extrabold text-danger mt-2">📞 14404</div>
        <p className="text-sm text-ink/60 mt-2">
          After a scan, you can file a one-tap complaint with the photo, product and location
          pre-filled. This button is enabled on the result screen.
        </p>
        <button
          onClick={() => alert("14404 one-tap complaint is wired in Phase 4 (result screen).")}
          className="btn-primary mt-5"
        >
          File a complaint (demo)
        </button>
      </div>
    </div>
  );
}
