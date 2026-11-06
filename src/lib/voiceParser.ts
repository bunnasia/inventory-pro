/**
 * Multilingual spoken-number parser.
 *
 * Converts a raw speech transcript string into an integer quantity.
 * Supported languages: English (en), Thai (th), Lao (lo).
 *
 * Strategy:
 *   1. Try to extract a plain Arabic digit sequence from the transcript.
 *   2. Try language-specific word-to-number conversion.
 *   3. Return null if nothing parseable is found.
 */

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const EN_ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
}

const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

function parseEnglish(text: string): number | null {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/)
  let total = 0
  let current = 0

  for (const word of words) {
    if (word === "" || word === "and" || word === "a") continue
    if (EN_ONES[word] !== undefined) {
      current += EN_ONES[word]
    } else if (EN_TENS[word] !== undefined) {
      current += EN_TENS[word]
    } else if (word === "hundred") {
      current = current === 0 ? 100 : current * 100
    } else if (word === "thousand") {
      current = current === 0 ? 1000 : current * 1000
      total += current
      current = 0
    } else {
      return null
    }
  }

  total += current
  return total > 0 ? total : null
}

// ---------------------------------------------------------------------------
// Thai
// ---------------------------------------------------------------------------

const TH_ONES: Record<string, number> = {
  ศูนย์: 0, หนึ่ง: 1, เอ็ด: 1, สอง: 2, สาม: 3, สี่: 4, ห้า: 5,
  หก: 6, เจ็ด: 7, แปด: 8, เก้า: 9, สิบ: 10, ยี่: 20,
}

const TH_MAGNITUDE: Record<string, number> = {
  สิบ: 10, ร้อย: 100, พัน: 1000, หมื่น: 10000, แสน: 100000, ล้าน: 1000000,
}

function parseThaiWord(word: string): number | null {
  // Handle compound like "ยี่สิบ" (20), "สิบสอง" (12)
  if (word.startsWith("ยี่สิบ")) {
    const rest = word.slice("ยี่สิบ".length)
    const ones = rest ? (TH_ONES[rest] ?? null) : 0
    return ones !== null ? 20 + ones : null
  }
  if (word.startsWith("สิบ")) {
    const rest = word.slice("สิบ".length)
    const ones = rest ? (TH_ONES[rest] ?? null) : 0
    return ones !== null ? 10 + ones : null
  }
  if (TH_ONES[word] !== undefined) return TH_ONES[word]
  if (TH_MAGNITUDE[word] !== undefined) return TH_MAGNITUDE[word]
  return null
}

function parseThai(text: string): number | null {
  // Try as a single compound word first
  const compound = parseThaiWord(text.trim())
  if (compound !== null) return compound

  // Simple two-token: e.g. "ห้า สิบ" (50), "สอง ร้อย" (200)
  const tokens = text.trim().split(/\s+/)
  if (tokens.length === 2) {
    const left = TH_ONES[tokens[0]] ?? null
    const right = TH_MAGNITUDE[tokens[1]] ?? null
    if (left !== null && right !== null) return left * right
  }
  if (tokens.length === 1) {
    return parseThaiWord(tokens[0])
  }
  return null
}

// ---------------------------------------------------------------------------
// Lao
// ---------------------------------------------------------------------------

const LO_ONES: Record<string, number> = {
  ສູນ: 0, ໜຶ່ງ: 1, ສອງ: 2, ສາມ: 3, ສີ່: 4, ຫ້າ: 5,
  ຫົກ: 6, ເຈັດ: 7, ແປດ: 8, ເກົ້າ: 9, ສິບ: 10,
  // common alternate spellings / phonetic
  nung: 1, song: 2, sam: 3, see: 4, ha: 5,
  hok: 6, chet: 7, paet: 8, kao: 9, sip: 10,
}

const LO_TENS: Record<string, number> = {
  ຊາວ: 20, ສາມສິບ: 30, ສີ່ສິບ: 40, ຫ້າສິບ: 50,
  ຫົກສິບ: 60, ເຈັດສິບ: 70, ແປດສິບ: 80, ເກົ້າສິບ: 90,
  // phonetic romanisation often heard in speech recognition for Lao
  sao: 20, sipsong: 12, yisip: 20,
}

const LO_MAGNITUDE: Record<string, number> = {
  ຮ້ອຍ: 100, ພັນ: 1000, ໝື່ນ: 10000, ແສນ: 100000, ລ້ານ: 1000000,
  roi: 100, phan: 1000,
}

function parseLao(text: string): number | null {
  const clean = text.trim().toLowerCase()

  // Check tens/special words first
  if (LO_TENS[clean] !== undefined) return LO_TENS[clean]

  // Check ones
  if (LO_ONES[clean] !== undefined) return LO_ONES[clean]

  // Handle compound: e.g. "ສິບສອງ" (12)
  for (const [mag, magVal] of Object.entries(LO_MAGNITUDE)) {
    if (clean.endsWith(mag)) {
      const prefix = clean.slice(0, clean.length - mag.length)
      const multiplier = prefix ? (LO_ONES[prefix] ?? LO_TENS[prefix] ?? null) : 1
      if (multiplier !== null) return multiplier * magVal
    }
  }

  // Two token: "ຫ້າ ຮ້ອຍ" (500)
  const tokens = clean.split(/\s+/)
  if (tokens.length === 2) {
    const left = LO_ONES[tokens[0]] ?? LO_TENS[tokens[0]] ?? null
    const right = LO_MAGNITUDE[tokens[1]] ?? null
    if (left !== null && right !== null) return left * right
  }

  return null
}

// ---------------------------------------------------------------------------
// Main exported parser
// ---------------------------------------------------------------------------

export type ParsedQuantity = { value: number; raw: string } | null

export function parseSpokenQuantity(transcript: string, lang: "en" | "th" | "lo"): ParsedQuantity {
  const raw = transcript.trim()
  if (!raw) return null

  // Always try plain digit extraction first (works in any language)
  const digits = raw.replace(/[^0-9]/g, "")
  if (digits.length > 0) {
    const n = parseInt(digits, 10)
    if (!isNaN(n) && n >= 0) return { value: n, raw }
  }

  let value: number | null = null

  if (lang === "en") value = parseEnglish(raw)
  else if (lang === "th") value = parseThai(raw)
  else if (lang === "lo") value = parseLao(raw)

  if (value !== null && value >= 0) return { value, raw }
  return null
}
