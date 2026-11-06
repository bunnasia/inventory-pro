import { useEffect, useRef, useState } from "react"
import { type Language, confirmationPhrase } from "@/i18n"

interface ConfirmationToastProps {
  quantity: number | null
  barcode: string
  lang: Language
  onDismiss: () => void
  onEdit: (qty: number) => void
}

const DISPLAY_MS = 4000

export function ConfirmationToast({ quantity, barcode, lang, onDismiss, onEdit }: ConfirmationToastProps) {
  const [editMode, setEditMode] = useState(false)
  const [editValue, setEditValue] = useState("")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spokenRef = useRef(false)

  useEffect(() => {
    if (quantity === null) return
    setEditMode(false)
    setEditValue(String(quantity))
    spokenRef.current = false

    // Speak confirmation
    if ("speechSynthesis" in window && !spokenRef.current) {
      spokenRef.current = true
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(confirmationPhrase(quantity, lang))
      utter.lang = lang === "th" ? "th-TH" : lang === "lo" ? "lo-LA" : "en-US"
      utter.rate = 0.95
      window.speechSynthesis.speak(utter)
    }

    // Auto-dismiss
    timeoutRef.current = setTimeout(onDismiss, DISPLAY_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      window.speechSynthesis?.cancel()
    }
  }, [quantity, lang, onDismiss])

  if (quantity === null) return null

  function handleEdit() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setEditMode(true)
  }

  function handleSave() {
    const n = parseInt(editValue, 10)
    if (!isNaN(n) && n >= 0) {
      onEdit(n)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-green-500/50 rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{barcode}</p>
            {editMode ? (
              <div className="flex gap-2 mt-1">
                <input
                  autoFocus
                  type="number"
                  min={0}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded bg-sky-600 text-white text-sm hover:bg-sky-500"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-400">{quantity}</span>
                <span className="text-sm text-slate-400">qty</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {!editMode && (
              <button
                onClick={handleEdit}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
