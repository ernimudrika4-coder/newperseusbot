import React from "react";
import { ShieldCheck, ArrowLeft, ShieldAlert } from "lucide-react";

export default function TermsOfServiceView({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full text-slate-100 max-w-4xl mx-auto px-4 py-12 animate-in fade-in zoom-in-95 duration-500">
      
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-amber-500 transition-colors uppercase"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Terminal
      </button>

      <div className="flex flex-col items-start justify-start mb-10">
        <span className="font-mono text-[9px] text-amber-500 uppercase font-black tracking-[0.2em] mb-2">DOKUMEN LEGAL RESMI</span>
        <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">Terms of Service & Disclaimer</h1>
        <p className="text-sm text-slate-400 mt-4 max-w-2xl">
          Ketentuan penggunaan layanan dan perjanjian risiko pengguna platform Perseus Terminal.
          Terakhir diperbarui: Juni 2026.
        </p>
      </div>

      <div className="space-y-8 bg-[#04060b]/80 border border-slate-800/80 rounded-2xl p-8 md:p-12">
        <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20 flex gap-4">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
          <div>
            <h3 className="font-sans font-black text-rose-400 text-sm uppercase mb-2">Peringatan Risiko Tinggi</h3>
            <p className="text-xs text-rose-300/80 leading-relaxed font-light">
              Trading Foreign Exchange (Forex), Cryptocurrency, dan Komoditas (seperti Emas/XAUUSD) dengan menggunakan leverage/margin membawa tingkat risiko yang sangat signifikan dan tingkat volatilitas tinggi yang mungkin tidak cocok untuk seluruh lapisan pemodal jangka pendek maupun panjang. Terdapat sebuah kemungkinan riil bahwa Anda dapat menderita kerugian dari sebagian atau memusnahkan seluruh modal awal Anda, dan oleh karena itu Anda tidak dianjurkan untuk menginvestasikan uang yang Anda tidak rela kehilangannya (uang panas).
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-sans font-black text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            1. Sifat Penggunaan Data & Sinyal
          </h2>
          <div className="text-sm text-slate-400 font-light leading-relaxed space-y-3">
            <p>
              Semua konten yang disediakan oleh Perseus Terminal, termasuk namun tidak terbatas pada, indikator analisis teknikal, peta pergerakan instrumen, alert harga, algoritma kalender sentimen, dan output "sinyal" yang dilacak, dirancang secara mutlak untuk tujuan <strong>edukasi, perangkat simulasi riset pasar, dan informasi komputasi mandiri</strong>.
            </p>
            <p>
              Tidak ada bagian dari data yang dideskripsikan sebagai saran investasi, instruksi pengelolaan dana asuransi lindung nilai (hedging), maupun anjuran perantara jual-beli aset yang teregulasi oleh otoritas jasa keuangan. Kami tidak menyediakan perantara broker.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-sans font-black text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            2. Keabsahan Algoritma & Ketidakpastian Pasar
          </h2>
          <div className="text-sm text-slate-400 font-light leading-relaxed space-y-3">
            <p>
              Engine perhitungan probabilitas order block (OB), heat maps likuiditas, pola candlestick (seperti Engulfing, Dojo), divergence indikator, dll, beroperasi secara matematis atas pergerakan pasang-surut yang ada. Perseus <strong>tidak menjamin probabilitas akurasi tebakan sebesar 100%</strong> dan dibebaskan dari tuntutan bentuk deviasi (kesalahan membaca API broker/data feed/TradingView keterlambatan).
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-sans font-black text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            3. Tanggung Jawab Kerugian Finansial (Release of Liability)
          </h2>
          <div className="text-sm text-slate-400 font-light leading-relaxed space-y-3">
            <p>
              Dengan ini Anda, klien akhir, setuju untuk secara penuh menyerap seluruh risiko transaksi di MetaTrader klien pribadi. Segala bentuk keterpaduan (MT5 Auto-Bridge) jika dijalankan secara penuh (otomatisasi klik Order) adalah pertanggungjawaban risiko langsung oleh klien, dengan slip toleransi yang berjalan. Perseus, pemegang saham, pengembang, dan berafiliasi tidak menerima pertanggungjawaban ganti rugi apa pun dari efek volatilitas market.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
