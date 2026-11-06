import { useCallback, useEffect, useState } from "react"

import { Header } from "@/components/Header"
import { ScanField } from "@/components/ScanField"
import { VoiceCapture, type VoiceResult } from "@/components/VoiceCapture"
import { ConfirmationToast } from "@/components/ConfirmationToast"
import { InventoryList } from "@/components/InventoryList"
import { type Language, savedLanguage, t } from "@/i18n"
import { type ScanEntry, addScan, clearAllScans, deleteScan, getAllScans, updateScan } from "@/lib/storage"

type AppState =
  | { phase: "idle" }
  | { phase: "listening"; barcode: string }
  | { phase: "confirming"; barcode: string; quantity: number }

export default function App() {
  const [lang, setLang] = useState<Language>(savedLanguage)
  const [appState, setAppState] = useState<AppState>({ phase: "idle" })
  const [scans, setScans] = useState<ScanEntry[]>([])

  const strings = t(lang)

  // Load persisted scans on mount
  useEffect(() => {
    getAllScans().then(setScans).catch(console.error)
  }, [])

  const handleScan = useCallback((barcode: string) => {
    setAppState({ phase: "listening", barcode })
  }, [])

  const handleVoiceResult = useCallback(
    (result: VoiceResult) => {
      if (appState.phase !== "listening") return

      if (result.status === "ok") {
        setAppState({ phase: "confirming", barcode: appState.barcode, quantity: result.quantity })
        void commitScan(appState.barcode, result.quantity)
        return
      }

      if (result.status === "unsupported" || result.status === "timeout" || result.status === "error") {
        // Fall through to manual quantity entry — show confirmation with 0 so user can edit
        setAppState({ phase: "confirming", barcode: appState.barcode, quantity: 0 })
        return
      }
    },
    [appState],
  )

  async function commitScan(barcode: string, quantity: number) {
    try {
      const entry = await addScan({ barcode, quantity, note: "", timestamp: Date.now() })
      setScans((prev) => [entry, ...prev])
    } catch (err) {
      console.error("Failed to save scan:", err)
    }
  }

  const handleToastEdit = useCallback(
    async (qty: number) => {
      if (appState.phase !== "confirming") return
      const { barcode } = appState
      setAppState({ phase: "confirming", barcode, quantity: qty })

      // Update or create the scan entry
      setScans((prev) => {
        const existing = prev.find((s) => s.barcode === barcode && !s.synced)
        if (existing) {
          void updateScan(existing.id, { quantity: qty })
          return prev.map((s) => (s.id === existing.id ? { ...s, quantity: qty } : s))
        }
        return prev
      })

      // If quantity was 0 (voice failed), commit a new entry now
      if (appState.quantity === 0 && qty > 0) {
        await commitScan(barcode, qty)
      }
    },
    [appState],
  )

  const handleToastDismiss = useCallback(() => {
    setAppState({ phase: "idle" })
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await deleteScan(id)
    setScans((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleClear = useCallback(async () => {
    if (!window.confirm("Clear all scan records from this session?")) return
    await clearAllScans()
    setScans([])
    setAppState({ phase: "idle" })
  }, [])

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      <Header lang={lang} onLangChange={setLang} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-4">
        {/* Sub-tagline */}
        <p className="text-xs text-slate-500 text-center">{strings.appTagline}</p>

        {/* Scanner input */}
        <ScanField
          lang={lang}
          onScan={handleScan}
          disabled={appState.phase === "listening"}
        />

        {/* Voice capture */}
        <VoiceCapture
          lang={lang}
          active={appState.phase === "listening"}
          onResult={handleVoiceResult}
        />

        {/* Voice error/unsupported notice */}
        {appState.phase === "idle" && (
          <div className="text-center text-xs text-slate-600 select-none">
            {strings.micPermission}
          </div>
        )}

        {/* Inventory list */}
        <InventoryList
          scans={scans}
          lang={lang}
          onDelete={handleDelete}
          onClear={handleClear}
        />
      </main>

      {/* Confirmation toast */}
      {appState.phase === "confirming" && (
        <ConfirmationToast
          quantity={appState.quantity}
          barcode={appState.barcode}
          lang={lang}
          onDismiss={handleToastDismiss}
          onEdit={handleToastEdit}
        />
      )}
    </div>
  )
}
