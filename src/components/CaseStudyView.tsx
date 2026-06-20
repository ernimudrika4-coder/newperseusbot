import React from "react";
import { ArrowRight, TrendingDown, TrendingUp, Calendar, Zap, ShieldCheck } from "lucide-react";

interface CaseStudyViewProps {
  currentXau: number;
}

export default function CaseStudyView({ currentXau }: CaseStudyViewProps) {
  const caseStudies = [
    {
      id: "cs-1",
      pair: "BTCUSDT",
      date: "13 Juni 2026",
      signal: "SELL",
      result: "+420 Points",
      entry: 69400,
      exit: 68980,
      description: "AI mendeteksi anomali volume Institusional dan pelemahan momentum (Bearish Divergence) di area resisten kuat M15.",
      image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9Ijk5OSIgaGVpZ2h0PSI5OTkiIGZpbGw9IiMwNDBlMTciLz48cGF0aCBkPSJNIDUwIDIwMCBMIDEwMCAxODAgTCAxNTAgMTkwIEwgMjAwIDE0MCBMIDI1MCAxNjAgTCAzMDAgODAgTCAzNTAgMTIwIiBzdHJva2U9IiNmMDRlNWEiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    },
    {
      id: "cs-2",
      pair: "XAUUSD",
      date: "10 Juni 2026",
      signal: "BUY",
      result: "+185 Pips",
      entry: 2314.50,
      exit: 2333.00,
      description: "Agregasi heatmap konfirmasi setup pembalikan dari Support Daily dengan sentimen retail di 80% penjual (Indikator Reversal).",
      image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9Ijk5OSIgaGVpZ2h0PSI5OTkiIGZpbGw9IiMwNDBlMTciLz48cGF0aCBkPSJNIDUwIDgwIEwgMTAwIDEwMCBMIDE1MCA2MCBMIDIwMCAxMjAgTCAyNTAgMTAwIEwgMzAwIDE4MCBMIDM1MCAxNDAiIHN0cm9rZT0iIzAyZTY4NSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PC9zdmc+",
    },
    {
      id: "cs-3",
      pair: "EURUSD",
      date: "08 Juni 2026",
      signal: "SELL",
      result: "+65 Pips",
      entry: 1.0920,
      exit: 1.0855,
      description: "Breakout mikro struktur di sesi London. Perseus engine mendeteksi order book sell wall besar di level psikologis.",
      image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9Ijk5OSIgaGVpZ2h0PSI5OTkiIGZpbGw9IiMwNDBlMTciLz48cGF0aCBkPSJNIDUwIDE1MCBMIDEwMCAxNjAgTCAxNTAgMTQwIEwgMjAwIDE4MCBMIDI1MCAxNjAgTCAzMDAgMjIwIEwgMzUwIDIxMCIgc3Ryb2tlPSIjZjA0ZTVhIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    },
    {
      id: "cs-4",
      pair: "GBPUSD",
      date: "05 Juni 2026",
      signal: "BUY",
      result: "+88 Pips",
      entry: 1.2640,
      exit: 1.2728,
      description: "Data NFP yang menyimpang menciptakan fake-out. Perseus Engine memindai liquidity grab, memunculkan Strong Buy signal tepat setelah spike awal.",
      image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9Ijk5OSIgaGVpZ2h0PSI5OTkiIGZpbGw9IiMwNDBlMTciLz48cGF0aCBkPSJNIDUwIDE4MCBMIDEwMCAyMTAgTCAxNTAgMTcwIEwgMjAwIDYwIEwgMjUwIDgwIEwgMzAwIDQwIEwgMzUwIDUwIiBzdHJva2U9IiMwMmU2ODUiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
    },
    {
      id: "cs-5",
      pair: "XAGUSD",
      date: "01 Juni 2026",
      signal: "BUY",
      result: "+125 Pips",
      entry: 30.15,
      exit: 31.40,
      description: "Momentum korelasi silver terhadap pergerakan rotasi XAU. Perseus menangkap fase akumulasi di Support kunci selama 4 jam.",
      image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCI+PHJlY3Qgd2lkdGg9Ijk5OSIgaGVpZ2h0PSI5OTkiIGZpbGw9IiMwNDBlMTciLz48cGF0aCBkPSJNIDUwIDEyMCBMIDEwMCAxNDAgTCAxNTAgMTAwIEwgMjAwIDEyMCBMIDI1MCA4MCBMIDMwMCA1MCBMIDM1MCA3MCIgc3Ryb2tlPSIjMDJlNjg1IiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
    }
  ];

  return (
    <div className="w-full text-slate-100 max-w-7xl mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col items-center justify-center text-center mb-10 mt-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />
        <span className="font-mono text-[9px] text-amber-500 uppercase font-black tracking-[0.2em] mb-2">BUKTI PRODUK & SEJARAH SINYAL</span>
        <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">Market Analysis Archive</h1>
        <p className="text-sm text-slate-400 mt-4 max-w-2xl mx-auto">
          Arsip hasil eksekusi Perseus Engine dari pemindaian market structure, liquidity map, volatility regime, dan confluence engine di pasar nyata. 5-10 contoh transparansi performa historis, bukan janji pamer profit semata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {caseStudies.map((cs) => (
          <div key={cs.id} className="bg-[#070a13]/80 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors custom-shadow-lg relative group">
            
            {/* Visual Header Image representation */}
            <div className="w-full h-36 bg-[#04060b] relative overflow-hidden flex items-center justify-center border-b border-slate-800/60 p-4">
               <img src={cs.image} alt={`${cs.pair} Chart`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#070a13]/90 to-transparent pointer-events-none" />
               <div className="absolute bottom-3 left-4 flex gap-2">
                 <span className="px-2 py-1 rounded bg-[#0b0f19] border border-slate-700 text-xs font-mono font-bold">{cs.pair}</span>
                 <span className={`px-2 py-1 rounded border text-[10px] font-black tracking-widest flex items-center ${cs.signal === "BUY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                   {cs.signal === "BUY" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                   {cs.signal}
                 </span>
               </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {cs.date}
                </div>
                <div className="text-emerald-400 font-sans font-black bg-emerald-500/10 px-2 py-0.5 rounded text-sm">
                  {cs.result}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-mono">
                <div className="bg-[#0b0f19] rounded p-2 border border-slate-800/60">
                  <span className="text-slate-500 block mb-0.5">Entry</span>
                  <span className="text-slate-100 font-bold">{cs.entry}</span>
                </div>
                <div className="bg-[#0b0f19] rounded p-2 border border-slate-800/60">
                  <span className="text-slate-500 block mb-0.5">Exit</span>
                  <span className="text-slate-100 font-bold">{cs.exit}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans border-t border-slate-800/60 pt-3">
                {cs.description}
              </p>
            </div>
            
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

    </div>
  );
}
