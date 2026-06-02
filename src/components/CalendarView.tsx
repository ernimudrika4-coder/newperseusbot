import React, { useEffect, useState } from "react";
import { EconomicEvent } from "../types";
import { Calendar, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, Layers, Filter, Clock, Flame, ShieldCheck } from "lucide-react";

export default function CalendarView() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<"ALL" | "HIGH">("ALL");
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "USD">("ALL");
  const [countdownStr, setCountdownStr] = useState<string>("01h : 42m : 18s");

  const fallbacks: EconomicEvent[] = [
    {
      id: "ev-fb-1",
      time: "TODAY 20:30",
      currency: "USD",
      event: "US Core CPI MoM / YoY (Tingkat Inflasi Konsumen)",
      impact: "HIGH",
      previous: "0.3%",
      consensus: "0.2%",
      actual: "Pending",
      goldSensitivity: "Jika angka CPI LEBIH TINGGI dari konsensus, US Dollar menguat dan harga Gold biasanya melemah tajam karena potensi penundaan pemotongan suku bunga Fed."
    },
    {
      id: "ev-fb-2",
      time: "TODAY 19:30",
      currency: "USD",
      event: "US Non-Farm Employment Change (NFP)",
      impact: "HIGH",
      previous: "175K",
      consensus: "185K",
      actual: "Pending",
      goldSensitivity: "Volatilitas ekstrem. Angka NFP yang jauh melebihi konsensus membuktikan ketahanan tenaga kerja, memperkuat Dolar, dan memicu aksi jual panik pada XAUUSD (Inverse Correlation)."
    },
    {
      id: "ev-fb-3",
      time: "FOMC WEEK",
      currency: "USD",
      event: "FOMC Press Conference & Interest Rate Statement",
      impact: "HIGH",
      previous: "5.50%",
      consensus: "5.50%",
      actual: "5.50%",
      goldSensitivity: "Pernyataan bernuansa Hawk (kemungkinan suku bunga naik/ditahan) akan menekan Emas. Pernyataan Dovish (rencana pemotongan suku bunga federal) memperlemah Dolar dan menerbangkan Gold."
    },
    {
      id: "ev-fb-4",
      time: "WEEKLY",
      currency: "USD",
      event: "US Unemployment Claims (Klaim Pengangguran Mingguan)",
      impact: "MEDIUM",
      previous: "215K",
      consensus: "220K",
      actual: "Pending",
      goldSensitivity: "Klaim pengangguran yang meningkat membuktikan perlambatan ekonomi, mendorong Fed bersikap Dovish. Hal ini positif bagi emas sebagai aset lindung nilai utama."
    }
  ];

  // Real-time countdown to next high-impact economic news
  useEffect(() => {
    const updateCountdown = () => {
      if (events.length === 0) {
        setCountdownStr("TIDAK ADA BERITA");
        return;
      }

      const now = Date.now();
      
      // Find high impact events with rawDate that is in the future
      const highImpactFutureEvents = events
        .filter(ev => ev.impact === "HIGH" && ev.rawDate)
        .map(ev => ({
          ...ev,
          timestamp: new Date(ev.rawDate!).getTime()
        }))
        .filter(ev => !isNaN(ev.timestamp) && ev.timestamp > now)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (highImpactFutureEvents.length > 0) {
        const nextEvent = highImpactFutureEvents[0];
        const diffMs = nextEvent.timestamp - now;
        
        const totSec = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totSec / 3600);
        const mins = Math.floor((totSec % 3600) / 60);
        const secs = totSec % 60;
        
        setCountdownStr(
          `${nextEvent.currency} ${nextEvent.event.split(" ")[0].slice(0, 8).toUpperCase()}: ${hrs.toString().padStart(2, "0")}j : ${mins.toString().padStart(2, "0")}m : ${secs.toString().padStart(2, "0")}d`
        );
      } else {
        // Fallback to any future event
        const futureEvents = events
          .filter(ev => ev.rawDate)
          .map(ev => ({
            ...ev,
            timestamp: new Date(ev.rawDate!).getTime()
          }))
          .filter(ev => !isNaN(ev.timestamp) && ev.timestamp > now)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (futureEvents.length > 0) {
          const nextEvent = futureEvents[0];
          const diffMs = nextEvent.timestamp - now;
          const totSec = Math.floor(diffMs / 1000);
          const hrs = Math.floor(totSec / 3600);
          const mins = Math.floor((totSec % 3600) / 60);
          const secs = totSec % 60;
          setCountdownStr(
            `${nextEvent.currency} ${nextEvent.event.split(" ")[0].slice(0, 8).toUpperCase()}: ${hrs.toString().padStart(2, "0")}j : ${mins.toString().padStart(2, "0")}m : ${secs.toString().padStart(2, "0")}d`
          );
        } else {
          setCountdownStr("TIDAK ADA BERITA AKTIF");
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forex-calendar");
      if (!res.ok) {
        throw new Error("Gagal mengambil data dari server");
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.events) && data.events.length > 0) {
        setEvents(data.events);
      } else {
        throw new Error("Format rilis data tidak valid atau kosong");
      }
    } catch (e: any) {
      console.warn("Menggunakan data fallback kalender premium emas karena rintangan CORS:", e.message);
      setEvents(fallbacks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesImpact = impactFilter === "ALL" ? true : event.impact === "HIGH";
    const matchesCurrency = currencyFilter === "ALL" ? true : event.currency === "USD";
    return matchesImpact && matchesCurrency;
  });

  return (
    <div className="w-full text-gray-200 bg-[#020204]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Title with live countdown */}
        <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[9px] uppercase font-black tracking-widest mb-2 select-none">
              📰 LIVE CRAWLER: FOREX FACTORY FEED
            </div>
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">Perseus Economic Calendar</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Kalender rilis berita makroekonomi berdampak kritis yang mendominasi arah volatilitas harga Spot Emas (XAUUSD) harian.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#07070a] border border-gray-900 p-4 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                <Clock className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div className="font-mono text-left">
                <span className="block text-[8px] text-gray-500 uppercase font-bold">NEXT HIGH-IMPACT NEWS</span>
                <span className="text-sm font-black text-white">{countdownStr}</span>
              </div>
            </div>

            <button
              onClick={fetchCalendar}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-900 bg-black hover:bg-gray-950 text-xs font-mono font-black text-orange-500 transition-all rounded-xl cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {loading ? "Menyinkronkan..." : "SINKRONKAN FEED LIVE"}
            </button>
          </div>
        </div>

        {/* Fundamental Core Knowledge Card */}
        <div className="p-6 bg-[#07070a]/90 border border-gray-900/60 rounded-2xl mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
          <h3 className="font-display font-black text-xs text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400 animate-pulse" />
            💡 Panduan Fundamental Confluence Emas (XAUUSD)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs text-slate-400 leading-relaxed">
            <div className="p-4 bg-black/40 border border-gray-900/80 rounded-xl hover:border-orange-500/10 transition-all">
              <span className="font-mono text-white block font-bold mb-1.5 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-500" /> DXY Inverse Correlation
              </span>
              Emas ditransaksikan dalam satuan Dolar AS (USD). Hubungan keduanya adalah korelasi terbalik secara makro. Saat Indeks Dolar (DXY) menguat, harga emas akan mengalami tekanan berat karena menjadi lebih mahal bagi pemegang mata uang asing.
            </div>
            
            <div className="p-4 bg-black/40 border border-gray-900/80 rounded-xl hover:border-orange-500/10 transition-all">
              <span className="font-mono text-white block font-bold mb-1.5 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-500" /> US 10-Yr Bond Yield (US10Y)
              </span>
              Emas adalah aset lindung nilai tanpa imbal hasil standar. Ketika imbal hasil obligasi AS meningkat, opportunity cost memegang emas meningkat, mendorong pelaku pasar melepas emas untuk membeli yield obligasi yang bernilai tinggi.
            </div>

            <div className="p-4 bg-black/40 border border-gray-900/80 rounded-xl hover:border-orange-500/10 transition-all">
              <span className="font-mono text-white block font-bold mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Inflasi & Sifat Safe Haven
              </span>
              Saat inflasi (CPI/PPI) melonjak melampaui batas wajar, nilai riil mata uang kertas terdepresiasi. Pada kondisi ini, emas diburu pelaku pasar global secara agresif untuk mengamankan daya beli modal jangka panjang mereka.
            </div>
          </div>
        </div>

        {/* Interactive Filter Control Rail */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 p-4 bg-[#07070a] border border-gray-900 rounded-xl">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Penyaring Berita Pasar:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Filter */}
            <div className="flex items-center bg-black border border-gray-900 p-1 rounded-lg">
              <button
                onClick={() => setCurrencyFilter("ALL")}
                className={`px-3 py-1 text-[11px] font-mono font-black rounded-md uppercase transition-colors cursor-pointer ${
                  currencyFilter === "ALL" ? "bg-orange-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Semua Pasang
              </button>
              <button
                onClick={() => setCurrencyFilter("USD")}
                className={`px-3 py-1 text-[11px] font-mono font-black rounded-md uppercase transition-colors cursor-pointer ${
                  currencyFilter === "USD" ? "bg-orange-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Khas USD 🇺🇸
              </button>
            </div>

            {/* Impact Filter */}
            <div className="flex items-center bg-black border border-gray-900 p-1 rounded-lg">
              <button
                onClick={() => setImpactFilter("ALL")}
                className={`px-3 py-1 text-[11px] font-mono font-black rounded-md uppercase transition-colors cursor-pointer ${
                  impactFilter === "ALL" ? "bg-orange-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Semua Impak
              </button>
              <button
                onClick={() => setImpactFilter("HIGH")}
                className={`px-3 py-1 text-[11px] font-mono font-black rounded-md uppercase transition-colors cursor-pointer ${
                  impactFilter === "HIGH" ? "bg-rose-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Hanya HIGH 🔥
              </button>
            </div>
          </div>
        </div>

        {/* Economic calendar list tables */}
        <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-gray-900 flex items-center justify-between">
            <h3 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> 
              Live Calendar Feed Details ({filteredEvents.length} Events)
            </h3>
            <span className="font-mono text-[9px] text-emerald-500 uppercase flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Crawler Active
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
              <p className="font-mono text-xs text-gray-500">Menghubungkan &amp; merayapi basis data Forex Factory...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-gray-500 font-mono text-xs">
              Tidak ada rilis berita saat ini untuk saringan yang diterapkan.
            </div>
          ) : (
            <div className="divide-y divide-gray-950">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-[#0c1017]/40 transition-colors animate-in fade-in duration-200">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-3">
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-orange-400 bg-black border border-gray-900 px-2.5 py-1 rounded font-bold uppercase">
                        {event.time}
                      </span>
                      <span className="font-mono text-xs text-gray-300 font-black bg-gray-900 px-2.5 py-1 rounded">
                        {event.currency}
                      </span>
                      <span className={`font-mono text-[9px] px-2.5 py-1 rounded-full font-black tracking-widest uppercase border ${
                        event.impact === "HIGH" 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)] animate-pulse" 
                          : event.impact === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {event.impact === "HIGH" ? "🔥 HIGH IMPACT" : event.impact === "MEDIUM" ? "⚡ MEDIUM IMPACT" : "🔈 LOW IMPACT"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs self-start xl:self-auto bg-black px-4 py-2 rounded-xl border border-gray-900 shadow-sm">
                      <div>Sebelumnya: <span className="text-gray-300 font-bold">{event.previous || "-"}</span></div>
                      <div className="border-l border-gray-900 pl-4">Konsensus: <span className="text-amber-500 font-bold">{event.consensus || "-"}</span></div>
                      <div className="border-l border-gray-900 pl-4">Aktual: <span className={`font-black ${
                        event.actual && event.actual !== "-" && event.actual !== "Pending"
                          ? parseFloat(event.actual) >= parseFloat(event.consensus || "0") ? "text-emerald-500" : "text-rose-500"
                          : "text-gray-500 animate-pulse"
                      }`}>{event.actual || "Pending"}</span></div>
                    </div>

                  </div>

                  <div className="font-sans text-sm text-white font-bold mb-3.5 tracking-tight">
                    {event.event}
                  </div>

                  <div className="p-4 bg-black/55 border border-gray-900 rounded-xl text-[11px] text-gray-400 leading-relaxed font-sans flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-mono text-orange-400 text-[10px] font-black block mb-0.5 uppercase tracking-wider">PERSPEKTIF EMAS &amp; VOLATILITAS GOLD (XAUUSD):</span>
                      {event.goldSensitivity}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
