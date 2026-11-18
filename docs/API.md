# API — Backend FastAPI SyncNol

Base URL lokal: `http://127.0.0.1:8000` (atur frontend lewat
`VITE_API_URL`). Semua respons sukses berbentuk
`{"status": "success", "data": ...}` (atau `"pesan"` pada beberapa
endpoint lama). Endpoint AI tanpa `GEMINI_API_KEY` mengembalikan
error jelas, bukan 500.

## Kesehatan

| Endpoint | Keterangan |
|---|---|
| `GET /` | `{"message": "SyncNol AI Core aktif", ...}` |
| `GET /api/health` | `{"status":"ok","service":"syncnol-ai-core","genai_configured":bool,"rag_documents":n}` |

## AI

| Endpoint | Body | Keterangan |
|---|---|---|
| `POST /api/nudge` | `{"user_id": int, "message": str}` | Chat + auto-journaling: Gemini mendeteksi transaksi dari kalimat, mencatat ke DB, menjawab dengan konteks utang + pasal OJK terdekat (RAG). Butuh key. |
| `POST /api/chat` | `{"user_id": int, "message": str, "image_base64": str?}` | Chat + OCR struk gambar (base64). Butuh key. |

Contoh nudge (dengan key):

```bash
curl -X POST http://127.0.0.1:8000/api/nudge \
  -H 'Content-Type: application/json' \
  -d '{"user_id": 1, "message": "beli kopi 22 ribu"}'
```

## Users

| Endpoint | Keterangan |
|---|---|
| `POST /api/users` | Buat user. Body: `nama`, `email`, `pekerjaan?`, `tujuan_keuangan?`, `pendapatan_bulanan?` (kini disimpan). |
| `GET /api/users/{id}` | Detail user. |
| `GET /api/users/{id}/summary` | `nama`, `pemasukan`, `pengeluaran`, `total_utang`, `monthly_income`, `net_worth` (= pemasukan − pengeluaran − total utang). |
| `POST /api/sync-user` | Sinkron Supabase → Postgres (idempotent berdasar email). Body: `id` (Supabase UUID), `email`, `nama?`. |
| `POST /api/users/{id}/onboarding` | Simpan hasil onboarding. Body: `pekerjaan?`, `tujuan_keuangan?`, `pendapatan_bulanan?`. |

## Debts & Transactions

| Endpoint | Keterangan |
|---|---|
| `GET /api/debts?user_id=` | Daftar utang pengguna. |
| `POST /api/debts` | Buat utang: `nama_kreditur`, `jenis_utang`, `total_utang`, `user_id`. |
| `PUT /api/debts/{id}` | Ubah utang. |
| `DELETE /api/debts/{id}` | Hapus utang. |
| `GET /api/transactions?user_id=` | Daftar transaksi pengguna. |
| `POST /api/transactions` | Buat transaksi: `jenis` (Pemasukan/Pengeluaran), `kategori`, `nominal`, `keterangan?`, `tanggal?`, `user_id`. |
| `DELETE /api/transactions/{id}` | Hapus transaksi. |

## Model data

- **User**: `nama`, `email` (unik), `pekerjaan`, `tujuan_keuangan`,
  `pendapatan_bulanan`.
- **Debt**: `nama_kreditur`, `jenis_utang`, `total_utang`, `user_id`.
- **Transaction**: `jenis`, `kategori`, `nominal`, `keterangan`,
  `tanggal`, `user_id`.

## Mode demo (tanpa backend)

Bila `VITE_API_URL` tidak diset, frontend melayani endpoint yang
sama dari `src/lib/demo.js` dengan bentuk kembalian yang meniru
payload di atas. Parser demo: nominal Indonesia ("Rp 1.500.000",
"1,5 juta", "50rb", "2jt", "120k"), klasifikasi
Pemasukan/Pengeluaran/Bayar Utang, kategori Makan / Transport /
Tagihan / Langganan / Belanja / Gaji / Bayar Utang / Lifestyle.
OCR struk di demo dijawab jujur: butuh backend + Gemini key.
