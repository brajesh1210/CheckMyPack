import { FileText, Repeat, Scale, MapPinned, Download, ChevronRight } from 'lucide-react'
import { Screen, ScrollArea, AppBar, SectionHeader } from '../components/UI'
import BottomNav from '../components/BottomNav'

const reports = [
  { icon: FileText, title: 'Monthly compliance summary', meta: 'August 2026 · 1,204 inspections' },
  { icon: Repeat, title: 'Repeat-offender registry', meta: '37 brands flagged three or more times' },
  { icon: Scale, title: 'Pan-masala RSP audit', meta: 'GSR 881(E) small packs · 212 scans' },
  { icon: MapPinned, title: 'District-wise violations', meta: 'Delhi NCR breakdown' },
]

export default function OfficerReports() {
  return (
    <Screen>
      <AppBar title="Reports" subtitle="Export and share enforcement data" />

      <ScrollArea className="gutter pb-6">
        <div className="pt-4">
          <SectionHeader title="Standard reports" />
          <ul className="card divide-y divide-ink-200 overflow-hidden">
            {reports.map(({ icon: Icon, title, meta }) => (
              <li key={title}>
                <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600">
                    <Icon size={17} strokeWidth={1.9} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-md font-medium text-ink-900">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">{meta}</span>
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-ink-300" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-7">
          <SectionHeader title="Export" />
          <div className="card p-4">
            <p className="text-sm leading-relaxed text-ink-600">
              Download the full case register as a spreadsheet for filing with the state Legal
              Metrology office.
            </p>
            <button type="button" className="btn-secondary btn-block mt-4">
              <Download size={17} strokeWidth={2} aria-hidden />
              Export CSV
            </button>
          </div>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
