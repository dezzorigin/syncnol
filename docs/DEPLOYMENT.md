# Deployment — SyncNol

## Frontend (Cloudflare Pages)

Proyek Pages: **`syncnol`** → https://syncnol.pages.dev

```bash
cd frontend && npm ci && npm run build   # -> dist/ (tanpa env = mode demo)
# deploy (butuh Cloudflare API token; pola helper: cf_pages.py)
python3 ~/workspace/github-actions/cf_pages.py deploy syncnol frontend/dist/
```

Catatan nama: `syncnol` adalah namespace global — ketersediaan baru
ketahuan saat create (HTTP 409 = dipakai akun lain; subdomain
bersufiks = diambil orang lain). Fallback bila `syncnol` tidak dapat
bersih: `sync-nol` → `sinkron-nol`.

### Env Pages (opsional)

| Variabel | Keterangan |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Auth Supabase sungguhan (kosong = mode demo) |
| `VITE_API_URL` | URL backend FastAPI (kosong = data demo lokal) |

Deploy saat ini: **tanpa env** — mode demo penuh, bisa dicoba siapa
pun tanpa daftar.

### Setelah live

Pasang link live di About repo (PATCH homepage) lalu verifikasi:

```bash
# PATCH /repos/dezzorigin/syncnol {"homepage": "https://syncnol.pages.dev"}
# verifikasi: baca repo, pastikan homepage terpasang
```

## Backend (belum di-deploy)

Backend FastAPI belum di-deploy ke layanan hosting — deploy Pages
hanya menyajikan frontend statis (mode demo). Bila backend di-deploy
(nanti): isi `VITE_API_URL` di Pages dan rebuild; tidak ada perubahan
kode frontend yang diperlukan (facade `api.js` otomatis memakai
backend).

## CI

`.github/workflows/ci.yml` — 8 job di setiap push/PR ke `main`:
frontend-build, frontend-lint, playwright-e2e, backend-tests,
backend-smoke, advisory-sweep (OSV), smoke, docs. Merge hanya bila
semua hijau + live terverifikasi.
