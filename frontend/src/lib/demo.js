// ─── Mode Demo SyncNol ───────────────────────────────────────────────────────
// Lapisan data lokal (localStorage) yang dipakai saat aplikasi berjalan TANPA
// backend FastAPI dan TANPA Supabase — yaitu di deploy statis Cloudflare
// Pages (tanpa environment variable) dan saat `npm run dev` tanpa .env.
//
// Prinsip: fungsi aslinya TIDAK diubah. Backend FastAPI tetap sumber data
// utama saat VITE_API_URL diset; Supabase tetap auth utama saat
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY diset. Mode demo hanya
// mengisi kekosongan itu supaya produk tetap bisa dimainkan end-to-end
// (login → onboarding → dashboard → chat J.A.R.V.I.S → utang → goals →
// academy → laporan PDF) tanpa satu pun kredensial.
//
// Semua data demo hidup di localStorage kunci SYNCNOL_DEMO_KEY dan bisa
// dihapus dari Settings → Hapus data demo.

const DEMO_KEY = "syncnol-demo-v1";

export const isDemoMode =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasApiBackend = Boolean(
  (import.meta.env.VITE_API_URL || "").trim(),
);

// ─── Seed data ──────────────────────────────────────────────────────────────
// Tanggal dibuat relatif terhadap "hari ini" supaya grafik, filter waktu
// Analytics, dan kalender selalu menampilkan data segar.

function daysAgo(n, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 50) + 5, 0, 0);
  return d.toISOString();
}

function monthsAhead(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}

function seedTransactions() {
  const t = (days, jenis, kategori, nominal, keterangan) => ({
    id: `seed-${days}-${kategori}-${nominal}`,
    jenis,
    kategori,
    nominal,
    keterangan,
    tanggal: daysAgo(days),
  });
  return [
    t(25, "Pemasukan", "Gaji", 7500000, "Gaji bulanan — PT Kita Pandu"),
    t(24, "Pengeluaran", "Tagihan", 325000, "Listrik PLN + PDAM"),
    t(23, "Pengeluaran", "Makan", 48000, "GoFood — nasi padang"),
    t(22, "Pengeluaran", "Transport", 18000, "GrabBike ke kampus"),
    t(21, "Pengeluaran", "Makan", 22000, "Kopi kenangan"),
    t(20, "Pengeluaran", "Langganan", 54990, "Spotify Premium"),
    t(19, "Pengeluaran", "Belanja", 189000, "Shopee — kaos + celana"),
    t(18, "Pengeluaran", "Makan", 35000, "Makan siang warkop"),
    t(17, "Pengeluaran", "Transport", 50000, "Bensin Pertalite"),
    t(15, "Pengeluaran", "Langganan", 54000, "Netflix standar"),
    t(14, "Pengeluaran", "Makan", 22000, "Kopi susu gula aren"),
    t(12, "Pengeluaran", "Makan", 65000, "Makan malam bareng Najwa"),
    t(10, "Pengeluaran", "Transport", 15000, "Parkir + tol"),
    t(8, "Pengeluaran", "Makan", 42000, "GoFood — ayam geprek"),
    t(6, "Pengeluaran", "Belanja", 125000, "Top up e-wallet DANA"),
    t(4, "Pengeluaran", "Makan", 28000, "Kopi + roti bakar"),
    t(2, "Pengeluaran", "Transport", 20000, "Gojek ke Banda Aceh"),
    t(1, "Pengeluaran", "Makan", 33000, "Makan siang — mie aceh"),
  ];
}

function seedState() {
  return {
    version: 1,
    user: { id: 1, email: "demo@syncnol.id", nama: "Demo" },
    monthlyIncome: 7500000,
    goal: "debt_freedom",
    transactions: seedTransactions(),
    debts: [
      { id: "seed-debt-1", nama_kreditur: "SPayLater", jenis_utang: "Pinjol", total_utang: 1250000 },
      { id: "seed-debt-2", nama_kreditur: "Kartu Kredit BCA", jenis_utang: "Credit Card", total_utang: 3400000 },
    ],
    goals: [
      { id: "seed-goal-1", user_id: 1, name: "Dana Darurat", target_amount: 15000000, target_date: monthsAhead(4), current_saved: 4250000, created_at: daysAgo(25) },
      { id: "seed-goal-2", user_id: 1, name: "MacBook Pro", target_amount: 25000000, target_date: monthsAhead(7), current_saved: 8000000, created_at: daysAgo(20) },
    ],
    academy: [],
    splits: [],
  };
}

