# Backend — SyncNol

FastAPI + SQLAlchemy + Pydantic. Python 3.12.

## Menjalankan

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # isi GEMINI_API_KEY untuk fitur AI
uvicorn main:app --reload --port 8000
```

- Tanpa `DATABASE_URL` → SQLite `./syncnol_local.db`.
- Tanpa `GEMINI_API_KEY` → server tetap boot; endpoint AI
  mengembalikan error jelas (bukan 500); `GET /api/health`
  melaporkan `genai_configured: false`.

## Struktur

```
backend/
  main.py           Semua endpoint + lifespan (ingest RAG) + RAG helper
  database.py       Engine + session (SQLite default / Postgres via env)
  models.py         User, Debt, Transaction
  schemas.py        Skema Pydantic
  requirements.txt  Hanya dependensi langsung
  tests/
    test_api.py     5 tes unittest + TestClient (tanpa pytest)
  .env.example      DATABASE_URL, GEMINI_API_KEY, CORS_ORIGINS
```

## RAG POJK

- Sumber: `docs/pojk_asli.pdf`.
- Saat startup (`lifespan`), PDF dipecah (langchain-text-splitters),
  di-embedding (Gemini), disimpan di ChromaDB persisten
  (`backend/chroma_db/` — TIDAK di-commit, di-ingest ulang saat boot
  pertama dengan key). Koleksi ter-ingest berisi 329 dokumen.
- `POST /api/nudge` mengambil pasal terdekat sebagai konteks jawaban.
- RAG gagal (tanpa key/PDF) → konteks kosong, nudge tetap jalan.

## Tes

```bash
# dari root repo
python3 -m unittest discover -s backend/tests -v
```

Tes memakai SQLite sementara (`/tmp/...`) dan men-set `DATABASE_URL`
SEBELUM impor `main`. Mencakup: impor tanpa key, `GET /`,
`/api/health`, error jelas `/api/chat` + `/api/nudge` tanpa key, dan
alur CRUD penuh (user → summary → transaksi → summary berubah →
utang CRUD → sync-user idempotent → onboarding).

## Smoke boot

```bash
cd backend
DATABASE_URL="sqlite:////tmp/syncnol-smoke.db" uvicorn main:app --port 8123
curl http://127.0.0.1:8123/api/health
curl -X POST http://127.0.0.1:8123/api/users \
  -H 'Content-Type: application/json' \
  -d '{"nama":"Smoke","email":"smoke@syncnol.id","pendapatan_bulanan":5000000}'
curl http://127.0.0.1:8123/api/users/1/summary
```

## Skrip coba (ai_engine/)

`ai_engine/brain_tes.py`, `ai_engine/rag_tes.py`, dan
`backend/test_genai.py` adalah skrip coba manual (bukan bagian
server). Semuanya berhenti dengan pesan jelas bila `GEMINI_API_KEY`
tidak diset.

## Env

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Kosong → SQLite lokal; isi `postgresql://...` untuk Postgres |
| `GEMINI_API_KEY` | Kunci Gemini (AI + embedding RAG + OCR) |
| `CORS_ORIGINS` | Daftar origin dipisah koma (default `*`) |
