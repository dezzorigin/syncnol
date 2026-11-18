// ─── Lapisan API SyncNol ────────────────────────────────────────────────────
// Satu pintu untuk semua panggilan data. Kalau VITE_API_URL diset, semua
// fungsi di bawah memanggil backend FastAPI persis seperti sebelumnya
// (endpoint + bentuk respons tidak berubah). Kalau tidak diset, fungsi yang
// sama dilayani lapisan demo lokal (src/lib/demo.js) — data seed + CRUD
// localStorage + J.A.R.V.I.S rule-based — sehingga deploy statis di
// Cloudflare Pages tetap bisa dimainkan end-to-end tanpa backend.
//
// Bentuk kembalian selalu meniru payload backend:
//   { status: "success" | "error", ... }

import axios from "axios";
import {
  demoSummary,
  demoTransactions,
  demoAddTransaction,
  demoDeleteTransaction,
  demoDebts,
  demoAddDebt,
  demoUpdateDebt,
  demoDeleteDebt,
  demoJarvisReply,
  getDemoState,
  updateDemoState,
  isDemoMode,
} from "./demo";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const apiMode = API_URL ? "backend" : "demo";
export { isDemoMode };

const ok = (data) => ({ status: "success", ...data });

// ─── Ringkasan & transaksi ──────────────────────────────────────────────────

export async function fetchSummary(userId) {
  if (API_URL) {
    const res = await axios.get(`${API_URL}/api/users/${userId}/summary`);
    return res.data;
  }
  return ok({ data: demoSummary() });
}

export async function fetchTransactions(userId) {
  if (API_URL) {
    const res = await axios.get(`${API_URL}/api/users/${userId}/transactions`);
    return res.data;
  }
  void userId;
  // Bentuk backend: { id, jenis, kategori, nominal, keterangan }
  return ok({ data: demoTransactions() });
}

export async function createTransaction({ jenis_transaksi, kategori, nominal, keterangan, user_id }) {
  if (API_URL) {
    const res = await axios.post(`${API_URL}/api/transactions`, {
      jenis_transaksi,
      kategori,
      nominal,
      keterangan,
      user_id,
    });
    return res.data;
  }
  const trx = demoAddTransaction({ jenis_transaksi, kategori, nominal, keterangan });
  return ok({ pesan: `Transaksi ${trx.kategori} tercatat!`, data: trx });
}

export async function deleteTransaction(trxId) {
  if (API_URL) {
    const res = await axios.delete(`${API_URL}/api/transactions/${trxId}`);
    return res.data;
  }
  demoDeleteTransaction(trxId);
  return ok({ pesan: `Transaksi ${trxId} berhasil dihapus` });
}

// ─── Utang ──────────────────────────────────────────────────────────────────

export async function fetchDebts(userId) {
  if (API_URL) {
    const res = await axios.get(`${API_URL}/api/users/${userId}/debts`);
    return res.data;
  }
  void userId;
  return ok({ daftar_utang: demoDebts() });
}

export async function createDebt({ nama_kreditur, jenis_utang, total_utang, user_id }) {
  if (API_URL) {
    const res = await axios.post(`${API_URL}/api/debts`, {
      nama_kreditur,
      jenis_utang,
      total_utang,
      user_id,
    });
    return res.data;
  }
  const debt = demoAddDebt({ nama_kreditur, jenis_utang, total_utang });
  return ok({ pesan: `Utang ke ${debt.nama_kreditur} berhasil dicatat.`, data: debt });
}

export async function updateDebt(debtId, { total_utang }) {
  if (API_URL) {
    const res = await axios.put(`${API_URL}/api/debts/${debtId}`, { total_utang });
    return res.data;
  }
  const debt = demoUpdateDebt(debtId, { total_utang });
  return debt ? ok({ data: debt }) : { status: "error", pesan: "Utang tidak ditemukan" };
}

export async function deleteDebt(debtId) {
  if (API_URL) {
    const res = await axios.delete(`${API_URL}/api/debts/${debtId}`);
    return res.data;
  }
  demoDeleteDebt(debtId);
  return ok({ pesan: "Utang berhasil dihapus" });
}

// ─── User & onboarding ──────────────────────────────────────────────────────

export async function syncUser(email, nama) {
  if (API_URL) {
    const res = await axios.post(`${API_URL}/api/sync-user`, { email, nama });
    return res.data;
  }
  const state = getDemoState();
  const needsOnboarding =
    !state.monthlyIncome || !state.goal || state.user.email !== email;
  updateDemoState((s) => {
    s.user = { ...s.user, email, nama: nama || s.user.nama };
  });
  return ok({
    user_id: 1,
    nama: nama || state.user.nama,
    needs_onboarding: needsOnboarding,
  });
}

export async function completeOnboarding(userId, { nama, pekerjaan, tujuan_keuangan, pendapatan_bulanan }) {
  if (API_URL) {
    const res = await axios.post(`${API_URL}/api/users/${userId}/onboarding`, {
      nama,
      pekerjaan,
      tujuan_keuangan,
      pendapatan_bulanan,
    });
    return res.data;
  }
  void userId;
  void pekerjaan;
  updateDemoState((s) => {
    if (nama) s.user.nama = nama;
    if (tujuan_keuangan) s.goal = tujuan_keuangan;
    if (pendapatan_bulanan) {
      s.monthlyIncome = Number(pendapatan_bulanan);
      if (!s.transactions.some((t) => t.kategori === "Pendapatan Awal")) {
        s.transactions.push({
          id: `trx-onboarding-${Date.now()}`,
          jenis: "Pemasukan",
          kategori: "Pendapatan Awal",
          nominal: Number(pendapatan_bulanan),
          keterangan: "Pendapatan bulanan dari Onboarding",
          tanggal: new Date().toISOString(),
        });
      }
    }
  });
  return ok({ pesan: "Onboarding selesai", data: { nama, tujuan_keuangan } });
}

// ─── Chat J.A.R.V.I.S ───────────────────────────────────────────────────────

export async function sendNudge({ user_id, pesan_user }) {
  if (API_URL) {
    const res = await fetch(`${API_URL}/api/nudge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, pesan_user }),
    });
    return res.json();
  }
  void user_id;
  const { ai_roast } = demoJarvisReply(pesan_user);
  return ok({ ai_roast });
}

export async function sendReceiptChat({ message, image }) {
  if (API_URL) {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, image }),
    });
    return res.json();
  }
  void image;
  // OCR struk butuh Gemini — di mode demo jawab jujur + arahkan ke chat teks.
  return ok({
    response:
      "Mode demo tidak bisa membaca struk foto — OCR butuh backend + Gemini API key. Ketik saja isinya, misal \"beli kopi 22 ribu\", dan aku yang mencatatnya.",
  });
}
