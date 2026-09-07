import { Link } from "react-router-dom";

export default function OfficerPortal() {
  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-brand">CheckMyPack — Officer Command Center</h1>
          <Link to="/app" className="text-sm font-semibold text-brand-mid underline">
            Open mobile app →
          </Link>
        </div>
        <p className="text-ink/60 mt-2">
          Wide-screen web portal: violation heat-map, repeat-offender registry, analytics and
          exports. Built on the same database as the mobile app. (Arrives in a later phase.)
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { t: "Violation heat-map", d: "Area-wise map of non-compliant scans (OpenStreetMap).", e: "🗺️" },
            { t: "Repeat-offender registry", d: "Brands/stores flagged multiple times, with evidence.", e: "📚" },
            { t: "Analytics", d: "Scans vs violations, top-broken rules, trends over time.", e: "📊" }
          ].map((c) => (
            <div key={c.t} className="bg-white rounded-2xl shadow-card p-5">
              <div className="text-3xl">{c.e}</div>
              <div className="font-bold text-brand mt-2">{c.t}</div>
              <div className="text-sm text-ink/60 mt-1">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
