import { useEffect, useRef, useState } from "react"
import { listenForScans } from "@/lib/barcodeReader"
import { type Language, t } from "@/i18n"

interface ScanFieldProps {
  lang: Language
  onScan: (barcode: string) => void
  disabled?: boolean
}

export function ScanField({ lang, onScan, disabled = false }: ScanFieldProps) {
  const strings = t(lang)
  const [manualValue, setManualValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // HID barcode scanner listener (global)
  useEffect(() => {
    if (disabled) return
    const cleanup = listenForScans((barcode) => {
      onScan(barcode)
    })
    return cleanup
  }, [disabled, onScan])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = manualValue.trim()
    if (val) {
      onScan(val)
      setManualValue("")
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-sm text-slate-400 mb-3 font-medium">{strings.scanAndSpeak}</p>

      {/* Scanner visual indicator */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-900 border border-slate-600">
        <div className={["w-3 h-3 rounded-full", disabled ? "bg-slate-600" : "bg-green-400 animate-pulse"].join(" ")} />
        <span className="text-sm text-slate-300">
          {disabled ? "Scanner paused" : strings.scanPrompt}
        </span>
      </div>

      {/* Manual entry fallback */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder={strings.barcodeLabel}
          disabled={disabled}
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !manualValue.trim()}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {strings.save}
        </button>
      </form>
    </div>
  )
}
