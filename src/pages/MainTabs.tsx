import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../store/app";
import HomeTab from "./tabs/HomeTab";
import HistoryTab from "./tabs/HistoryTab";
import ComplaintTab from "./tabs/ComplaintTab";
import ProfileTab from "./tabs/ProfileTab";
import logo from "../assets/logo.png";

type Tab = "home" | "history" | "complaint" | "profile";

export default function MainTabs() {
  const { t } = useTranslation();
  const officer = useApp((s) => s.officerMode);
  const [tab, setTab] = useState<Tab>("home");

  const tabs: { id: Tab; icon: string; label: string }[] = officer
    ? [
        { id: "home", icon: "📷", label: "Scan" },
        { id: "history", icon: "🗺️", label: "Area" },
        { id: "complaint", icon: "📊", label: "Stats" },
        { id: "profile", icon: "👤", label: "Profile" }
      ]
    : [
        { id: "home", icon: "📷", label: t("nav.home") },
        { id: "history", icon: "🕘", label: t("nav.history") },
        { id: "complaint", icon: "📞", label: t("nav.complaint") },
        { id: "profile", icon: "👤", label: t("nav.profile") }
      ];

  return (
    <div className="app-shell flex flex-col">
      <header className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-slate-100">
        <img src={logo} alt="" className="w-9 h-9 rounded-xl" />
        <div className="leading-tight">
          <div className="font-extrabold text-brand">CheckMyPack</div>
          <div className="text-[11px] text-ink/50">
            {officer ? "Officer Mode" : "LMPC 2011 + FSSAI"}
          </div>
        </div>
        <OnlineBadge />
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === "home" && <HomeTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "complaint" && <ComplaintTab />}
        {tab === "profile" && <ProfileTab />}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-4 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              tab === x.id ? "text-brand" : "text-ink/45"
            }`}
          >
            <span className="text-xl leading-none">{x.icon}</span>
            {x.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function OnlineBadge() {
  const online = useApp((s) => s.online);
  const { t } = useTranslation();
  return (
    <span
      className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        online ? "bg-brand-light text-brand" : "bg-amber/15 text-amber"
      }`}
    >
      {online ? `● ${t("home.online")}` : `● ${t("home.offline")}`}
    </span>
  );
}
