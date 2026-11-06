import { useCallback, useEffect, useRef, useState } from "react"
import { type Language, speechLangCode, t } from "@/i18n"
import { parseSpokenQuantity } from "@/lib/voiceParser"

const LISTEN_DURATION_MS = 5000

export type VoiceResult =
  | { status: "ok"; quantity: number; raw: string }
  | { status: "timeout" }
  | { status: "error"; message: string }
  | { status: "unsupported" }

interface VoiceCaptureProps {
  lang: Language
  active: boolean
  onResult: (result: VoiceResult) => void
}

// Web Speech API is not in the standard TS DOM lib; declare the minimum needed.
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as unknown as Record<string, unknown>
  const Ctor = (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as SpeechRecognitionConstructor | undefined
  return Ctor ?? null
}

export function VoiceCapture({ lang, active, onResult }: VoiceCaptureProps) {
  const strings = t(lang)
  const [countdown, setCountdown] = useState(0)
  const [status, setStatus] = useState<"idle" | "listening">("idle")
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultFiredRef = useRef(false)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    recognitionRef.current?.stop()
    setCountdown(0)
    setStatus("idle")
  }, [])

  const startListening = useCallback(() => {
    const SpeechRec = getSpeechRecognition()
    if (!SpeechRec) {
      onResult({ status: "unsupported" })
      return
    }

    resultFiredRef.current = false
    setStatus("listening")
    setCountdown(5)

    const rec = new SpeechRec()
    rec.lang = speechLangCode(lang)
    rec.interimResults = false
    rec.maxAlternatives = 3
    rec.continuous = false
    recognitionRef.current = rec

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (resultFiredRef.current) return
      resultFiredRef.current = true

      const result = event.results[0]
      const alternatives = Array.from({ length: result.length }, (_, i) => result[i].transcript)

      for (const alt of alternatives) {
        const parsed = parseSpokenQuantity(alt, lang)
        if (parsed) {
          stopAll()
          onResult({ status: "ok", quantity: parsed.value, raw: parsed.raw })
          return
        }
      }

      stopAll()
      onResult({ status: "timeout" })
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (resultFiredRef.current) return
      resultFiredRef.current = true
      stopAll()
      onResult({ status: "error", message: event.error })
    }

    rec.onend = () => {
      if (resultFiredRef.current) return
      resultFiredRef.current = true
      stopAll()
      onResult({ status: "timeout" })
    }

    rec.start()

    timerRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)

    timeoutRef.current = setTimeout(() => {
      if (!resultFiredRef.current) {
        resultFiredRef.current = true
        stopAll()
        onResult({ status: "timeout" })
      }
    }, LISTEN_DURATION_MS)
  }, [lang, onResult, stopAll])

  useEffect(() => {
    if (active) {
      startListening()
    } else {
      stopAll()
    }
    return stopAll
  }, [active, startListening, stopAll])

  if (!active && status === "idle") return null

  return (
    <div className="bg-slate-800 border border-sky-500/40 rounded-xl p-4 mt-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.93V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-1.07A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z" />
            </svg>
          </div>
          {countdown > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold">
              {countdown}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-sky-300">{strings.voiceListening}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {countdown > 0 ? `${countdown}s remaining` : strings.voiceTimeout}
          </p>
        </div>
      </div>
    </div>
  )
}
