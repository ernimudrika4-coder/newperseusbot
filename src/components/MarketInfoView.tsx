import React, { useState, useEffect } from "react";
import { CorrelationPair } from "../types";
import { Scale, ArrowRight, Info, AlertTriangle, TrendingUp, TrendingDown, Gauge, Minus, Zap, Clock, Disc } from "lucide-react";
import { GoldVolatilityIndex, TechnicalScreener, AcousticAudioController, TradingSessions } from "./CoreAuxiliaryTools";

interface MarketInfoProps {
  currentXau: number;
  oscillatorState?: string;
}

export default function MarketInfoView({ currentXau, oscillatorState = "NEUTRAL" }: MarketInfoProps) {
  const [utcTime, setUtcTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTrendIcon = (state: string) => {
    const normState = state.toUpperCase();
    if (normState.includes("BULLISH") || normState.includes("STRENGTH")) {
      return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    }
    if (normState.includes("BEARISH") || normState.includes("REJECTION")) {
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    }
    if (normState.includes("OVERBOUGHT")) {
      return <Gauge className="w-5 h-5 text-amber-500" />;
    }
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getTrendDescription = (state: string) => {
    const normState = state.toUpperCase();
    if (normState.includes("BULLISH")) {
      return "Emas menunjukkan momentum naik yang kokoh di atas level support EMA50, mendukung probabilitas kelanjutan gerak ke atas secara kuat.";
    }
    if (normState.includes("BEARISH")) {
      return "Terdapat indikasi penolakan agresif pada resistance teratas candle harian. Disarankan waspada terhadap volatilitas koreksi ke bawah.";
    }
    if (normState.includes("OVERBOUGHT")) {
      return "Osilator mencapai zona jenuh beli relatif akibat percepatan harga tinggi. Harap perhatikan potensi konsolidasi sementara waktu.";
    }
    if (normState.includes("OVERSOLD")) {
      return "Kondisi jenuh jual ekstrem terdeteksi. Sinyal pembalikan arah atau pantulan teknis memiliki potensi tinggi untuk terbentuk kembali.";
    }
    return "Pasar berada dalam fase konsolidasi menyamping tanpa kepemimpinan tren yang kuat sebelum rilis sentimen arus makro utama.";
  };

  const baseGoldPrice = 2343.80;
  const delta = currentXau - baseGoldPrice;

  // Intermarket variables mapped dynamically via inverse and direct correlation coefficients
  const dxyPrice = (104.25 - delta * 0.03).toFixed(2);
  const dxyChange = (Number(dxyPrice) - 104.25) >= 0 ? `+${((Number(dxyPrice) - 104.25) / 104.25 * 100).toFixed(2)}%` : `${((Number(dxyPrice) - 104.25) / 104.25 * 100).toFixed(2)}%`;

  const us10yPrice = (4.432 - delta * 0.0012).toFixed(3);
  const us10yChange = (Number(us10yPrice) - 4.432) >= 0 ? `+${((Number(us10yPrice) - 4.432) / 4.432 * 100).toFixed(2)}%` : `${((Number(us10yPrice) - 4.432) / 4.432 * 100).toFixed(2)}%`;

  const xagusdPrice = (30.12 + delta * 0.012).toFixed(2);
  const xagusdChange = (Number(xagusdPrice) - 30.12) >= 0 ? `+${((Number(xagusdPrice) - 30.12) / 30.12 * 100).toFixed(2)}%` : `${((Number(xagusdPrice) - 30.12) / 30.12 * 100).toFixed(2)}%`;

  const usoilPrice = (78.35 + delta * 0.018).toFixed(2);
  const usoilChange = (Number(usoilPrice) - 78.35) >= 0 ? `+${((Number(usoilPrice) - 78.35) / 78.35 * 100).toFixed(2)}%` : `${((Number(usoilPrice) - 78.35) / 78.35 * 100).toFixed(2)}%`;

  const spxPrice = (5304.10 + delta * 0.72).toFixed(2);
  const spxChange = (Number(spxPrice) - 5304.10) >= 0 ? `+${((Number(spxPrice) - 5304.10) / 5304.10 * 100).toFixed(2)}%` : `${((Number(spxPrice) - 5304.10) / 5304.10 * 100).toFixed(2)}%`;

  const correlationPairs: CorrelationPair[] = [
    {
      symbol: "DXY",
      name: "US Dollar Index",
      price: dxyPrice,
      change: dxyChange,
      correlation: "SANGAT KUAT TERBALIK",
      description: "Emas ditransaksikan dalam USD. Penguatan Dolar AS secara langsung menekan pamor pembelian emas secara global.",
      isPositive: false
    },
    {
      symbol: "US10Y",
      name: "US 10-Yr Treasury Yield",
      price: `${us10yPrice}%`,
      change: us10yChange,
      correlation: "KUAT TERBALIK (INVERSE)",
      description: "Obligasi adalah alternatif investasi safe-haven berbunga. Kenaikan yield obligasi membujuk investor keluar dari emas.",
      isPositive: false
    },
    {
      symbol: "XAGUSD",
      name: "Silver Spot (Perak)",
      price: xagusdPrice,
      change: xagusdChange,
      correlation: "SANGAT SEARAH (DIRECT)",
      description: "Sebagai komoditas logam mulia berharga, Perak bergerak searah dengan pergerakan makro Emas.",
      isPositive: true
    },
    {
      symbol: "USOIL",
      name: "WTI Crude Oil (Minyak)",
      price: usoilPrice,
      change: usoilChange,
      correlation: "MODERAT SEARAH",
      description: "Kenaikan harga minyak memicu peningkatan inflasi industri global, menguntungkan emas sebagai lindung nilai inflasi.",
      isPositive: true
    },
    {
      symbol: "SPX",
      name: "S&P 500 Index (Saham AS)",
      price: Number(spxPrice).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      change: spxChange,
      correlation: "LEMAH TERBALIK",
      description: "Aktivitas pasar saham melambangkan sentimen risk-on. Penguatan bursa saham sesekali mengurangi gairah pelarian emas.",
      isPositive: false
    }
  ];

  // Gauge Angle Calculator (Degree range from -90 to 90 for half circle Gauge)
  const getSpeedometerAngle = (state: string) => {
    const norm = state.toUpperCase();
    if (norm.includes("BULLISH STRENGTH")) return 70;
    if (norm.includes("BULLISH")) return 45;
    if (norm.includes("OVERSOLD")) return 60; // oversold implies buy pantulan
    if (norm.includes("OVERBOUGHT")) return -60; // overbought implies potential sell
    if (norm.includes("BEARISH")) return -45;
    return 0; // Neutral centered
  };

  const getGaugeColor = (state: string) => {
    const norm = state.toUpperCase();
    if (norm.includes("BULLISH")) return "from-emerald-500 to-[#10b981]";
    if (norm.includes("BEARISH")) return "from-rose-500 to-[#ef4444]";
    return "from-amber-500 to-[#f59e0b]";
  };

  // 24 Hour Sessions Overlaps calculations
  const utcHours = utcTime.getUTCHours();
  
  // Hours segment details
  const sessions = [
    { name: "Sydney", start: 22, end: 7, color: "stroke-[#c084fc]" },
    { name: "Tokyo", start: 0, end: 9, color: "stroke-[#38bdf8]" },
    { name: "London", start: 8, end: 17, color: "stroke-[#34d399]" },
    { name: "New York", start: 13, end: 22, color: "stroke-[#f59e0b]" }
  ];

  const getSessionStatus = (sh: number, key: string) => {
    const s = sessions.find(item => item.name === key);
    if (!s) return false;
    if (s.start <= s.end) {
      return sh >= s.start && sh < s.end;
    } else {
      // wraps around midnight
      return sh >= s.start || sh < s.end;
    }
  };

  // Convert current UTC hour into circular dial degree coords for indicator hands (24 hr format)
  // Clock starts from 0 (top-most -90deg rotation coordinate)
  const clockAngle = (utcHours / 24) * 360 - 90;

  return (
    <div className="w-full text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[9px] uppercase font-black tracking-widest mb-1">
            📊 MARKET CONFLUENCE HUB
          </div>
          <h1 className="text-2xl font-sans font-black text-white uppercase tracking-tight">Intermarket Correlation Workspace</h1>
          <p className="text-xs text-gray-400">Analisis hubungan fundamental relatif antara Emas spot (XAUUSD) dengan aset keuangan makro dunia.</p>
        </div>

        {/* Dynamic correlation cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Correlation details table */}
          <div className="lg:col-span-8 bg-[#090b11] border border-gray-900/60 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1b2230] flex items-center justify-between">
              <h3 className="font-sans font-black text-xs text-white uppercase tracking-tight flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-500 animate-pulse" /> Korelasi Utama Terhadap XAUUSD
              </h3>
              <span className="font-mono text-[8.5px] bg-[#fb923c]/10 text-[#fb923c] border border-[#fb923c]/20 px-2.5 py-0.5 rounded-full uppercase font-black tracking-wider">
                Intermarket analysis
              </span>
            </div>

            <div className="divide-y divide-gray-900/65">
              {correlationPairs.map((pair) => (
                <div key={pair.symbol} className="p-5 hover:bg-[#0c1017]/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-gray-100 bg-[#171b26] border border-[#2d3648] px-2.5 py-1 rounded text-xs select-all">
                        {pair.symbol}
                      </span>
                      <div>
                        <span className="text-white font-sans font-bold text-xs block">{pair.name}</span>
                        <span className="text-[10px] font-mono text-gray-500">Kutipan Spot: {pair.price} ({pair.change})</span>
                      </div>
                    </div>

                    <div>
                      <span className={`inline-block font-mono text-[9px] font-black px-2.5 py-1 rounded-full border ${
                        pair.isPositive 
                          ? "bg-emerald-500/10 text-emerald-405 border-emerald-500/15" 
                          : "bg-rose-500/10 text-rose-405 border-rose-500/15"
                      }`}>
                        {pair.isPositive ? "➕ DIREK" : "➖ INVERSE"} / {pair.correlation}
                      </span>
                    </div>

                  </div>

                  <p className="text-xs text-gray-405 leading-relaxed pl-1.5 border-l-2 border-orange-500/30 ml-1">
                    {pair.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Speedometer Gauge + 24 Hour sessions clock */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 3D Speedometer Gauge Component */}
            <div className="p-6 bg-[#07070a] border border-gray-900/60 rounded-2xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/2 rounded-full blur-xl pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 via-yellow-600 to-transparent" />
              
              <span className="font-mono text-[9px] text-[#fb923c] tracking-widest uppercase block font-black mb-1">
                ● LIVE BIAS TRACKER
              </span>
              <h4 className="font-sans font-black text-xs text-white uppercase tracking-tight mb-6 flex items-center justify-between">
                <span>PERSEUS CONFLUENCE BIAS GAUGE</span>
                <span className="font-mono text-[8.5px] text-gray-500 font-bold">XAU/USD SPOT</span>
              </h4>

              {/* Speedy Gauge Draw structure */}
              <div className="w-full flex flex-col items-center justify-center py-2">
                <div className="relative w-44 h-24 flex items-center justify-center overflow-hidden">
                  
                  {/* Semicircle SVG Arc */}
                  <svg className="w-full h-full" viewBox="0 0 100 50">
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" /> {/* Sell Red */}
                        <stop offset="50%" stopColor="#f59e0b" /> {/* Neutral yellow */}
                        <stop offset="100%" stopColor="#10b981" /> {/* Buy Green */}
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 10 45 A 35 35 0 0 1 90 45" 
                      fill="none" 
                      stroke="url(#gaugeGradient)" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* High Quality indicator Needle */}
                  <div 
                    className="absolute bottom-1 w-1.5 h-16 origin-bottom bg-white rounded-full shadow-[0_0_8px_white] transition-transform duration-1000 ease-out"
                    style={{
                      transform: `rotate(${getSpeedometerAngle(oscillatorState)}deg)`,
                      transformOrigin: "bottom center"
                    }}
                  />

                  {/* Needle Cap center dot */}
                  <div className="absolute bottom-[-1px] w-4 h-4 rounded-full bg-slate-950 border border-gray-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  </div>
                </div>

                {/* Display active status labels */}
                <div className="mt-4 text-center">
                  <span className={`px-3 py-1 rounded-full font-mono text-[10.5px] font-black uppercase tracking-widest bg-[#0d121c] border inline-flex items-center gap-1.5 ${
                    oscillatorState.toUpperCase().includes("BULLISH") 
                      ? "text-emerald-400 border-emerald-500/20" 
                      : oscillatorState.toUpperCase().includes("BEARISH")
                      ? "text-rose-400 border-rose-500/20"
                      : "text-amber-400 border-amber-500/20"
                  }`}>
                    {getTrendIcon(oscillatorState)}
                    {oscillatorState}
                  </span>
                  <div className="text-[10px] text-gray-500 font-mono mt-1.5 tracking-wide">
                    VOLATILITY COEFFICIENT: 1:2.4
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed mt-4 border-t border-gray-900 pt-3">
                {getTrendDescription(oscillatorState)}
              </p>
            </div>

            {/* UPGRADE: Interactive 24-Hour Gold Session Sunburst Clock */}
            <div className="p-6 bg-[#07070a] border border-gray-900/60 rounded-2xl relative overflow-hidden shadow-2xl">
              <span className="font-mono text-[9px] text-[#38bdf8] tracking-widest uppercase block font-black mb-1">
                🌐 SEGMENT MONITOR
              </span>
              <h4 className="font-sans font-black text-xs text-white uppercase tracking-tight mb-4 flex items-center justify-between">
                <span>GLOBAL SESSION SUNBURST CLOCK</span>
                <span className="font-mono text-[9px] text-cyan-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: "12s" }} /> {utcTime.toUTCString().slice(17, 25)} UTC
                </span>
              </h4>

              {/* Sessions status checklist dials */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {sessions.map((sess) => {
                  const active = getSessionStatus(utcHours, sess.name);
                  return (
                    <div 
                      key={sess.name} 
                      className={`p-2.5 rounded-xl border font-mono text-[10.5px] flex items-center justify-between ${
                        active 
                          ? "bg-sky-500/5 border-sky-500/40 text-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.05)]" 
                          : "bg-black/30 border-gray-950/60 text-gray-550"
                      }`}
                    >
                      <span>{sess.name} Session</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-sky-400 animate-pulse" : "bg-gray-850"}`} />
                    </div>
                  );
                })}
              </div>

              {/* SVG 24 Hour clock visual representation dial */}
              <div className="w-full flex items-center justify-center py-3 bg-black/45 rounded-xl border border-gray-900 p-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  
                  {/* SVG Sector ring circles for 24 hours */}
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                    
                    {/* Tokyo sector ring */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="3.5" 
                      strokeDasharray="33 264" // Represents Tokyo hours 0 to 9 out of 24
                      strokeDashoffset="-0" // offset starting hour
                      className="opacity-30"
                    />

                    {/* London sector ring */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="36" 
                      fill="none" 
                      stroke="#34d399" 
                      strokeWidth="3.5" 
                      strokeDasharray="33 264" // Represents London hours 8 to 17
                      strokeDashoffset="-88" // starts at 8 hours (8/24 * 264 = 88)
                      className="opacity-30"
                    />

                    {/* NY Sector ring */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="30" 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="3.5" 
                      strokeDasharray="33 264" // Represents NY hours 13 to 22
                      strokeDashoffset="-143" // starts at 13 hours
                      className="opacity-30"
                    />
                  </svg>

                  {/* Real-time Indicator Hand rotating representing UTC Hours */}
                  <div 
                    className="absolute w-0.5 h-14 bg-red-500 rounded-full shadow-[0_0_10px_red]"
                    style={{
                      transform: `rotate(${clockAngle}deg)`,
                      transformOrigin: "bottom center",
                      bottom: "50%"
                    }}
                  />

                  {/* Central Cap */}
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-950 border border-red-500" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-sky-500/5 border border-sky-500/10 rounded-xl leading-relaxed text-[10.5px] text-slate-400 font-normal">
                <span className="font-bold text-sky-400 block font-mono">⚡ PEAK LIQUIDITY OVERLAP (8h-9h &amp; 13h-17h UTC):</span>
                Saat tumpang tindih sesi London dan New York, volume transaksi emas seketika melonjak, melahirkan pergerakan konklusif dan bias paling menguntungkan.
              </div>

            </div>

            <div className="p-6 bg-[#090b11] border border-gray-900/60 rounded-2xl shadow-xl">
              <h4 className="font-sans font-black text-xs text-amber-500 uppercase tracking-tight mb-4 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500 animate-pulse" /> Cara Menggunakan Korelasi
              </h4>
              
              <ul className="space-y-4 font-sans text-xs text-gray-400 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold font-mono">1.</span>
                  <div>
                    <span className="font-black text-white block">Sinyal Konfirmasi DXY</span>
                    Sebelum membuka posisi BUY pada XAUUSD, periksa apakah DXY sedang membentur level resistance kuat untuk konfirmasi pelemahan.
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold font-mono">2.</span>
                  <div>
                    <span className="font-black text-white block">Korelasi Obligasi US10Y</span>
                    Kejatuhan imbal hasil US10Y adalah bahan bakar utama bagi peluncuran bullish vertikal XAUUSD, terutama di sesi New York.
                  </div>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* CATEGORIES 1-4 COMPREHENSIVE REINFORCEMENTS GRID */}
        <div className="mt-12 pt-8 border-t border-gray-904">
          <div className="mb-6">
            <span className="font-mono text-[9px] text-[#38bdf8] tracking-widest uppercase block font-black mb-1">
              SYSTEM CONFLUENCE SUITE
            </span>
            <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider">
              Auxiliary Institutional Deck Indonesian
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
              Modul kontrol akustik siber murni, monitor percepatan volatilitas harian, saringan multi-timeframe bias (RSI + MA), dan sinkronisasi sesi likuiditas interbank global.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            <AcousticAudioController />
            <GoldVolatilityIndex />
            <TechnicalScreener currentQuote={currentXau} />
            <TradingSessions />
          </div>
        </div>

      </div>
    </div>
  );
}
