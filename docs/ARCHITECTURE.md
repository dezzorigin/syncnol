# Arsitektur — SyncNol

## Gambaran

```
┌─────────────────────────────┐
│ Browser                     │
│  React 19 + Vite + Tailwind │
│  Zustand · react-router     │
└──────┬──────────────┬───────┘
       │ VITE_API_URL │ VITE_SUPABASE_URL
       ▼              ▼
┌──────────────┐  ┌─────────────────────┐
│ FastAPI      │  │ Supabase            │
│ SQLAlchemy   │  │ Auth + Postgres     │
│ Gemini (AI)  │  │ goals, academy_     │
│ ChromaDB RAG │  │ progress            │
└──────────────┘  └─────────────────────┘
       │ (tanpa keduanya: mode demo lokal)
       ▼
┌──────────────────────────────────────┐
│ localStorage: syncnol-demo-v1,       │
│ syncnol-demo-auth-v1, syncnol-      │
│ vault-v1 — seed + parser J.A.R.V.I.S│
└──────────────────────────────────────┘
```

Diagram visual: [DIAGRAMS.html](DIAGRAMS.html).

## Keputusan arsitektur

### 1. Mode demo sebagai lapisan, bukan fork

Fungsi asli tidak diubah. `src/lib/api.js` adalah facade tunggal:
bila `VITE_API_URL` diset → panggil FastAPI; bila tidak → layani
dari `src/lib/demo.js` (localStorage). `src/supabaseClient.js` sama:
client asli bila env ada, mock bila tidak. Alasannya: tanpa env,
aplikasi lama crash di import (`createClient` dengan URL kosong) dan
semua halaman kosong karena panggilan backend hardcode
`http://127.0.0.1:8000`.

### 2. Backend tetap sumber utama bila ada

Mode demo meniru payload backend (`{status, data, ...}`) supaya
halaman tidak perlu tahu sumber datanya. Bila backend di-deploy dan
`VITE_API_URL` diisi, demo otomatis nonaktif untuk data (auth tetap
ikut Supabase bila env-nya diset).

### 3. Gemini + ChromaDB lazy

Dulu klien Gemini dan ChromaDB dibuat di level modul — server tidak
bisa boot tanpa `GEMINI_API_KEY`. Sekarang lazy: boot selalu berhasil,
`GET /api/health` melaporkan `genai_configured`, dan endpoint AI tanpa
key mengembalikan error jelas (bukan 500). Ingest RAG jalan di
`lifespan` startup; gagal (tanpa key/PDF) → dilewati rapi, nudge tetap
jalan tanpa konteks RAG.

### 4. SQLite sebagai default lokal

`DATABASE_URL` kosong → SQLite `./syncnol_local.db`. Postgres dipakai
bila env diset (produksi). File `.db` dan `chroma_db/` TIDAK di-commit
(artefak hasil jalan; ingest ulang dari `docs/pojk_asli.pdf`).

### 5. RAG POJK

`docs/pojk_asli.pdf` dipecah (langchain-text-splitters) → embedding
Gemini → ChromaDB persisten. `POST /api/nudge` mengambil pasal
terdekat sebagai konteks jawaban AI. Koleksi yang sudah ter-ingest
berisi 329 dokumen (terverifikasi saat smoke boot lokal).

## Alur data utama

| Alur | Jalur |
|---|---|
| Chat "beli kopi 22 ribu" | Dashboard → `api.sendNudge` → (backend: Gemini deteksi transaksi + RAG) / (demo: parser rule-based) → transaksi tersimpan → summary dihitung ulang |
| Ringkasan | `GET /api/users/{id}/summary` atau `demoSummary()` — net worth = pemasukan − pengeluaran − total utang |
| Goals / Academy | Supabase `goals` / `academy_progress` — atau mock query builder demo |
| Wingman | 100% lokal (`demo.js` state `splits`) — tautan `?split=<id>` + QR |

## Keamanan

- Tanpa secret ter-commit (dicek: hanya kata "password"/"token" di
  kode UI + contoh "PIN & Password Darurat" di Vault — bukan kredensial).
- CORS dari env `CORS_ORIGINS` (default `*` untuk dev).
- Upload logo/SVG: tidak ada fitur upload file publik di repo ini.
- Gate CI: advisory-sweep OSV gagalkan build bila ada HIGH/CRITICAL
  di dependensi produksi.

## Batasan yang diketahui

- Bundle JS ~1,5 MB (peringatan chunk-size Vite).
- Mode demo: data hanya di browser pembuat (tautan Wingman dibuka di
  browser lain → seed, bukan split pembuat).
- OCR struk & RAG butuh `GEMINI_API_KEY`.
