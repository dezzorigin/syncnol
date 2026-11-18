# SyncNol — Frontend

Vite 8 + React 19 + Tailwind CSS 4 + Zustand + react-router-dom.

## Menjalankan

```bash
npm ci
npm run dev        # http://127.0.0.1:5173
npm run build      # -> dist/
npm run preview    # sajikan dist/ di :4173
npm run lint       # ESLint, 0 error
npm run test:e2e   # Playwright (butuh build dulu; lihat playwright.config.js)
```

## Mode demo (tanpa env apa pun)

Tanpa `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, aplikasi jalan
dalam **mode demo**: auth mock + data seed di localStorage
(`syncnol-demo-v1`). Akun demo: `demo@syncnol.id` / `demo1234`.
Lihat [../docs/DEMO.md](../docs/DEMO.md).

Dengan env terisi, aplikasi memakai Supabase Auth sungguhan dan
(opsional) backend FastAPI lewat `VITE_API_URL`. Lihat
[../frontend/.env.example](.env.example).

## Struktur

```
src/
  main.jsx            Entry + router
  supabaseClient.js   Client asli bila env ada, mock bila tidak
  lib/
    api.js            Facade: FastAPI bila VITE_API_URL diset, demo bila tidak
    demo.js           Store + seed + parser J.A.R.V.I.S (mode demo)
    demoSupabase.js   Mock auth + query builder (goals, academy_progress)
  pages/              Landing, Auth, Onboarding, Dashboard, Analytics,
                      Antigravity, Planner, Calendar, Reports, Academy,
                      Vault, Wingman, Settings, AdminPortal
  components/         Sidebar, AppShell, ui (termasuk GithubIcon)
  store/              useAppStore (Zustand: user, transaksi, utang)
  context/            LanguageContext
e2e/                  Playwright: landing, demo, auth
playwright.config.js  baseURL :4173 (vite preview) + webServer fallback
```

## Catatan

- Semua panggilan backend lewat `src/lib/api.js` — jangan hardcode
  `http://127.0.0.1:8000` di halaman.
- `lucide-react` 1.8.0 sudah menghapus ikon brand `Github` — pakai
  `src/components/ui/GithubIcon.jsx` (SVG octocat, CC0).
- Bundle ~1,5 MB (peringatan chunk-size Vite) — belum dipecah.
