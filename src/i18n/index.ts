export type Language = "en" | "th" | "lo"

export const LANGUAGES: { code: Language; label: string; speechLang: string }[] = [
  { code: "en", label: "English", speechLang: "en-US" },
  { code: "th", label: "ไทย", speechLang: "th-TH" },
  { code: "lo", label: "ລາວ", speechLang: "lo-LA" },
]

export function savedLanguage(): Language {
  if (typeof localStorage === "undefined") return "en"
  const saved = localStorage.getItem("inventory-pro-language")
  if (saved === "th" || saved === "lo") return saved
  return "en"
}

export function saveLanguage(lang: Language) {
  localStorage.setItem("inventory-pro-language", lang)
}

export function speechLangCode(lang: Language): string {
  return LANGUAGES.find((l) => l.code === lang)?.speechLang ?? "en-US"
}

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------

type Strings = {
  appTagline: string
  scanPrompt: string
  voiceListening: string
  voiceTimeout: string
  voiceResult: string
  voiceError: string
  confirmQty: string
  itemsRecorded: string
  syncButton: string
  exportButton: string
  clearButton: string
  skuLabel: string
  qtyLabel: string
  timeLabel: string
  noScans: string
  barcodeLabel: string
  manualQty: string
  save: string
  cancel: string
  settings: string
  language: string
  micPermission: string
  unsupported: string
  scanAndSpeak: string
}

const en: Strings = {
  appTagline: "Voice & Barcode Stocktaker",
  scanPrompt: "Scan a barcode or type a SKU",
  voiceListening: "Listening… speak the quantity",
  voiceTimeout: "No voice detected — tap to enter manually",
  voiceResult: "Heard:",
  voiceError: "Could not capture voice — enter manually",
  confirmQty: "Confirm quantity",
  itemsRecorded: "items recorded",
  syncButton: "Sync",
  exportButton: "Export CSV",
  clearButton: "Clear session",
  skuLabel: "SKU / Barcode",
  qtyLabel: "Qty",
  timeLabel: "Time",
  noScans: "No scans yet — scan a barcode to begin",
  barcodeLabel: "Barcode",
  manualQty: "Enter quantity",
  save: "Save",
  cancel: "Cancel",
  settings: "Settings",
  language: "Language",
  micPermission: "Microphone permission required for voice input",
  unsupported: "Voice input not supported in this browser",
  scanAndSpeak: "Scan, then speak the quantity",
}

const th: Strings = {
  appTagline: "ระบบนับสต็อกด้วยเสียงและบาร์โค้ด",
  scanPrompt: "สแกนบาร์โค้ดหรือพิมพ์ SKU",
  voiceListening: "กำลังฟัง… พูดจำนวน",
  voiceTimeout: "ไม่ได้ยินเสียง — แตะเพื่อกรอกเอง",
  voiceResult: "ได้ยิน:",
  voiceError: "ไม่สามารถรับเสียงได้ — กรอกเอง",
  confirmQty: "ยืนยันจำนวน",
  itemsRecorded: "รายการที่บันทึก",
  syncButton: "ซิงก์",
  exportButton: "ส่งออก CSV",
  clearButton: "ล้างเซสชัน",
  skuLabel: "SKU / บาร์โค้ด",
  qtyLabel: "จำนวน",
  timeLabel: "เวลา",
  noScans: "ยังไม่มีการสแกน — สแกนบาร์โค้ดเพื่อเริ่ม",
  barcodeLabel: "บาร์โค้ด",
  manualQty: "กรอกจำนวน",
  save: "บันทึก",
  cancel: "ยกเลิก",
  settings: "ตั้งค่า",
  language: "ภาษา",
  micPermission: "ต้องการสิทธิ์ไมโครโฟนสำหรับการป้อนเสียง",
  unsupported: "เบราว์เซอร์นี้ไม่รองรับการป้อนเสียง",
  scanAndSpeak: "สแกน แล้วพูดจำนวน",
}

const lo: Strings = {
  appTagline: "ລະບົບນັບສິນຄ້າດ້ວຍສຽງ ແລະ ບາໂຄດ",
  scanPrompt: "ສະແກນບາໂຄດ ຫຼື ພິມ SKU",
  voiceListening: "ກຳລັງຟັງ… ເວົ້າຈຳນວນ",
  voiceTimeout: "ບໍ່ໄດ້ຍິນສຽງ — ແຕະເພື່ອກຳນົດເອງ",
  voiceResult: "ໄດ້ຍິນ:",
  voiceError: "ບໍ່ສາມາດຮັບສຽງໄດ້ — ກຳນົດເອງ",
  confirmQty: "ຢືນຢັນຈຳນວນ",
  itemsRecorded: "ລາຍການທີ່ບັນທຶກ",
  syncButton: "ຊິງ",
  exportButton: "ສົ່ງອອກ CSV",
  clearButton: "ລ້າງຊຸດ",
  skuLabel: "SKU / ບາໂຄດ",
  qtyLabel: "ຈຳນວນ",
  timeLabel: "ເວລາ",
  noScans: "ຍັງບໍ່ມີການສະແກນ — ສະແກນບາໂຄດເພື່ອເລີ່ມ",
  barcodeLabel: "ບາໂຄດ",
  manualQty: "ໃສ່ຈຳນວນ",
  save: "ບັນທຶກ",
  cancel: "ຍົກເລີກ",
  settings: "ຕັ້ງຄ່າ",
  language: "ພາສາ",
  micPermission: "ຕ້ອງການສິດໄມໂຄໂຟນສຳລັບການປ້ອນສຽງ",
  unsupported: "ບຣາວເຊີນີ້ບໍ່ຮອງຮັບການປ້ອນສຽງ",
  scanAndSpeak: "ສະແກນ, ແລ້ວເວົ້າຈຳນວນ",
}

const strings: Record<Language, Strings> = { en, th, lo }

export function t(lang: Language): Strings {
  return strings[lang]
}

// ---------------------------------------------------------------------------
// Spoken-number confirmation phrases
// ---------------------------------------------------------------------------

export function confirmationPhrase(qty: number, lang: Language): string {
  switch (lang) {
    case "th":
      return `บันทึก ${qty} ชิ้น`
    case "lo":
      return `ບັນທຶກ ${qty} ລາຍການ`
    default:
      return `${qty} ${qty === 1 ? "item" : "items"} recorded`
  }
}
