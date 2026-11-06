import fs from "node:fs"
import http from "node:http"
import path from "node:path"

import { appVersion } from "./version.ts"

const port = Number(process.env.PORT) || 43200
const distDir = path.resolve("dist")

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
}

function serveStatic(pathname: string, response: http.ServerResponse): boolean {
  const safePath = pathname.includes("..") ? null : path.join(distDir, pathname)
  if (!safePath) return false
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath)
    const mime = mimeTypes[ext] ?? "application/octet-stream"
    const content = fs.readFileSync(safePath)
    const isAsset = pathname.startsWith("/assets/")
    response.writeHead(200, {
      "content-type": mime,
      "cache-control": isAsset ? "public, max-age=31536000, immutable" : "no-cache",
    })
    response.end(content)
    return true
  }
  return false
}

function serveIndex(response: http.ServerResponse) {
  const indexPath = path.join(distDir, "index.html")
  if (fs.existsSync(indexPath)) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" })
    response.end(fs.readFileSync(indexPath))
  } else {
    response.writeHead(503, { "content-type": "text/plain" })
    response.end("Build not found. Run npm run build first.")
  }
}

function json(response: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  response.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) })
  response.end(payload)
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost")
  const pathname = url.pathname

  if (pathname === "/health") {
    json(response, 200, { ok: true, name: "inventory-pro", version: appVersion() })
    return
  }

  if (pathname === "/api/version" && request.method === "GET") {
    json(response, 200, { version: appVersion() })
    return
  }

  if (request.method === "GET" || request.method === "HEAD") {
    if (serveStatic(pathname, response)) return
    serveIndex(response)
    return
  }

  json(response, 404, { error: "Not found" })
})

server.listen(port, () => {
  console.log(`Inventory Pro v${appVersion()} — http://localhost:${port}`)
})
