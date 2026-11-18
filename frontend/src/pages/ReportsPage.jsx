import { useState } from "react";
import { FileText, Download, CheckCircle2, ChevronRight } from "lucide-react";
import useAppStore from "../store/useAppStore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const { summary, transactions } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [config, setConfig] = useState({
    month: new Date().toISOString().split("T")[0].slice(0, 7),
    includeLedger: true,
    includeCharts: true,
    aiOpinion: true,
  });

  const handleGenerate = () => {
    setLoading(true);
    setSuccess(false);

    // Give UI a moment to show loading state
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // --- 1. Header ---
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42);
        doc.text("Laporan Ruang Direksi", 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text(`Periode: ${config.month}`, 14, 28);
        doc.text(`Nama: ${summary.nama || "Agent"}`, 14, 34);

        // --- 2. Executive Summary ---
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text("Ringkasan Eksekutif", 14, 45);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);

        doc.text(`Kekayaan Bersih: ${formatIDR(summary.net_worth)}`, 14, 53);
        doc.text(`Total Pemasukan: ${formatIDR(summary.pemasukan)}`, 14, 60);
        doc.text(`Total Pengeluaran: ${formatIDR(summary.pengeluaran)}`, 14, 67);
        doc.text(`Total Utang: ${formatIDR(summary.total_utang)}`, 14, 74);

        let finalY = 85;

        // --- 3. AI Opinion ---
        if (config.aiOpinion) {
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text("Opini J.A.R.V.I.S", 14, finalY);
          
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          const opinionText = summary.pengeluaran > summary.pemasukan 
            ? "Peringatan kritis: Pengeluaran bulan ini melebihi pemasukan. Kurangi gaya hidup berlebih dan fokus bayar utang!" 
            : "Kondisi stabil. Namun jangan lengah, tetap pertahankan rasio tabungan di atas 20%.";
          
          const splitOpinion = doc.splitTextToSize(opinionText, 180);
          doc.text(splitOpinion, 14, finalY + 8);
          finalY += 10 + (splitOpinion.length * 5);
        }

        // --- 4. Ledger / Transactions ---
        if (config.includeLedger && transactions && transactions.length > 0) {
          finalY += 5;
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text("Buku Besar Transaksi", 14, finalY);

          const tableData = transactions.map(t => [
            t.jenis || t.jenis_transaksi || "-",
            t.kategori || "-",
            formatIDR(t.nominal || 0),
            t.keterangan || "-"
          ]);

          autoTable(doc, {
            startY: finalY + 5,
            head: [['Jenis', 'Kategori', 'Nominal', 'Keterangan']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233] },
          });
        } else if (config.includeLedger) {
          finalY += 5;
          doc.setFontSize(14);
          doc.text("Buku Besar Transaksi", 14, finalY);
          doc.setFontSize(10);
          doc.text("Tidak ada data transaksi.", 14, finalY + 8);
        }

        // Final PDF Download
        doc.save(`Laporan_SyncNol_${config.month}.pdf`);
        setSuccess(true);
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const cardClass =
    "bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm";

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-y-auto bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-fintech-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Ekspor
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Laporan Ruang Direksi
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
        {/* CONFIGURATION */}
        <div className={`${cardClass} lg:col-span-5 flex flex-col gap-6`}>
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pengaturan Dokumen
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atur parameter laporan PDF formal Anda.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Periode Laporan
              </label>
              <input
                type="month"
                value={config.month}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, month: e.target.value }))
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-fintech-primary transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                Modul yang Disertakan
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={config.includeLedger}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      includeLedger: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-300 text-fintech-primary focus:ring-fintech-primary"
                />
                <span className="text-sm font-semibold">
                  Buku Besar Transaksi Lengkap
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={config.includeCharts}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      includeCharts: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-300 text-fintech-primary focus:ring-fintech-primary"
                />
                <span className="text-sm font-semibold">
                  Analitik Visual & Grafik
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={config.aiOpinion}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, aiOpinion: e.target.checked }))
                  }
                  className="w-5 h-5 rounded border-slate-300 text-fintech-primary focus:ring-fintech-primary"
                />
                <div>
                  <span className="text-sm font-semibold flex items-center gap-2">
                    Surat Opini J.A.R.V.I.S{" "}
                    <span className="bg-fintech-primary/10 text-fintech-primary text-[10px] px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                success
                  ? "bg-green-500 text-white"
                  : "bg-fintech-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 size={18} /> Siap Diunduh
                </>
              ) : (
                <>
                  <Download size={18} /> Buat Laporan PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* PREVIEW — ringkasan langsung dari data (bukan mock mati) */}
        <div className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full max-w-md bg-white dark:bg-gray-100 rounded border border-slate-200 shadow-2xl overflow-hidden relative">
            <div className="w-full bg-slate-900 flex flex-col justify-end p-8 text-white">
              <div className="text-2xl font-serif">SyncNol Financial</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
                Laporan {config.month}
              </div>
            </div>
            <div className="p-8 flex flex-col gap-4 text-slate-900">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 rounded p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Kekayaan Bersih</div>
                  <div className="font-black">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.net_worth || 0)}
                  </div>
                </div>
                <div className="bg-slate-100 rounded p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Utang</div>
                  <div className="font-black text-red-500">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.total_utang || 0)}
                  </div>
                </div>
                <div className="bg-slate-100 rounded p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pemasukan</div>
                  <div className="font-black text-green-600">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.pemasukan || 0)}
                  </div>
                </div>
                <div className="bg-slate-100 rounded p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pengeluaran</div>
                  <div className="font-black">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.pengeluaran || 0)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {transactions.length} transaksi di buku besar ·{" "}
                {config.includeLedger ? "buku besar disertakan" : "buku besar tidak disertakan"} ·{" "}
                {config.aiOpinion ? "opini J.A.R.V.I.S disertakan" : "tanpa opini AI"} ·{" "}
                {config.includeCharts ? "grafik disertakan" : "tanpa grafik"}.
              </div>
              <div className="text-xs text-slate-400">
                Pratinjau di atas memakai data yang sama dengan PDF yang akan
                diunduh — klik “Buat Laporan PDF” untuk mengunduhnya.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
