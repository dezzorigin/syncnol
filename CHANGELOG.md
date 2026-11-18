# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
dan [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Mode demo lokal** (`frontend/src/lib/demo.js`, `demoSupabase.js`,
  `api.js`): aplikasi jalan penuh tanpa Supabase & backend — akun
  `demo@syncnol.id` / `demo1234`, seed 18 transaksi + 2 utang + 2 goals,
  parser J.A.R.V.I.S rule-based Bahasa Indonesia (nominal "1,5 juta",
  "50rb", "2jt", "120k"; kategori otomatis).
- **Wingman (Patungan)** ditulis ulang dari placeholder "coming soon"
  jadi bill-splitter sungguhan: bagi rata, toggle lunas, tautan + QR
  bagikan.
- **Playwright e2e** (`frontend/e2e/`): 7 tes — landing, demo login,
  Jarvis, Wingman, Analytics, Planner, auth + onboarding.
- **CI dua sisi** (`.github/workflows/ci.yml`): frontend-build,
  frontend-lint, playwright-e2e, backend-tests, backend-smoke,
  advisory-sweep (OSV), smoke, docs.
- **Tes backend** (`backend/tests/test_api.py`): 5 tes unittest +
  TestClient — health, error jelas tanpa key, alur CRUD penuh.
- **Dokumen**: PRD v2.0 dari fungsi asli, `docs/ARCHITECTURE.md`,
  `docs/API.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`,
  `docs/DEPLOYMENT.md`, `docs/DEMO.md`, `docs/DIAGRAMS.html`,
  `frontend/README.md`, `.env.example` backend + frontend.
- **Server statis SPA** (`scripts/serve.mjs`) untuk smoke CI;
  **advisory sweep OSV** (`scripts/advisory-sweep.py`) untuk gate
  keamanan dependensi produksi.
- **Screenshot asli** (`docs/screenshots/`, 9 gambar) + **video demo**
  (`docs/demo/demo.mp4`).
- Endpoint `GET /` dan `GET /api/health` (laporan `genai_configured` +
  jumlah dokumen RAG).

### Changed
- Backend `main.py`: klien Gemini + ChromaDB lazy (server boot tanpa
  key); startup RAG pindah ke `lifespan`; hapus duplikat `POST /api/chat`;
  `create_user` kini menyimpan `pendapatan_bulanan`; CORS dari env.
- `backend/database.py`: default SQLite `./syncnol_local.db` bila
  `DATABASE_URL` kosong.
- `backend/requirements.txt`: dari pip freeze ~80 paket jadi hanya
  dependensi langsung.
- `supabaseClient.js`: client asli bila env ada, mock demo bila tidak.
- Dashboard: badge "Hari Ini" kini dari transaksi nyata; sumbu-Y grafik
  ringkas ("15 jt / 10 jt / 5 jt"); greeting dirender; state turunan
  jadi `useMemo`.
- Reports: pratinjau PDF mati diganti ringkasan live dari data.
- Vault: aset/catatan persisten ke localStorage.
- `postcss` 8.5.10 → ^8.5.18.
- `.gitignore`: pola env diperbaiki (pola lama `^.env.*` tidak valid);
  tambah `backend/syncnol_local.db`, `backend/chroma_db/`, `dist/`,
  `test-results/`, `playwright-report/`.

### Fixed
- Onboarding: pemanggilan API `completeOnboarding` yang tertutup
  (shadowed) oleh fungsi store — API tidak pernah terpanggil.
- Wingman: impor default `react-qr-code` menghasilkan objek namespace
  (React error #130) — diganti named import.
- AuthPage: tautan `/dashboard` (rute tak ada) → `/app/dashboard`.
- `ai_engine/*.py` + `backend/test_genai.py`: guard jelas bila
  `GEMINI_API_KEY` tak diset (sebelumnya crash di `genai.Client()`).

### Removed
- `backend/chroma_db/` (5 file biner hasil ingest) + `backend/syncnol_local.db`
  dari tree — artefak hasil jalan, di-ingest ulang dari `docs/pojk_asli.pdf`
  saat boot pertama dengan key; tidak boleh ter-commit.

## [1.0.0] - 2024-08-03

### Added
- Initial Syncnol setup
- Dashboard components
- Data visualization
- Responsive design
