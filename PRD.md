# PRD — SyncNol

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama | SyncNol |
| Tagline | Asisten keuangan AI berbahasa Indonesia — J.A.R.V.I.S co-pilot |
| Repo | https://github.com/dezzorigin/syncnol |
| Live | https://syncnol.pages.dev |
| Stack | Vite 8 + React 19 + Tailwind 4 (frontend); FastAPI + SQLAlchemy (backend); Supabase Auth; Gemini + ChromaDB (RAG POJK) |
| Status | Proper — live di Cloudflare Pages (mode demo) |
| Versi dokumen | 2.0 (19 Nov 2026) |

## 2. Latar belakang

Mencatat keuangan terasa berat: buka aplikasi, pilih kategori, isi
nominal. Orang Indonesia lebih nyaman bercerita — "beli kopi 22 ribu",
"gajian 7,5 juta" — daripada mengisi form. SyncNol membalik alurnya:
pengguna cukup mengetik kalimat, AI yang mencatat, mengkategorikan,
dan menjawab dengan konteks keuangan pengguna (saldo, utang, aturan
OJK terdekat).

## 3. Masalah yang diselesaikan

1. **Pencatatan malas** — chat auto-journaling: satu kalimat jadi satu
   transaksi terkategori.
2. **Utang tidak terpantau** — daftar utang + total + pengingat, net
   worth memperhitungkan utang.
3. **Bagi tagihan ribet** — Wingman: bagi rata, tautan + QR, lacak
   siapa sudah bayar.
4. **Aturan OJK sulit dicari** — RAG dari `docs/pojk_asli.pdf`: jawaban
   AI disertai pasal terdekat.
5. **Tanpa backend pun harus jalan** — mode demo lokal supaya produk
   bisa dicoba siapa pun tanpa daftar dan tanpa kunci API.

## 4. Pengguna & persona

| Persona | Kebutuhan utama |
|---|---|
| Karyawan muda (gaji bulanan) | Tahu uang habis ke mana; batas jajan harian |
| Punya cicilan / paylater | Total utang terpantau; pengingat bayar |
| Sering patungan | Bagi tagihan cepat + bukti siapa sudah bayar |
| Pelajar literasi keuangan | Akademi + XP |

## 5. Ruang lingkup

### 5.1 Fitur inti (sudah ada & terverifikasi jalan)

- **Landing SaaS**: navbar + tautan GitHub, hero + preview terminal
  J.A.R.V.I.S, 6 fitur, footer.
- **Auth**: Supabase Auth (Google/email) bila env diset; mode demo
  (akun `demo@syncnol.id` / `demo1234`) bila tidak.
- **Onboarding**: nama → pendapatan bulanan → tujuan keuangan.
- **Dashboard**: kekayaan bersih (= pemasukan − pengeluaran − utang),
  grafik kekayaan, batas jajan harian, badge transaksi hari ini.
- **J.A.R.V.I.S chat**: parse nominal Indonesia ("1,5 juta", "50rb",
  "2jt", "120k"), klasifikasi pemasukan/pengeluaran/bayar utang,
  kategori otomatis, tanya saldo & utang. OCR struk bila backend +
  Gemini tersedia.
- **Analitik**: pemasukan vs pengeluaran, breakdown kategori.
- **Bebas Hutang**: CRUD utang, total utang, Leakage Scanner.
- **Rencana**: goals tabungan (target, terkumpul, progres).
- **Kalender**: pengingat keuangan lokal.
- **Laporan**: ringkasan periode + ekspor PDF (jsPDF).
- **Akademi**: modul + XP (progres tersimpan).
- **Brankas**: aset & catatan (tersimpan lokal).
- **Patungan (Wingman)**: bagi rata (sisa pembulatan ke peserta
  pertama), toggle lunas per peserta, tautan + QR bagikan.
- **Pengaturan**: profil, hapus data demo.
- **Admin Portal**: ringkasan pengguna.

### 5.2 Backend (FastAPI)

- `POST /api/nudge` — chat + auto-journaling + RAG POJK.
- `POST /api/chat` — chat + OCR struk (base64).
- CRUD users / debts / transactions; `GET /api/users/{id}/summary`;
  `POST /api/sync-user`; `POST /api/users/{id}/onboarding`.
- `GET /api/health` — status + `genai_configured` + jumlah dokumen RAG.
- Tanpa `GEMINI_API_KEY`: server tetap boot; endpoint AI mengembalikan
  error jelas, bukan 500.

### 5.3 Di luar lingkup (tidak dijanjikan)

- Pembayaran / koneksi rekening bank sungguhan.
- Sinkronisasi antar-perangkat untuk mode demo (data di localStorage).
- Nasihat investasi / produk keuangan berizin OJK.

## 6. Alur utama

1. Pengguna buka landing → **Coba Mode Demo** → dashboard berisi data
   seed realistis (gaji Rp 7,5 jt, 18 transaksi, 2 utang, 2 goals).
2. Ketik "beli kopi 22 ribu" → tercatat, net worth & badge hari ini
   berubah, balasan AI muncul.
3. Buka Wingman → isi judul + total + peserta → bagi → bagikan QR.
4. Buka Analitik / Rencana → data seed + transaksi baru tampil.
5. Daftar akun baru → onboarding 3 langkah → dashboard kosong siap
   diisi.

## 7. Kriteria keberhasilan

- [x] Landing + semua modul ter-render tanpa error console aplikasi.
- [x] Demo login → dashboard seed; chat mencatat transaksi dengan
  nominal & kategori benar.
- [x] Wingman 124800/4 = 31.200 + QR ter-render.
- [x] ESLint 0 error; build Vite lolos; backend unittest 5/5 hijau.
- [x] Playwright e2e 7/7 hijau (landing, demo, Jarvis, Wingman,
  Analytics, Planner, auth).
- [x] CI 8 job hijau (build, lint, e2e, backend-tests, backend-smoke,
  advisory-sweep, smoke, docs).
- [x] Live di Cloudflare Pages, homepage repo terpasang.
- [ ] (nanti) Backend deploy + `VITE_API_URL` terisi → chat Gemini +
  RAG POJK live; Supabase env → auth sungguhan.

## 8. Risiko & batasan

- Mode demo menyimpan data di localStorage — hilang bila browser
  di-reset; bukan pengganti akun.
- OCR struk & jawaban RAG butuh `GEMINI_API_KEY` (tidak ikut
  ter-deploy di Pages demo).
- Bundle JS ~1,5 MB (peringatan chunk-size Vite) — belum dipecah;
  tidak memblokir pemakaian.
- ChromaDB (`backend/chroma_db/`) tidak di-commit: di-ingest ulang
  dari `docs/pojk_asli.pdf` saat boot pertama dengan key.
