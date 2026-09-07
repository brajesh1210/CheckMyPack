import { useTranslation } from "react-i18next";

export default function HistoryTab() {
  const { t } = useTranslation();
  return (
    <div className="px-5 py-6">
      <h2 className="text-2xl font-extrabold text-ink">{t("nav.history")}</h2>
      <div className="mt-6 text-center text-ink/45 py-16">
        <div className="text-5xl mb-3">🕘</div>
        <p className="font-semibold">No scans yet</p>
        <p className="text-sm mt-1">Your scanned packets and reports will appear here.</p>
      </div>
    </div>
  );
}
