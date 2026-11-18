# Frontend — SyncNol

Vite 8 + React 19 + Tailwind CSS 4 + Zustand + react-router-dom.

## Rute

| Rute | Halaman |
|---|---|
| `/` | Landing (SaaS: navbar + GitHub, hero + preview terminal, fitur, footer) |
| `/auth` | Masuk / daftar + tombol "Coba Mode Demo" (hanya mode demo) |
| `/onboarding` | 3 langkah: nama → pendapatan → tujuan keuangan |
| `/app/dashboard` | Kekayaan bersih, grafik, chat J.A.R.V.I.S, batas jajan |
| `/app/analytics` | Pemasukan vs pengeluaran, breakdown kategori |
| `/app/antigravity` | Bebas Hutang: daftar utang + Leakage Scanner |
| `/app/planner` | Goals tabungan |
| `/app/calendar` | Pengingat keuangan |
| `/app/reports` | Ringkasan + ekspor PDF |
| `/app/academy` | Modul literasi + XP |
| `/app/vault` | Brankas: aset & catatan |
| `/app/wingman` | Patungan: bagi tagihan + QR |
| `/app/settings` | Profil + hapus data |
| `/app/admin-portal` | Ringkasan pengguna (admin) |

## Mode demo

Tanpa `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`:

- `src/supabaseClient.js` memakai mock (`demoSupabase.js`) — auth
  localStorage (`syncnol-demo-auth-v1`), query builder thenable untuk
  `goals` dan `academy_progress`.
- `src/lib/api.js` memakai `demo.js` — store localStorage
  (`syncnol-demo-v1`) dengan seed realistis: gaji Rp 7.500.000, 18
  transaksi, utang SPayLater Rp 1.250.000 + Kartu Kredit BCA
  Rp 3.400.000, goals Dana Darurat Rp 15 jt + MacBook Pro Rp 25 jt.
- Akun demo: `demo@syncnol.id` / `demo1234` (profil seed sudah punya
  income + goal → langsung ke dashboard).
- Parser J.A.R.V.I.S (`demoJarvisReply`): nominal Indonesia, klasifikasi
  jenis + kategori, tanya saldo/utang dari data, balasan tanpa markdown.

Dengan env terisi, semua jalur di atas memakai Supabase sungguhan dan
FastAPI (`VITE_API_URL`). Bentuk kembalian demo meniru payload backend
supaya halaman tidak perlu tahu sumber datanya.

## State

- `src/store/useAppStore.js` (Zustand): user, transaksi, utang.
- Halaman mengambil data lewat `src/lib/api.js` — jangan hardcode
  `http://127.0.0.1:8000` di halaman (sudah dibersihkan dari semua
  halaman).

## Catatan implementasi

- `lucide-react` 1.8.0 menghapus ikon brand `Github` — pakai
  `src/components/ui/GithubIcon.jsx` (SVG octocat, CC0).
- Wingman memakai named import `{ QRCode }` dari `react-qr-code`
  (impor default menghasilkan objek namespace di Vite 8 → React #130).
- Bundle ~1,5 MB (peringatan chunk-size Vite) — belum dipecah.
- E2E: `frontend/e2e/*.spec.ts` (Playwright, baseURL `vite preview`
  :4173). Jalankan `npm run build` dulu, lalu `npm run test:e2e`.
