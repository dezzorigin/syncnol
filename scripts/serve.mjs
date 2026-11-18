#!/usr/bin/env node
/**
 * Server statis kecil untuk play-test lokal + CI smoke.
 *
 * Menyajikan hasil `vite build` (frontend/dist/) dengan fallback SPA ala
 * Cloudflare Pages: path tanpa file cocok -> index.html (supaya /auth dan
 * /app/dashboard merespons 200 seperti di Pages).
 *
 * Usage: PORT=8333 node scripts/serve.mjs [dir=frontend/dist]
 */
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const PORT = Number(process.env.PORT ?? 8333);
const ROOT = resolve(process.argv[2] ?? "frontend/dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (path.endsWith("/")) path += "index.html";
  let file = join(ROOT, path);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // Fallback SPA: rute client-side (mis. /auth, /app/dashboard).
    file = join(ROOT, "index.html");
  }
  if (!existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found\n");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`));