// ─── Store ──────────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch {
    /* localStorage tidak tersedia — pakai state memori */
  }
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

let memoryState = null;

function saveState(state) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  } catch {
    memoryState = state;
  }
}

export function getDemoState() {
  try {
    return loadState();
  } catch {
    if (!memoryState) memoryState = seedState();
    return memoryState;
  }
}

export function updateDemoState(mutator) {
  const state = getDemoState();
  mutator(state);
  saveState(state);
  return state;
}

export function resetDemoData() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    memoryState = null;
  }
  return loadState();
}

// ─── Ringkasan (cerminan logika backend GET /api/users/{id}/summary) ────────

export function demoSummary() {
  const state = getDemoState();
  const pemasukan = state.transactions
    .filter((t) => (t.jenis || "").toLowerCase() === "pemasukan")
    .reduce((s, t) => s + Number(t.nominal || 0), 0);
  const pengeluaran = state.transactions
    .filter((t) => (t.jenis || "").toLowerCase() === "pengeluaran")
    .reduce((s, t) => s + Number(t.nominal || 0), 0);
  const total_utang = state.debts.reduce((s, d) => s + Number(d.total_utang || 0), 0);
  return {
    nama: state.user.nama,
    net_worth: pemasukan - pengeluaran - total_utang,
    pemasukan,
    pengeluaran,
    total_utang,
    monthly_income: state.monthlyIncome || 0,
  };
}

// ─── Transaksi & utang ──────────────────────────────────────────────────────

export function demoTransactions() {
  return [...getDemoState().transactions].sort(
    (a, b) => new Date(b.tanggal) - new Date(a.tanggal),
  );
}

export function demoAddTransaction({ jenis_transaksi, kategori, nominal, keterangan }) {
  const trx = {
    id: `trx-${Date.now()}`,
    jenis: jenis_transaksi,
    kategori,
    nominal: Number(nominal),
    keterangan: keterangan || kategori,
    tanggal: new Date().toISOString(),
  };
  updateDemoState((s) => {
    s.transactions.push(trx);
  });
  return trx;
}

export function demoDeleteTransaction(id) {
  updateDemoState((s) => {
    s.transactions = s.transactions.filter((t) => String(t.id) !== String(id));
  });
}

export function demoDebts() {
  return [...getDemoState().debts];
}

export function demoAddDebt({ nama_kreditur, jenis_utang, total_utang }) {
  const debt = {
    id: `debt-${Date.now()}`,
    nama_kreditur,
    jenis_utang,
    total_utang: Number(total_utang),
  };
  updateDemoState((s) => {
    s.debts.push(debt);
  });
  return debt;
}

export function demoUpdateDebt(id, patch) {
  let updated = null;
  updateDemoState((s) => {
    const d = s.debts.find((x) => String(x.id) === String(id));
    if (d) {
      Object.assign(d, patch);
      updated = { ...d };
    }
  });
  return updated;
}

export function demoDeleteDebt(id) {
  updateDemoState((s) => {
    s.debts = s.debts.filter((d) => String(d.id) !== String(id));
  });
}

// ─── J.A.R.V.I.S lokal (rule-based, tanpa API key) ──────────────────────────
// Meniru kontrak backend POST /api/nudge: mendeteksi transaksi dari kalimat
// Bahasa Indonesia, mencatatnya otomatis, lalu membalas dengan gaya
// SyncNol AI (profesional, suportif, sedikit sarkas — tanpa markdown).

