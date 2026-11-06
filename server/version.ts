import fs from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

export function appVersion(): string {
  try {
    const pkg = require("../package.json") as { version?: string }
    return typeof pkg.version === "string" ? pkg.version : "0.0.0"
  } catch {
    try {
      const raw = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
      const parsed = JSON.parse(raw) as { version?: string }
      return typeof parsed.version === "string" ? parsed.version : "0.0.0"
    } catch {
      return "0.0.0"
    }
  }
}
