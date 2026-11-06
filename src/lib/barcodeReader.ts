/**
 * HID barcode scanner detector.
 *
 * USB and Bluetooth barcode scanners present to the OS as HID keyboard devices.
 * They type the barcode string very rapidly (< 50 ms between characters) and
 * terminate the sequence with an Enter keypress.
 *
 * This module distinguishes scanner input from manual typing by measuring the
 * inter-keystroke interval. Manual typists rarely exceed 10 characters per
 * second (~100 ms/char); scanners typically fire 20–30 characters in < 100 ms
 * total.
 */

const INTER_KEY_THRESHOLD_MS = 50
const MIN_BARCODE_LENGTH = 3

type ScanCallback = (barcode: string) => void

interface BarcodeReaderOptions {
  onScan: ScanCallback
  /** Elements where scanner input should be intercepted (default: document) */
  target?: EventTarget
}

export class BarcodeReader {
  private buffer = ""
  private lastKeyTime = 0
  private readonly onScan: ScanCallback
  private readonly target: EventTarget
  private readonly handler: (e: Event) => void

  constructor({ onScan, target }: BarcodeReaderOptions) {
    this.onScan = onScan
    this.target = target ?? document
    this.handler = (e: Event) => this.handleKey(e as KeyboardEvent)
  }

  start() {
    this.target.addEventListener("keydown", this.handler)
  }

  stop() {
    this.target.removeEventListener("keydown", this.handler)
    this.buffer = ""
  }

  private handleKey(e: KeyboardEvent) {
    const now = Date.now()
    const elapsed = now - this.lastKeyTime
    this.lastKeyTime = now

    if (e.key === "Enter") {
      const candidate = this.buffer.trim()
      this.buffer = ""
      if (candidate.length >= MIN_BARCODE_LENGTH && this.looksLikeBarcode(candidate)) {
        e.preventDefault()
        this.onScan(candidate)
      }
      return
    }

    if (e.key === "Escape") {
      this.buffer = ""
      return
    }

    // If elapsed time since last key is too long, this is manual typing → reset
    if (this.buffer.length > 0 && elapsed > INTER_KEY_THRESHOLD_MS) {
      this.buffer = ""
    }

    // Only accumulate printable single characters
    if (e.key.length === 1) {
      this.buffer += e.key
    }
  }

  /**
   * A barcode looks like alphanumeric with optional hyphens/dots.
   * Reject pure whitespace or strings that are clearly sentence fragments.
   */
  private looksLikeBarcode(value: string): boolean {
    return /^[\dA-Za-z\-_.]{3,}$/.test(value)
  }
}

/** Convenience hook-style factory that returns a cleanup function */
export function listenForScans(onScan: ScanCallback): () => void {
  const reader = new BarcodeReader({ onScan })
  reader.start()
  return () => reader.stop()
}
