// Wingman Protocol — bill splitter sungguhan (bukan lagi "coming soon").
// Satu tagihan dibagi rata ke semua peserta, lengkap dengan tautan berbagi
// + QR code per split dan penanda siapa yang sudah bayar. Data tersimpan
// di lapisan demo lokal (localStorage) supaya tetap ada setelah refresh;
// tidak butuh backend maupun Supabase.
import { useState } from "react";
import { QRCode } from "react-qr-code";
import {
  Users,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  Receipt,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDemoState, updateDemoState } from "../lib/demo";

const formatIDR = (num) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(num) || 0);

function splitMath(total, participants) {
  const n = Math.max(1, participants.length);
  const perPerson = Math.floor(total / n);
  // Sisa pembulatan dibebankan ke peserta pertama supaya totalnya pas.
  const remainder = total - perPerson * n;
  return participants.map((p, i) => ({
    ...p,
    share: perPerson + (i === 0 ? remainder : 0),
  }));
}

export default function WingmanPage() {
  const [splits, setSplits] = useState(() => getDemoState().splits || []);
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [namesInput, setNamesInput] = useState("");
  const [openSplitId, setOpenSplitId] = useState(null);

  const refresh = () => setSplits(getDemoState().splits || []);

  const handleCreate = (e) => {
    e.preventDefault();
    const amount = Number(String(total).replace(/[.,]/g, ""));
    const names = namesInput
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (!title.trim() || !amount || amount <= 0) {
      toast.error("Isi judul dan total tagihan (angka > 0).");
      return;
    }
    if (names.length < 2) {
      toast.error("Minimal 2 peserta — pisahkan nama dengan koma.");
      return;
    }
    const participants = names.map((name) => ({ name, paid: false }));
    const split = {
      id: `split-${Date.now()}`,
      title: title.trim(),
      total: amount,
      participants: splitMath(amount, participants),
      created_at: new Date().toISOString(),
    };
    updateDemoState((s) => {
      s.splits = [split, ...(s.splits || [])];
    });
    refresh();
    setTitle("");
    setTotal("");
    setNamesInput("");
    setOpenSplitId(split.id);
    toast.success(
      `Tagihan dibagi: ${formatIDR(amount)} / ${names.length} orang = ${formatIDR(split.participants[0].share)} per orang.`,
    );
  };

  const togglePaid = (splitId, name) => {
    updateDemoState((s) => {
      const sp = (s.splits || []).find((x) => x.id === splitId);
      if (!sp) return;
      sp.participants = sp.participants.map((p) =>
        p.name === name ? { ...p, paid: !p.paid } : p,
      );
    });
    refresh();
  };

  const removeSplit = (splitId) => {
    updateDemoState((s) => {
      s.splits = (s.splits || []).filter((x) => x.id !== splitId);
    });
    refresh();
    toast.success("Split dihapus.");
  };

  const shareUrl = (splitId) =>
    `${window.location.origin}/app/wingman?split=${splitId}`;

  const openSplit = splits.find((s) => s.id === openSplitId) || null;

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-y-auto bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 pb-24 md:pb-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-fintech-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Social Finance
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Wingman Protocol
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bagi tagihan apa pun dalam hitungan detik — makan malam, trip,
            kos. SyncNol menghitung, membuat tautan &amp; QR, dan mencatat
            siapa yang sudah bayar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <Receipt size={16} className="text-fintech-primary" /> Split Baru
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Judul tagihan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mis. Makan malam Kemang"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-fintech-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Total tagihan (Rp)
              </label>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="124800"
                min="1"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-fintech-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Peserta (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                placeholder="Nabil, Najwa, Rafid, Raisa"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-fintech-primary transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-fintech-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Bagi Tagihan
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Pembagian rata ke bawah; sisa rupiah pembulatan dibebankan ke
            peserta pertama supaya totalnya tetap pas.
          </p>
        </div>

        {/* DAFTAR SPLIT */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {splits.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-fintech-primary/10 flex items-center justify-center text-fintech-primary mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                Belum ada tagihan yang dibagi
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Buat split pertamamu di formulir sebelah kiri. Contoh:
                makan malam Rp124.800 berempat — tiap orang Rp31.200.
              </p>
            </div>
          ) : (
            splits.map((s) => {
              const paidCount = s.participants.filter((p) => p.paid).length;
              const settled = paidCount === s.participants.length;
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {s.title}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 mt-1">
                        Total {formatIDR(s.total)} · {s.participants.length}{" "}
                        orang · {formatIDR(s.participants[0]?.share || 0)}/orang
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {settled && (
                        <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-1 rounded-lg">
                          LUNAS SEMUA
                        </span>
                      )}
                      <button
                        onClick={() => setOpenSplitId(openSplitId === s.id ? null : s.id)}
                        className="px-3 py-1.5 text-xs font-bold bg-fintech-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Share2 size={13} /> {openSplitId === s.id ? "Tutup" : "Bagikan"}
                      </button>
                      <button
                        onClick={() => removeSplit(s.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Hapus split"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {s.participants.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => togglePaid(s.id, p.name)}
                        className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle2
                            size={18}
                            className={p.paid ? "text-green-500" : "text-slate-300 dark:text-slate-600"}
                          />
                          {p.name}
                          {p.paid && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                              SUDAH BAYAR
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-black">{formatIDR(p.share)}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    {paidCount}/{s.participants.length} sudah bayar · ketuk nama
                    untuk menandai lunas.
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL BAGIKAN (QR) */}
      {openSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0B0F19] w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Bagikan — {openSplit.title}
              </h2>
              <button
                onClick={() => setOpenSplitId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                <QRCode value={shareUrl(openSplit.id)} size={180} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-all">
                {shareUrl(openSplit.id)}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(shareUrl(openSplit.id));
                  toast.success("Tautan split disalin.");
                }}
                className="w-full bg-fintech-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={16} /> Salin Tautan
              </button>
              <p className="text-xs text-slate-400 text-center">
                Tiap orang bayar {formatIDR(openSplit.participants[0]?.share || 0)}.
                Tautan ini membuka halaman Wingman (mode demo: data split
                tersimpan di browser pembuat).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
