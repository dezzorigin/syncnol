# Demo — Cara Mencoba & Bukti Play-Test

## Cara mencoba (2 menit)

1. Buka https://syncnol.pages.dev — landing tampil tanpa daftar.
2. Klik **Coba Mode Demo — tanpa daftar** (atau masuk dengan
   `demo@syncnol.id` / `demo1234`) → dashboard berisi data seed.
3. **Dashboard**: kekayaan bersih Rp 1.704.010, total utang
   Rp 4.650.000, grafik kekayaan, batas jajan harian.
4. **Chat J.A.R.V.I.S**: ketik `beli kopi 22 ribu` → balasan
   "Tercatat: Pengeluaran Rp 22.000 (Makan)" + badge hari ini berubah.
5. **Patungan (Wingman)**: judul "Makan malam Kemang", total 124800,
   peserta "Nabil, Najwa, Rafid, Raisa" → **Bagi Tagihan** → tiap orang
   Rp 31.200 + modal bagikan berisi QR.
6. **Analitik**: transaksi seed tampil ("Spotify Premium", "Gaji
   Bulanan", …). **Rencana**: goals "Dana Darurat" + "MacBook Pro".
7. **Daftar akun baru**: Sign Up → "Account created!" → Sign In →
   onboarding 3 langkah → dashboard kosong siap diisi.

Semua perubahan tersimpan di localStorage browser — refresh halaman
dan datamu tetap ada; buka di browser lain dan kembali ke seed.

## Video demo

[docs/demo/demo.mp4](demo/demo.mp4) — 20 detik, 1280×720, slideshow
screenshot asli: landing → auth → dashboard → chat → Wingman.

## Bukti play-test (19 Nov 2026, lokal)

Play-test dilakukan lewat headless Chrome (puppeteer-core) terhadap
`vite preview` build produksi, lalu diulang sebagai Playwright e2e —
**7/7 tes hijau** (`frontend/e2e/*.spec.ts`):

- Landing: hero "Your smart financial co-pilot", terminal J.A.R.V.I.S,
  tautan GitHub navbar + footer, 6 fitur — **lolos**.
- Demo login → dashboard seed: kekayaan, utang Rp 4.650.000, grafik,
  batas jajan — **lolos**.
- Jarvis: "beli kopi 22 ribu" → "Tercatat: Pengeluaran Rp 22.000
  (Makan)" — **lolos**.
- Wingman: 124800/4 = Rp 31.200 per orang + QR 180×180 ter-render
  di modal bagikan — **lolos**.
- Analytics: "Spotify" tampil; Planner: "Dana Darurat" + "MacBook Pro"
  tampil — **lolos**.
- Auth: signup baru → onboarding → dashboard; login salah →
  "Email atau kata sandi salah" — **lolos**.

Backend (lokal, SQLite sementara, tanpa key): unittest **5/5 hijau**;
smoke boot uvicorn: `/api/health` (`genai_configured: false`,
`rag_documents: 329`), POST user + summary berubah — **lolos**.

## Screenshot

`docs/screenshots/`: 01-landing-hero, 02-landing-full, 03-auth,
04-dashboard, 05-dashboard-chat, 06-wingman, 07-analytics,
08-planner, 09-vault.