const RUPIAH = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function parseAmount(text) {
  // "Rp 1.500.000", "1,5 juta", "50rb", "2jt", "120k", "7500000"
  const cleaned = text.toLowerCase().replace(/rp\.?/g, " ");
  const re =
    /(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb|k)?/g;
  let best = null;
  for (const m of cleaned.matchAll(re)) {
    let num = m[1].replace(/\./g, "").replace(",", ".");
    let value = parseFloat(num);
    if (!Number.isFinite(value) || value <= 0) continue;
    const unit = m[2];
    if (unit === "juta" || unit === "jt") value *= 1_000_000;
    else if (unit === "ribu" || unit === "rb") value *= 1_000;
    else if (unit === "k") value *= 1_000;
    // Angka polos < 1000 tanpa satuan hampir pasti bukan nominal uang
    // (mis. "bagi 4 orang"), jadi abaikan kecuali ada kata "rp" di dekatnya.
    if (!unit && value < 1000 && !/rp/.test(cleaned)) continue;
    if (!best || value > best) best = value;
  }
  return best ? Math.round(best) : 0;
}

function detectCategory(text, jenis) {
  if (/(gaji|bonus|thr|fee|jualan|dapat duit|terima)/.test(text)) return "Gaji";
  if (/(kopi|makan|minum|warkop|gofood|grabfood|nasi|mie|ayam|bekal)/.test(text)) return "Makan";
  if (/(bensin|ojek|grab|gojek|parkir|tol|transport|bus|angkot)/.test(text)) return "Transport";
  if (/(listrik|pln|pdam|air|internet|wifi|pulsa|langganan|spotify|netflix)/.test(text))
    return /spotify|netflix|langganan/.test(text) ? "Langganan" : "Tagihan";
  if (/(shopee|tokopedia|belanja|baju|sepatu|top up|e-wallet|dana|gopay|ovo)/.test(text)) return "Belanja";
  if (/(utang|paylater|cicil|lunas|kredit)/.test(text)) return "Bayar Utang";
  return jenis === "Pemasukan" ? "Lainnya" : "Lifestyle";
}

