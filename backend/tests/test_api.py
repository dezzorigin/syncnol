"""Tes backend SyncNol (stdlib unittest, tanpa pytest).

Jalankan dari root repo:  python3 -m unittest discover -s backend/tests -v
Prasyarat: pip install -r backend/requirements.txt

Yang diuji — tanpa GEMINI_API_KEY dan tanpa Postgres (SQLite sementara):
- import main tetap berhasil tanpa key (regresi: dulu genai.Client()
  dibuat di level modul sehingga server tidak bisa boot tanpa key).
- GET / dan GET /api/health 200, genai_configured False.
- POST /api/chat tanpa key mengembalikan status error yang jelas.
- Alur CRUD penuh: user -> summary -> transaksi -> utang -> update
  utang -> hapus utang -> hapus transaksi -> sync-user -> onboarding.
"""

import os
import sys
import tempfile
import unittest

# DATABASE_URL SQLite sementara HARUS diset sebelum main diimpor.
_TMPDIR = tempfile.mkdtemp(prefix="syncnol-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMPDIR}/test.db"
os.environ.pop("GEMINI_API_KEY", None)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from database import Base, engine  # noqa: E402

# TestClient tanpa context manager tidak menjalankan lifespan — buat tabel
# eksplisit di sini (sama seperti yang dilakukan lifespan saat boot).
Base.metadata.create_all(bind=engine)

client = TestClient(main.app)


class TestHealth(unittest.TestCase):
    def test_root(self):
        r = client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["service"], "syncnol-ai-core")

    def test_health_tanpa_key(self):
        r = client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")
        self.assertFalse(r.json()["genai_configured"])

    def test_chat_tanpa_key_error_jelas(self):
        r = client.post("/api/chat", json={"message": "halo"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "error")
        self.assertIn("GEMINI_API_KEY", r.json()["response"])

    def test_nudge_tanpa_key_error_jelas(self):
        # User harus ada dulu supaya sampai ke gerbang key (bukan 404 user).
        uid = client.post(
            "/api/users",
            json={"nama": "Tes", "email": "tes-nudge@syncnol.id"},
        ).json()["data"]["id"]
        r = client.post("/api/nudge", json={"user_id": uid, "pesan_user": "halo"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "error")
        self.assertIn("GEMINI_API_KEY", r.json()["pesan"])


class TestCrudFlow(unittest.TestCase):
    def test_alur_penuh(self):
        # 1. Buat user (pendapatan_bulanan harus tersimpan — regresi lama).
        r = client.post(
            "/api/users",
            json={
                "nama": "Nabil Tes",
                "email": "nabil-tes@syncnol.id",
                "pekerjaan": "Mahasiswa",
                "tujuan_keuangan": "debt_freedom",
                "pendapatan_bulanan": 7500000,
            },
        )
        self.assertEqual(r.status_code, 200, r.text)
        user = r.json()["data"]
        uid = user["id"]
        self.assertEqual(user["pendapatan_bulanan"], 7500000)

        # 2. Summary awal: semuanya nol kecuali monthly_income.
        s = client.get(f"/api/users/{uid}/summary").json()
        self.assertEqual(s["status"], "success")
        self.assertEqual(s["data"]["net_worth"], 0)
        self.assertEqual(s["data"]["monthly_income"], 7500000)

        # 3. Transaksi: gaji masuk + kopi keluar.
        t1 = client.post(
            "/api/transactions",
            json={
                "jenis_transaksi": "Pemasukan",
                "kategori": "Gaji",
                "nominal": 7500000,
                "keterangan": "Gaji bulanan",
                "user_id": uid,
            },
        ).json()
        self.assertEqual(t1["status"], "success")
        t2 = client.post(
            "/api/transactions",
            json={
                "jenis_transaksi": "Pengeluaran",
                "kategori": "Makan",
                "nominal": 22000,
                "keterangan": "Kopi",
                "user_id": uid,
            },
        ).json()
        self.assertEqual(t2["status"], "success")
        trx_id = t2["data"]["id"]

        # 4. Summary berubah; history mengembalikan 2 transaksi terbaru.
        s = client.get(f"/api/users/{uid}/summary").json()["data"]
        self.assertEqual(s["pemasukan"], 7500000)
        self.assertEqual(s["pengeluaran"], 22000)
        self.assertEqual(s["net_worth"], 7500000 - 22000)
        hist = client.get(f"/api/users/{uid}/transactions").json()
        self.assertEqual(len(hist["data"]), 2)

        # 5. Utang: catat, lihat, update, hapus.
        d = client.post(
            "/api/debts",
            json={
                "nama_kreditur": "SPayLater",
                "jenis_utang": "Pinjol",
                "total_utang": 1250000,
                "user_id": uid,
            },
        ).json()
        self.assertEqual(d["status"], "success")
        debt_id = d["data"]["id"]
        debts = client.get(f"/api/users/{uid}/debts").json()
        self.assertEqual(len(debts["daftar_utang"]), 1)
        upd = client.put(f"/api/debts/{debt_id}", json={"total_utang": 750000}).json()
        self.assertEqual(upd["data"]["total_utang"], 750000)
        net = client.get(f"/api/users/{uid}/summary").json()["data"]["net_worth"]
        self.assertEqual(net, 7500000 - 22000 - 750000)
        self.assertEqual(
            client.delete(f"/api/debts/{debt_id}").json()["status"], "success"
        )
        self.assertEqual(
            client.get(f"/api/users/{uid}/debts").json()["daftar_utang"], []
        )

        # 6. Hapus transaksi (undo) -> pengeluaran kembali nol.
        self.assertEqual(
            client.delete(f"/api/transactions/{trx_id}").json()["status"],
            "success",
        )
        s = client.get(f"/api/users/{uid}/summary").json()["data"]
        self.assertEqual(s["pengeluaran"], 0)

        # 7. sync-user (idempotent) + onboarding.
        sync = client.post(
            "/api/sync-user", json={"email": "nabil-tes@syncnol.id", "nama": "Nabil Tes"}
        ).json()
        self.assertEqual(sync["status"], "success")
        self.assertEqual(sync["user_id"], uid)
        self.assertFalse(sync["needs_onboarding"])
        ob = client.post(
            f"/api/users/{uid}/onboarding",
            json={
                "nama": "Nabil Tes",
                "pekerjaan": "Mahasiswa",
                "tujuan_keuangan": "debt_freedom",
                "pendapatan_bulanan": 8000000,
            },
        ).json()
        self.assertEqual(ob["status"], "success")
        self.assertEqual(
            client.get(f"/api/users/{uid}/summary").json()["data"]["monthly_income"],
            8000000,
        )


if __name__ == "__main__":
    unittest.main()
