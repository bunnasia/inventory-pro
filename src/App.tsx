import { useCallback, useEffect, useRef, useState } from "react"

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

  // Stable ref so callbacks never go stale when appState changes
  const appStateRef = useRef(appState)
  useEffect(() => { appStateRef.current = appState })

  const strings = t(lang)

  useEffect(() => {
    getAllScans().then(setScans).catch(console.error)
  }, [])

  const handleScan = useCallback((barcode: string) => {
    setAppState({ phase: "listening", barcode })
  }, [])

  async function commitScan(barcode: string, quantity: number) {
    try {
      const entry = await addScan({ barcode, quantity, note: "", timestamp: Date.now() })
      setScans((prev) => [entry, ...prev])
    } catch (err) {
      console.error("Failed to save scan:", err)
    }
  }

  // Stable callback — reads state from ref to avoid restarting VoiceCapture on every render
  const handleVoiceResult = useCallback((result: VoiceResult) => {
    const state = appStateRef.current
    if (state.phase !== "listening") return
    const { barcode } = state

    if (result.status === "ok") {
      setAppState({ phase: "confirming", barcode, quantity: result.quantity })
      void commitScan(barcode, result.quantity)
      return
    }

    // Timeout / error / unsupported — show toast at 0 so user can type manually
    setAppState({ phase: "confirming", barcode, quantity: 0 })
  }, []) // intentionally empty — uses appStateRef

  const handleToastEdit = useCallback(async (qty: number) => {
    const state = appStateRef.current
    if (state.phase !== "confirming") return
    const { barcode, quantity: prevQty } = state

    setAppState({ phase: "confirming", barcode, quantity: qty })

    setScans((prev) => {
      const existing = prev.find((s) => s.barcode === barcode && !s.synced)
      if (existing) {
        void updateScan(existing.id, { quantity: qty })
        return prev.map((s) => (s.id === existing.id ? { ...s, quantity: qty } : s))
      }
      return prev
    })

    // If previous qty was 0 (voice failed / manual entry), create the scan now
    if (prevQty === 0 && qty > 0) {
      await commitScan(barcode, qty)
    }
  }, [])

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
        <p className="text-xs text-slate-500 text-center">{strings.appTagline}</p>

        <ScanField
          lang={lang}
          onScan={handleScan}
          disabled={appState.phase === "listening"}
        />

        <VoiceCapture
          lang={lang}
          active={appState.phase === "listening"}
          onResult={handleVoiceResult}
        />

        {appState.phase === "confirming" && appState.quantity === 0 && (
          <div className="bg-amber-900/30 border border-amber-500/40 rounded-xl p-4 text-sm text-amber-300">
            Voice did not capture a number — tap <strong>Edit</strong> on the toast below to enter the quantity manually.
          </div>
        )}

        {appState.phase === "idle" && scans.length === 0 && (
          <div className="text-center text-xs text-slate-600 select-none pt-2">
            {strings.micPermission}
          </div>
        )}

        <InventoryList
          scans={scans}
          lang={lang}
          onDelete={handleDelete}
          onClear={handleClear}
        />
      </main>

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
