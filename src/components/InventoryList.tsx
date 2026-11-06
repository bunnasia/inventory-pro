import { type ScanEntry, exportCsv } from "@/lib/storage"
import { type Language, t } from "@/i18n"

interface InventoryListProps {
  scans: ScanEntry[]
  lang: Language
  onDelete: (id: string) => void
  onClear: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function downloadCsv(scans: ScanEntry[]) {
  const csv = exportCsv(scans)
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function InventoryList({ scans, lang, onDelete, onClear }: InventoryListProps) {
  const strings = t(lang)

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{strings.skuLabel}</span>
          <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-medium">
            {scans.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCsv(scans)}
            disabled={scans.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {strings.exportButton}
          </button>
          <button
            onClick={onClear}
            disabled={scans.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {strings.clearButton}
          </button>
        </div>
      </div>

      {/* Table */}
      {scans.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-slate-500 text-sm">{strings.noScans}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700">
                <th className="text-left px-4 py-2 font-medium">{strings.skuLabel}</th>
                <th className="text-right px-4 py-2 font-medium">{strings.qtyLabel}</th>
                <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">{strings.timeLabel}</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan, i) => (
                <tr
                  key={scan.id}
                  className={[
                    "border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors",
                    i === 0 ? "bg-sky-500/5" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-2.5 font-mono text-slate-200 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-xs">
                    {scan.barcode}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-bold text-sky-400 text-base">{scan.quantity}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-500 text-xs hidden sm:table-cell">
                    {formatTime(scan.timestamp)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => onDelete(scan.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors text-base leading-none"
                      aria-label="Delete"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