export function demoJarvisReply(pesan) {
  const text = (pesan || "").toLowerCase();
  const state = getDemoState();
  const summary = demoSummary();

  // ── Tanya saldo / utang ──────────────────────────────────────────────────
  if (/(sisa uang|saldo|kekayaan|net worth|berapa uang)/.test(text) && !/beli|bayar|gaji/.test(text)) {
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1;
    const daily = Math.max(0, Math.floor((summary.net_worth - summary.total_utang) / Math.max(1, daysLeft)));
    return {
      ai_roast: `Kekayaan bersihmu sekarang ${RUPIAH(summary.net_worth)}. Pemasukan ${RUPIAH(summary.pemasukan)}, pengeluaran ${RUPIAH(summary.pengeluaran)}, utang ${RUPIAH(summary.total_utang)}. Budget aman harianmu sekitar ${RUPIAH(daily)} — jangan lewat dari itu kalau mau akhir bulan tetap napas.`,
      recorded: null,
    };
  }
  if (/(total utang|utangku|utang gue|berapa utang)/.test(text)) {
    const list = state.debts.length
      ? state.debts.map((d) => `${d.nama_kreditur} ${RUPIAH(d.total_utang)}`).join(", ")
      : "nol. Bersih, pertahankan.";
    return {
      ai_roast: `Total utangmu ${RUPIAH(summary.total_utang)}: ${list}. Yang paling berat ${state.debts[0] ? state.debts[0].nama_kreditur : "tidak ada"} — sikat itu dulu sebelum mikir jajan.`,
      recorded: null,
    };
  }

  // ── Bayar utang ──────────────────────────────────────────────────────────
  if (/(bayar utang|bayar paylater|lunas|cicil)/.test(text)) {
    const amount = parseAmount(text);
    const target =
      state.debts.find((d) => text.includes(d.nama_kreditur.toLowerCase().replace(/\s/g, ""))) ||
      state.debts.find((d) => text.includes(d.nama_kreditur.toLowerCase().split(" ")[0])) ||
      state.debts[0];
    if (!target) {
      return { ai_roast: "Kamu sedang tidak punya utang tercatat. Kalau memang ada utang di luar, catat dulu di Antigravity Engine biar bisa kupantau.", recorded: null };
    }
    if (!amount) {
      return { ai_roast: `Mau bayar ${target.nama_kreditur} berapa? Sisa utangnya ${RUPIAH(target.total_utang)}. Sebut nominalnya, misal "bayar paylater 500 ribu".`, recorded: null };
    }
    const paid = Math.min(amount, target.total_utang);
    const remaining = target.total_utang - paid;
    demoAddTransaction({ jenis_transaksi: "Pengeluaran", kategori: "Bayar Utang", nominal: paid, keterangan: `Bayar ${target.nama_kreditur}` });
    if (remaining <= 0) {
      demoDeleteDebt(target.id);
      return {
        ai_roast: `LUNAS. ${target.nama_kreditur} ${RUPIAH(paid)} resmi nol. Itu kemenangan besar — rayakan secukupnya, jangan langsung checkout barang baru.`,
        recorded: { jenis_transaksi: "Pengeluaran", kategori: "Bayar Utang", nominal: paid, keterangan: `Bayar ${target.nama_kreditur} (LUNAS)` },
      };
    }
    demoUpdateDebt(target.id, { total_utang: remaining });
    return {
      ai_roast: `Bagus, ${RUPIAH(paid)} masuk ke ${target.nama_kreditur}. Sisa utangnya tinggal ${RUPIAH(remaining)} — teruskan, jangan kasih kendor.`,
      recorded: { jenis_transaksi: "Pengeluaran", kategori: "Bayar Utang", nominal: paid, keterangan: `Bayar ${target.nama_kreditur}` },
    };
  }

  // ── Pemasukan ────────────────────────────────────────────────────────────
  if (/(gaji|bonus|dapat|terima|masuk|thr|fee|jualan)/.test(text)) {
    const amount = parseAmount(text);
    if (!amount) {
      return { ai_roast: "Dapat uang berapa? Sebut nominalnya, misal \"gaji 7,5 juta masuk hari ini\".", recorded: null };
    }
    const kategori = detectCategory(text, "Pemasukan");
    const trx = demoAddTransaction({ jenis_transaksi: "Pemasukan", kategori, nominal: amount, keterangan: pesan.trim().slice(0, 80) });
    return {
      ai_roast: `Pemasukan ${RUPIAH(amount)} (${kategori}) sudah kucatat. Jangan langsung terasa kaya — sisihkan dulu buat utang dan dana darurat sebelum sisanya boleh jalan-jalan.`,
      recorded: trx,
    };
  }

  // ── Pengeluaran ──────────────────────────────────────────────────────────
  if (/(beli|bayar|jajan|makan|minum|habis|keluar|checkout|naik|isi)/.test(text)) {
    const amount = parseAmount(text);
    if (!amount) {
      return { ai_roast: "Keluar uang berapa? Sebut nominalnya, misal \"beli kopi 22 ribu\". Kalau cuma curhat tanpa angka, aku cuma bisa dengerin.", recorded: null };
    }
    const kategori = detectCategory(text, "Pengeluaran");
    const trx = demoAddTransaction({ jenis_transaksi: "Pengeluaran", kategori, nominal: amount, keterangan: pesan.trim().slice(0, 80) });
    const ratio = summary.pengeluaran > 0 ? Math.round((amount / summary.pengeluaran) * 100) : 0;
    return {
      ai_roast: `Tercatat: Pengeluaran ${RUPIAH(amount)} (${kategori}). Itu sekitar ${ratio}% dari total pengeluaranmu sejauh ini. Masih dalam batas wajar — asal jangan tiga kali sehari.`,
      recorded: trx,
    };
  }

  // ── Sapaan / fallback ────────────────────────────────────────────────────
  if (/^(halo|hai|hi|pagi|siang|sore|malam|tes|test)\b/.test(text.trim())) {
    return {
      ai_roast: `Halo ${state.user.nama}. Aku J.A.R.V.I.S versi demo — tanpa Gemini, tapi tetap bisa mencatat keuanganmu. Coba ketik "beli kopi 22 ribu" atau "gaji 7,5 juta masuk".`,
      recorded: null,
    };
  }
  return {
    ai_roast: `Aku dengar. Kalau itu soal uang, sebut nominalnya biar kucatat — contoh: "makan siang 35 ribu" atau "bayar paylater 500 ribu". Kalau mau lihat kondisi dompetmu, tanya saja "berapa sisa uangku".`,
    recorded: null,
  };
}
