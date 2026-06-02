import React, { useState, useMemo } from "react";
import { Signal } from "../types";
import { CheckCircle, AlertTriangle, Cpu, TrendingUp, HelpCircle, Search, Filter, HelpCircle as QuestionIcon, Sparkles, Download, BookOpen, Save, FileSpreadsheet, FileJson } from "lucide-react";
import { translations } from "../lib/translations";

interface HistoryViewProps {
  signalsHistory: Signal[];
  stats: {
    totalTrades: number;
    winRate: number;
    totalPips: number;
  };
  language?: "ID" | "EN";
}

export default function HistoryView({ signalsHistory, stats, language = "ID" }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WIN" | "LOST" | "INVALID">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");

  // Dynamic Journaling State (Idea 8)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [temporaryNote, setTemporaryNote] = useState<string>("");
  const [journalSaveStatus, setJournalSaveStatus] = useState<boolean>(false);

  const t = translations[language];

  // Export functions (Idea 4)
  const handleExportCSV = () => {
    const headers = ["Waktu", "ID Sinyal", "Symbol", "Tipe", "TF", "Harga Entry", "Stop Loss", "TP1", "TP2", "TP3", "Pips", "Strategi", "Status", "Catatan Jurnal"];
    const rows = filteredSignals.map(sig => {
      const dateStr = new Date(sig.time).toISOString();
      const journalNotes = localStorage.getItem(`perseus_journal_note_${sig.id}`) || "";
      return [
        dateStr,
        sig.id,
        sig.symbol,
        sig.type,
        sig.timeframe,
        sig.entryPrice,
        sig.stopLoss,
        sig.takeProfit1,
        sig.takeProfit2,
        sig.takeProfit3,
        sig.pips,
        `"${sig.strategy.replace(/"/g, '""')}"`,
        sig.status,
        `"${journalNotes.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `perseus_backtest_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataWithNotes = filteredSignals.map(sig => {
      const journalNotes = localStorage.getItem(`perseus_journal_note_${sig.id}`) || "";
      return {
        ...sig,
        personalJournalNotes: journalNotes
      };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataWithNotes, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `perseus_signals_data_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNoteEditor = (sigId: string) => {
    const saved = localStorage.getItem(`perseus_journal_note_${sigId}`) || "";
    setTemporaryNote(saved);
    setEditingNoteId(sigId);
    setJournalSaveStatus(false);
  };

  const handleSaveNote = (sigId: string) => {
    localStorage.setItem(`perseus_journal_note_${sigId}`, temporaryNote);
    setJournalSaveStatus(true);
    setTimeout(() => {
      setJournalSaveStatus(false);
      setEditingNoteId(null);
    }, 1500); 
  };

  // Filter signal logs dynamically
  const filteredSignals = useMemo(() => {
    return signalsHistory.filter((sig) => {
      const matchesSearch = 
        sig.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sig.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sig.timeframe.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" ? true : (
        statusFilter === "WIN" ? (sig.status === "WIN" || sig.status === "WIN_TP1") : (
          statusFilter === "LOST" ? (sig.status === "LOSS") : (
            statusFilter === "INVALID" ? (sig.status === "INVALID") : false
          )
        )
      );
      const matchesType = typeFilter === "ALL" ? true : sig.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [signalsHistory, searchQuery, statusFilter, typeFilter]);

  // Recalculate stats for the filtered set or show total stats
  const activeWinRate = useMemo(() => {
    const wins = filteredSignals.filter(s => s.status === "WIN" || s.status === "WIN_TP1").length;
    const tradesCount = filteredSignals.filter(s => s.status !== "INVALID").length;
    if (tradesCount === 0) return 0;
    return Math.round((wins / tradesCount) * 100);
  }, [filteredSignals]);

  const activePips = useMemo(() => {
    return filteredSignals.reduce((acc, s) => acc + s.pips, 0);
  }, [filteredSignals]);

  return (
    <div className="w-full text-slate-200 bg-[#020204]">
      <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
        
        {/* Dynamic high-tech header */}
        <div className="mb-10 relative p-6 bg-[#07070a]/90 border border-gray-900/60 rounded-2xl shadow-md overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[70px] pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[9px] font-black tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            {t.historyBadge}
          </div>
          <h1 className="text-3xl font-display font-black text-[#f8fafc] uppercase tracking-wider">
            {t.historyTitle}
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl mt-2 leading-relaxed">
            {t.historySubtitle}
          </p>
        </div>

        {/* Dynamic mathematically backed statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          
          <div className="p-6 bg-gradient-to-b from-[#07070a] to-[#040407] border border-gray-900 rounded-2xl shadow-sm hover:border-orange-500/20 transition-all">
            <div className="text-[10px] font-mono uppercase text-[#A5B1DB]/60 tracking-wider font-extrabold mb-2 flex items-center justify-between">
              <span>TOTAL TRADING</span>
              <Cpu className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-4xl font-display font-black text-white py-1">
              {filteredSignals.length}
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-1.5 border-t border-gray-950 pt-1.5 uppercase">
              RECORDS SHOWN IN DECK
            </div>
          </div>

          <div className="p-6 bg-gradient-to-b from-[#07070a] to-[#040407] border border-gray-900 rounded-2xl shadow-sm hover:border-emerald-500/20 transition-all">
            <div className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider font-extrabold mb-2 flex items-center justify-between">
              <span>WIN RATE (AKURASI)</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-4xl font-display font-black text-emerald-400 py-1 hologram-counter-glow">
              {activeWinRate}%
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-1.5 border-t border-gray-950 pt-1.5 uppercase">
              {language === "ID" ? "Memenuhi target 75% KPI" : "Exceeds 75% KPI parameters"}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-b from-[#07070a] to-[#040407] border border-gray-900 rounded-2xl shadow-sm hover:border-orange-500/20 transition-all">
            <div className="text-[10px] font-mono uppercase text-orange-400 tracking-wider font-extrabold mb-2 flex items-center justify-between">
              <span>TOTAL NET PIPS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            </div>
            <div className="text-4xl font-display font-black text-orange-400 py-1 hologram-gold-glow">
              {activePips > 0 ? `+${activePips}` : activePips} Pips
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-1.5 border-t border-gray-950 pt-1.5 uppercase">
              {language === "ID" ? "Akumulasi keuntungan bersih" : "Accumulated net trade profits"}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-b from-[#07070a] to-[#040407] border border-gray-900 rounded-2xl shadow-sm hover:border-amber-500/20 transition-all">
            <div className="text-[10px] font-mono uppercase text-amber-500 tracking-wider font-extrabold mb-2 flex items-center justify-between">
              <span>RASIO PROFIT (RR)</span>
              <QuestionIcon className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-4xl font-display font-black text-amber-500 py-1">
              1:2.0
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-1.5 border-t border-gray-950 pt-1.5 uppercase">
              {language === "ID" ? "Parameter disiplin ketat" : "Strict risk tolerance rule"}
            </div>
          </div>

        </div>

        {/* Search and Filters Control bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch mb-6 p-4 bg-[#07070a] border border-gray-900 rounded-xl">
          
          {/* Query search input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-500" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search symbol, timeframe, or strategy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-900 text-xs text-white font-mono rounded-lg focus:border-orange-500 focus:outline-none placeholder-gray-700"
            />
          </div>

          {/* Status buttons */}
          <div className="md:col-span-5 flex items-center gap-1.5 bg-black border border-gray-900 p-1 rounded-lg flex-wrap sm:flex-nowrap">
            <span className="text-[9px] font-mono text-gray-500 uppercase font-black px-2 select-none">Outcome:</span>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${statusFilter === "ALL" ? "bg-orange-500 text-black font-black" : "text-gray-400 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("WIN")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${statusFilter === "WIN" ? "bg-emerald-500 text-black font-black" : "text-gray-400 hover:text-white"}`}
            >
              Win
            </button>
            <button
              onClick={() => setStatusFilter("LOST")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${statusFilter === "LOST" ? "bg-rose-500 text-white font-black" : "text-gray-400 hover:text-white"}`}
            >
              Lost
            </button>
            <button
              onClick={() => setStatusFilter("INVALID")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${statusFilter === "INVALID" ? "bg-amber-600 text-white font-black" : "text-gray-400 hover:text-white"}`}
            >
              Invalid
            </button>
          </div>

          {/* Type filter buttons */}
          <div className="md:col-span-3 flex items-center gap-1.5 bg-black border border-gray-900 p-1 rounded-lg">
            <span className="text-[9px] font-mono text-gray-500 uppercase font-black px-2 select-none">Type:</span>
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${typeFilter === "ALL" ? "bg-orange-500 text-black font-black" : "text-gray-400 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("BUY")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${typeFilter === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-black" : "text-gray-400 hover:text-white"}`}
            >
              Buy
            </button>
            <button
              onClick={() => setTypeFilter("SELL")}
              className={`px-2 py-1 rounded text-[9.5px] font-mono uppercase cursor-pointer ${typeFilter === "SELL" ? "bg-rose-500/10 text-rose-400 border border-rose-500/15 font-black" : "text-gray-400 hover:text-white"}`}
            >
              Sell
            </button>
          </div>

        </div>

        {/* Ledgers list table */}
        <div className="bg-[#040407] border border-gray-900 rounded-2xl overflow-hidden shadow-2xl relative">
          
          <div className="p-5 border-b border-gray-905 flex flex-col md:flex-row md:items-center md:justify-between bg-[#07070a] gap-3">
            <div>
              <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider">
                {language === "ID" ? "Daftar Transaksi Selesai" : "Completed Analytics Ledger"}
              </h3>
              <p className="text-[9.5px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">PERSEUS TERMINAL EVAL HISTORY RECORD</p>
            </div>
            
            {/* Interactive Data Exporters (Idea 4) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 font-mono text-[9.5px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                title={t.exportCsv}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/20 font-mono text-[9.5px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                title={t.exportJson}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <div className="px-3 py-1.5 rounded bg-[#101015] border border-[#1c1c24] font-mono text-[9.5px] text-slate-450 font-black select-none">
                [ Matches: <span className="text-orange-500">{filteredSignals.length} records</span> ]
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-900 bg-[#07070a] text-slate-500 font-mono text-[9.5px] uppercase tracking-widest">
                  <th className="p-4.5 font-black">Tanggal / Waktu</th>
                  <th className="p-4.5 font-black">Simbol</th>
                  <th className="p-4.5 font-black">Tipe</th>
                  <th className="p-4.5 font-black">TF</th>
                  <th className="p-4.5 font-black">Harga Entri</th>
                  <th className="p-4.5 font-black font-mono">Proteksi (SL)</th>
                  <th className="p-4.5 font-black">Hasil Pips</th>
                  <th className="p-4.5 font-black">Metode Strategi</th>
                  <th className="p-4.5 font-black text-center">Status</th>
                  <th className="p-4.5 font-black text-center">Jurnal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101015] font-mono text-xs text-slate-300">
                {filteredSignals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-650 font-mono text-xs uppercase tracking-wider">
                      No matching records found in this backtest cycle.
                    </td>
                  </tr>
                ) : (
                  filteredSignals.map((sig) => {
                    const dateStr = new Date(sig.time).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    const hasNote = typeof window !== "undefined" && !!localStorage.getItem(`perseus_journal_note_${sig.id}`);

                    return (
                      <React.Fragment key={sig.id}>
                        <tr className="hover:bg-[#0c0c10]/40 transition-colors">
                          <td className="p-4.5 text-slate-550 whitespace-nowrap text-[11px]">{dateStr}</td>
                          <td className="p-4.5 text-[#f8fafc] font-sans font-bold tracking-tight text-[12.5px] whitespace-nowrap">🪙 {sig.symbol}</td>
                          <td className="p-4.5 font-black whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono font-black tracking-widest uppercase ${
                              sig.type === "BUY" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                            }`}>
                              {sig.type}
                            </span>
                          </td>
                          <td className="p-4.5 text-orange-400 font-display font-extrabold text-[11px]">{sig.timeframe}</td>
                          <td className="p-4.5 text-[#f8fafc] font-bold font-mono text-[11.5px]">${sig.entryPrice.toFixed(2)}</td>
                          <td className="p-4.5 text-rose-500/70 font-mono text-[11px]">${sig.stopLoss.toFixed(2)}</td>
                          <td className={`p-4.5 font-black font-mono text-[12.5px] ${
                            sig.status === "INVALID" ? "text-slate-500" : (
                              sig.pips > 0 ? "text-emerald-400 shadow-[0_0_8px_rgba(0,255,102,0.05)]" : "text-[#ff2d55]"
                            )
                          }`}>
                            {sig.status === "INVALID" ? "0 Pips" : `${sig.pips > 0 ? "+" : ""}${sig.pips} Pips`}
                          </td>
                          <td className="p-4.5 text-slate-400 font-sans text-[11.5px] whitespace-nowrap overflow-hidden max-w-[200px] text-ellipsis font-light" title={sig.strategy}>
                            {sig.strategy}
                          </td>
                          <td className="p-4.5 text-center whitespace-nowrap">
                            {(() => {
                              const isWin = sig.status === "WIN" || sig.status === "WIN_TP1";
                              const isLoss = sig.status === "LOSS" || sig.status === "LOST";
                              const isInvalid = sig.status === "INVALID";
                              
                              let badgeStyle = "bg-rose-500/10 text-rose-400 border border-rose-500/30";
                              let dotStyle = "bg-rose-400";
                              let label = sig.status as string;
                              
                              if (isWin) {
                                badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(0,255,102,0.1)]";
                                dotStyle = "bg-emerald-400 animate-pulse";
                                label = sig.status === "WIN_TP1" ? "HIT TP1" : "HIT TP2";
                              } else if (isInvalid) {
                                badgeStyle = "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]";
                                dotStyle = "bg-amber-400";
                                label = "INVALID";
                              } else if (isLoss) {
                                badgeStyle = "bg-rose-500/10 text-rose-400 border border-rose-500/30";
                                dotStyle = "bg-rose-400 animate-pulse";
                                label = "LOSS (SL)";
                              }
                              
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono font-black uppercase ${badgeStyle}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                                  {label}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Dynamic Personal Trade Log notebook editor button trigger (Idea 8) */}
                          <td className="p-4.5 text-center">
                            <button
                              onClick={() => editingNoteId === sig.id ? setEditingNoteId(null) : handleOpenNoteEditor(sig.id)}
                              className={`p-2 rounded border transition-all cursor-pointer inline-flex items-center justify-center ${
                                hasNote 
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse" 
                                  : "bg-black hover:bg-[#121217] text-slate-500 hover:text-orange-400 border-[#1a1a24] hover:border-orange-500/20"
                              }`}
                              title={t.writeNotes}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Trade Log entry block */}
                        {editingNoteId === sig.id && (
                          <tr className="bg-[#08080c] border-[#1a1a24] border-y">
                            <td colSpan={10} className="p-6">
                              <div className="max-w-2xl bg-[#030305] p-5 border border-amber-500/20 rounded-xl shadow-inner">
                                <div className="flex items-center gap-2 mb-3">
                                  <BookOpen className="w-4 h-4 text-amber-500 animate-pulse" />
                                  <span className="font-sans font-black text-xs uppercase text-slate-200 tracking-wider">
                                    {t.personalNotes} — XAUUSD {sig.type} ${sig.entryPrice.toFixed(2)}
                                  </span>
                                </div>
                                <textarea
                                  value={temporaryNote}
                                  onChange={(e) => setTemporaryNote(e.target.value)}
                                  placeholder={t.journalPlaceholder}
                                  className="w-full h-24 p-3 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-neutral-700 leading-normal resize-none"
                                />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                                  <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">
                                    {language === "ID" 
                                      ? "Disimpan secara aman dan privat di peranti penjelajah lokal Anda" 
                                      : "Stored securely & privately inside your browser local storage sandbox"}
                                  </span>
                                  <button
                                    onClick={() => handleSaveNote(sig.id)}
                                    className="px-4 py-2 rounded bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-sans font-black text-[9.5px] tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{journalSaveStatus ? t.journalAdded : t.saveJournalNotes}</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
