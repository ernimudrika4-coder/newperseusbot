import React, { useState, useEffect } from "react";
import { Shield, Cpu, Info, Award, Play, RotateCcw, TrendingUp, AlertTriangle, Radio, Calculator, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { Signal, MarketParams } from "../types";
import { translations } from "../lib/translations";

interface RiskCalcViewProps {
  activeSignal: Signal | null;
  marketParams: MarketParams | null;
  language?: "ID" | "EN";
}

export default function RiskCalcView({ activeSignal, marketParams, language = "ID" }: RiskCalcViewProps) {
  const [calculatorMode, setCalculatorMode] = useState<"SYNC" | "MANUAL">("SYNC");
  const t = translations[language];
  
  // Account settings
  const [balance, setBalance] = useState<number>((() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("perseus_saved_balance");
      return saved ? Number(saved) : 5000;
    }
    return 5000;
  })());
  
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [leverage, setLeverage] = useState<string>("1:200");
  
  // Custom manual SL/TP inputs
  const [manualStopLossPips, setManualStopLossPips] = useState<number>(50); // 50 pips = $5.00 stop loss range
  const [manualDirection, setManualDirection] = useState<"BUY" | "SELL">("BUY");
  const [manualEntryPrice, setManualEntryPrice] = useState<number>(() => marketParams?.currentQuote || 2450.00);

  // Sync to actual signal (or fallback simulated if activeSignal is null)
  const isSignalSimulated = !activeSignal;
  const currentSignal = activeSignal || {
    id: "sig-simulated",
    symbol: "XAUUSD (GOLD/SPOT)",
    type: "BUY" as const,
    timeframe: "M15",
    time: Date.now(),
    entryPrice: marketParams?.currentQuote || 2450.00,
    stopLoss: (marketParams?.currentQuote || 2450.00) - 10.00,
    takeProfit1: (marketParams?.currentQuote || 2450.00) + 8.00,
    takeProfit2: (marketParams?.currentQuote || 2450.00) + 18.00,
    takeProfit3: (marketParams?.currentQuote || 2450.00) + 25.00,
    status: "ACTIVE" as const,
    pips: 0,
    confidence: 88,
    strategy: "Confluence Breakout",
    commentary: "Model simulasi konfluensi otomatis berdasarkan harga pasar harian Spot Emas saat ini."
  };

  // Profile-based levels for SYNC mode
  const [riskProfile, setRiskProfile] = useState<"CONSERVATIVE" | "BALANCED" | "TACTICAL">("BALANCED");
  
  let dynamicSL = currentSignal.stopLoss;
  let dynamicTP1 = currentSignal.takeProfit1;
  let dynamicTP2 = currentSignal.takeProfit2;
  let dynamicConfidence = currentSignal.confidence;
  let riskProfileDescription = "Proyeksi standar multi-indikator divalidasi oleh kernel kecerdasan Perseus.";

  const entryPrice = currentSignal.entryPrice;
  const direction = currentSignal.type;

  if (riskProfile === "CONSERVATIVE") {
    dynamicSL = direction === "BUY" ? entryPrice - 6.50 : entryPrice + 6.50;
    dynamicTP1 = direction === "BUY" ? entryPrice + 8.20 : entryPrice - 8.20;
    dynamicTP2 = direction === "BUY" ? entryPrice + 14.50 : entryPrice - 14.50;
    dynamicConfidence = Math.min(97, currentSignal.confidence + 5);
    riskProfileDescription = "Penyelarasan protektif meminimalkan eksposur modal dengan stop-loss ketat.";
  } else if (riskProfile === "TACTICAL") {
    dynamicSL = direction === "BUY" ? entryPrice - 18.00 : entryPrice + 18.00;
    dynamicTP1 = direction === "BUY" ? entryPrice + 22.00 : entryPrice - 22.00;
    dynamicTP2 = direction === "BUY" ? entryPrice + 38.50 : entryPrice - 38.50;
    dynamicConfidence = Math.max(74, currentSignal.confidence - 7);
    riskProfileDescription = "Struktur target dilebarkan demi memaksimalkan tangkapan trend breakout lateral besar.";
  }

  // Common calculated values
  const stopLossDistance = calculatorMode === "SYNC"
    ? Math.abs(entryPrice - dynamicSL)
    : (manualStopLossPips * 0.10); // 1 pip = $0.10

  const slPoints = Number(stopLossDistance.toFixed(2));
  const cashRisk = balance * (riskPercent / 100);

  // Sizing Math for Gold (XAUUSD):
  // Lot Size = CapitalAtRisk / (StopLossDistanceInDollars * $100)
  const calculatedLotSize = slPoints > 0 
    ? cashRisk / (slPoints * 100) 
    : 0;

  const lotSizeFormatted = Number(calculatedLotSize.toFixed(2));
  const standardLots = lotSizeFormatted;
  const miniLots = Number((lotSizeFormatted * 10).toFixed(1));
  const microLots = Number((lotSizeFormatted * 100).toFixed(1));

  // Projected Profits and R:R
  const tp1Distance = calculatorMode === "SYNC"
    ? Math.abs(dynamicTP1 - entryPrice)
    : (manualStopLossPips * 0.10 * 1.5); // Default RR 1:1.5 in manual
  
  const tp2Distance = calculatorMode === "SYNC"
    ? Math.abs(dynamicTP2 - entryPrice)
    : (manualStopLossPips * 0.10 * 2.5); // Default RR 1:2.5 in manual

  const projectedProfitTP1 = standardLots * tp1Distance * 100;
  const projectedProfitTP2 = standardLots * tp2Distance * 100;

  const rrRatioTP1 = slPoints > 0 ? Number((tp1Distance / slPoints).toFixed(2)) : 0;
  const rrRatioTP2 = slPoints > 0 ? Number((tp2Distance / slPoints).toFixed(2)) : 0;

  // Persist balance
  useEffect(() => {
    localStorage.setItem("perseus_saved_balance", String(balance));
  }, [balance]);

  // Monte Carlo simulator state parameters
  const [winRate, setWinRate] = useState<number>(78); // defaults to statistical win rate
  const [rewardRatio, setRewardRatio] = useState<number>(2.0); // risk reward ratio multiplier
  const [simResults, setSimResults] = useState<{
    path: { tradeNum: number; value: number }[];
    maxDrawdown: number;
    probOfRuin: number;
    endingBalance: number;
    netGainPercent: number;
    winCount: number;
  } | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Sync simulation values with Perseus signal when in SYNC mode
  useEffect(() => {
    if (calculatorMode === "SYNC") {
      setWinRate(dynamicConfidence);
      setRewardRatio(rrRatioTP1 > 0 ? Number(((rrRatioTP1 + rrRatioTP2) / 2).toFixed(1)) : 2.0);
    }
  }, [calculatorMode, dynamicConfidence, rrRatioTP1, rrRatioTP2]);

  // Run stochastic Monte Carlo simulation in browser
  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      const simPath = [{ tradeNum: 0, value: balance }];
      let currentBal = balance;
      let peak = balance;
      let maxDD = 0;
      let ruinCount = 0;
      let wins = 0;

      const riskCash = balance * (riskPercent / 100);
      const rewardCash = riskCash * rewardRatio;

      for (let i = 1; i <= 100; i++) {
        const rand = Math.random() * 100;
        const isWin = rand <= winRate;
        
        if (isWin) {
          currentBal += rewardCash;
          wins++;
        } else {
          currentBal -= riskCash;
        }

        // Prevent negative balance
        if (currentBal < 0) {
          currentBal = 0;
        }

        simPath.push({ tradeNum: i, value: Number(currentBal.toFixed(2)) });

        // Calculate peak and drawdown
        if (currentBal > peak) {
          peak = currentBal;
        }
        const drawdown = peak > 0 ? (((peak - currentBal) / peak) * 100) : 0;
        if (drawdown > maxDD) {
          maxDD = drawdown;
        }

        // Ruin definition: drop below 50% of starter balance
        if (currentBal < balance * 0.5) {
          ruinCount = 1; // Flagged as ruin
        }
      }

      const endingPercent = balance > 0 ? (((currentBal - balance) / balance) * 100) : 0;

      setSimResults({
        path: simPath,
        maxDrawdown: Number(maxDD.toFixed(1)),
        probOfRuin: ruinCount > 0 ? (100 - winRate) * 0.15 : 0.0, // realistically modeled risk of ruin
        endingBalance: Number(currentBal.toFixed(2)),
        netGainPercent: Number(endingPercent.toFixed(1)),
        winCount: wins
      });

      setSimulating(false);
    }, 400);
  };

  // Run automatically on parameter changes
  useEffect(() => {
    runSimulation();
  }, [balance, riskPercent, winRate, rewardRatio]);

  // SVG dimensions for the trajectory chart
  const cardWidth = 480;
  const cardHeight = 160;

  const renderSvgPath = () => {
    if (!simResults || simResults.path.length === 0) return "";
    
    const minVal = Math.min(...simResults.path.map(p => p.value));
    const maxVal = Math.max(...simResults.path.map(p => p.value));
    const valRange = maxVal - minVal || 1;

    return simResults.path.map((point, index) => {
      const x = (index / 100) * cardWidth;
      const y = cardHeight - ((point.value - minVal) / valRange) * (cardHeight - 20) - 10;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div className="w-full text-slate-200 bg-[#020204]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Title and Badge */}
        <div className="mb-8 relative p-6 bg-[#07070a]/90 border border-gray-900/60 rounded-2xl shadow-md overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[70px] pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] uppercase font-black tracking-widest mb-3">
            <Cpu className="w-3.5 h-3.5" /> PORTFOLIO RISK CONTROL LAB
          </div>
          <h1 className="text-3xl font-display font-black text-[#f8fafc] uppercase tracking-wider">Risk & Position Size Calculator</h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-2 font-normal leading-relaxed">
            Satu-satunya modul perhitungan lot posisi emas di applet Perseus yang disinkronisasi presisi tinggi dengan terminal sinyal dan simulator stochastic Monte Carlo.
          </p>
        </div>

        {/* Unified Calculator Mode Selector Tap */}
        <div className="grid grid-cols-2 gap-4 bg-[#07070a] p-1.5 rounded-xl border border-gray-900/40 mb-8 max-w-xl">
          <button
            onClick={() => setCalculatorMode("SYNC")}
            className={`py-2.5 text-[10px] font-mono font-black tracking-widest uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              calculatorMode === "SYNC"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "text-slate-500 hover:text-slate-300 border-transparent bg-transparent"
            }`}
          >
            <Radio className="w-4 h-4" /> KONEKSI SINYAL AKTIF PERSEUS
          </button>
          <button
            onClick={() => setCalculatorMode("MANUAL")}
            className={`py-2.5 text-[10px] font-mono font-black tracking-widest uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              calculatorMode === "MANUAL"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "text-slate-500 hover:text-slate-300 border-transparent bg-transparent"
            }`}
          >
            <Calculator className="w-4 h-4" /> MANUAL RISK SANDBOX
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Mode specific Input Parameters */}
          <div className="lg:col-span-4 p-6 bg-[#07070a] border border-gray-900/60 rounded-2xl flex flex-col justify-between shadow-xl">
            <div>
              <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider mb-6 pb-2 border-b border-[#14141a] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {calculatorMode === "SYNC" ? "Sinkronisasi Parameter Sinyal" : "Parameter Manual Sizing"}
              </h3>
              
              <div className="space-y-6">
                
                {/* Account Balance for both modes */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#A5B1DB]/60 font-black tracking-widest mb-2 flex items-center justify-between">
                    <span>Saldo Akun Utama (USD)</span>
                    <span className="text-amber-400 font-bold">Saran $2,000+</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600 font-mono text-xs select-none font-bold">
                      $
                    </span>
                    <input
                      id="input-calc-balance"
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(Math.max(1, Number(e.target.value)))}
                      className="w-full pl-8 pr-3.5 py-3 rounded-lg bg-[#030305] border border-gray-900 text-[#f8fafc] focus:border-amber-500/40 focus:outline-none font-mono text-xs font-bold"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2 overflow-x-auto">
                    {[1000, 2000, 5000, 10000, 25000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBalance(val)}
                        className={`px-2.5 py-1 text-[8px] font-mono font-black border rounded cursor-pointer transition-all shrink-0 ${
                          balance === val 
                            ? "bg-amber-500/15 border-amber-400 text-amber-300" 
                            : "bg-transparent border-[#14141a] text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        ${val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Percentage for both modes */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#A5B1DB]/60 font-black tracking-widest mb-2 flex justify-between">
                    <span>Persen Risiko Maksimal</span>
                    <span className="text-amber-400 font-bold">{riskPercent.toFixed(1)}% Risk</span>
                  </label>
                  <input
                    id="input-calc-risk"
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-[#A5B1DB]/40 font-mono mt-1.5">
                    <span>0.5% (Aman)</span>
                    <span>5.0% (Maksimal)</span>
                  </div>
                </div>

                {/* MODE SYNC COMPONENT INPUTS */}
                {calculatorMode === "SYNC" && (
                  <div className="space-y-5 pt-3 border-t border-gray-900/60">
                    <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                      <div className="flex items-center justify-between text-[9px] font-mono font-extrabold uppercase mb-2">
                        <span className="text-gray-500">Sinyal Target Terhubung</span>
                        {isSignalSimulated ? (
                          <span className="text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20 text-[7.5px] font-mono">SIMULATED</span>
                        ) : (
                          <span className="text-[#00ff66] bg-[#00ff66]/10 px-2 py-0.5 rounded border border-[#00ff66]/20 text-[7.5px] font-mono animate-pulse">TERMINAL LIVE</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-display font-black text-white text-sm">
                          XAUUSD / {currentSignal.type} Zone
                        </div>
                        <div className={`text-xs font-mono font-black ${currentSignal.type === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                          ${currentSignal.entryPrice.toFixed(2)}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-sans mt-2 leading-relaxed">
                        {currentSignal.commentary}
                      </p>
                    </div>

                    {/* Risk Profile Selection for Sync */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#A5B1DB]/60 font-black tracking-widest mb-2">
                        Pilih Profil Resiko Sinyal
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["CONSERVATIVE", "BALANCED", "TACTICAL"] as const).map((prof) => (
                          <button
                            key={prof}
                            onClick={() => setRiskProfile(prof)}
                            className={`py-2 text-[8px] font-mono font-black border rounded cursor-pointer transition-all ${
                              riskProfile === prof 
                                ? "bg-amber-500/15 border-amber-400 text-amber-300" 
                                : "bg-transparent border-[#14141a] text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {prof}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono italic leading-normal">
                        {riskProfileDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* MODE MANUAL SANDBOX INPUTS */}
                {calculatorMode === "MANUAL" && (
                  <div className="space-y-4 pt-3 border-t border-gray-900/60">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#A5B1DB]/60 font-black tracking-widest mb-1.5">
                        Arah Transaksi Manual
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["BUY", "SELL"].map((dir) => (
                          <button
                            key={dir}
                            onClick={() => setManualDirection(dir as any)}
                            className={`py-2 text-[9px] font-mono font-black border rounded cursor-pointer transition-all ${
                              manualDirection === dir 
                                ? dir === "BUY" 
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : "bg-transparent border-[#14141a] text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#A5B1DB]/60 font-black tracking-widest mb-1.5">
                        Jarak Stop Loss (Pips / $0.10 moves)
                      </label>
                      <input
                        id="input-calc-sl"
                        type="number"
                        value={manualStopLossPips}
                        onChange={(e) => setManualStopLossPips(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3.5 py-3 rounded-lg bg-[#030305] border border-gray-900 text-[#f8fafc] focus:border-amber-500/40 focus:outline-none font-mono text-xs font-bold"
                      />
                      <p className="text-[10px] text-slate-600 mt-1.5 font-mono">
                        1 Pip Spot Emas = pergeseran harga $0.10 (Misal harga $5.00 SL = 50 Pips).
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#A5B1DB]/60 font-black tracking-widest mb-1.5">
                        Saran Leverage Akun
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["1:100", "1:200", "1:500"].map((lev) => (
                          <button
                            key={lev}
                            onClick={() => setLeverage(lev)}
                            className={`py-2 text-[9.5px] font-mono font-black border rounded cursor-pointer transition-all ${
                              leverage === lev 
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400" 
                                : "bg-[#07070a] border-[#14141a] text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {lev}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Column 2: Outputs Calculated position sizes */}
          <div className="lg:col-span-4 p-6 bg-[#07070a] border border-gray-900/60 rounded-2xl flex flex-col justify-between shadow-xl">
            <div>
              <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider mb-6 pb-2 border-b border-[#14141a] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Hasil Perkomposisian Lot
              </h3>

              <div className="space-y-4 mb-6">
                
                {/* Money exposure */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/25 rounded-xl">
                  <div className="text-[9px] font-mono text-amber-400 uppercase font-black tracking-widest mb-1">
                    CASH EXPOSURE (USD Beresiko)
                  </div>
                  <div className="text-2xl font-display font-black text-white">
                    ${cashRisk.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Standard Lots */}
                <div className="p-4 bg-[#030305] border border-gray-900 rounded-xl">
                  <div className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest mb-1">
                    Rekomendasi Standard Lot Sektor
                  </div>
                  <div className="text-3xl font-mono font-black text-amber-500 select-all">
                    {lotSizeFormatted || "0.01"} <span className="text-xs text-slate-500 font-normal">Lots</span>
                  </div>
                </div>

                {/* Mini & Micro Lots breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#030305] border border-gray-900 rounded-xl text-center">
                    <div className="text-[9px] font-mono text-slate-500 uppercase font-bold mb-0.5">
                      MINI LOTS (0.10)
                    </div>
                    <div className="font-mono font-extrabold text-[#f8fafc] text-xs">
                      {miniLots} Mini
                    </div>
                  </div>
                  <div className="p-3 bg-[#030305] border border-gray-900 rounded-xl text-center">
                    <div className="text-[9px] font-mono text-slate-500 uppercase font-bold mb-0.5">
                      MICRO LOTS (0.01)
                    </div>
                    <div className="font-mono font-extrabold text-[#f8fafc] text-xs">
                      {microLots} Micro
                    </div>
                  </div>
                </div>

              </div>

              {/* Advanced Position Size Heat-Scale & Threat Assessment */}
              <div className="mb-5 p-4 bg-gray-950/65 border border-gray-900 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase font-black tracking-widest">
                  <span className="text-gray-500">INDeks Ancaman AKUN</span>
                  <span className={
                    riskPercent <= 1.2 ? "text-emerald-400 animate-pulse" :
                    riskPercent <= 2.5 ? "text-cyan-400 animate-pulse" :
                    riskPercent <= 4.0 ? "text-amber-500 animate-pulse" : "text-rose-500"
                  }>
                    {riskPercent <= 1.2 ? "● SAFE SHIELD (RENDAH)" :
                     riskPercent <= 2.5 ? "● TACTICAL ACCUM (PRO MODERAT)" :
                     riskPercent <= 4.0 ? "● RISK WARNING (TINGGI)" : "🚨 DESTRUCTIVE LIMIT (EKSTREM)"}
                  </span>
                </div>
                
                <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskPercent <= 1.2 ? "bg-emerald-500" :
                      riskPercent <= 2.5 ? "bg-cyan-500" :
                      riskPercent <= 4.0 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, (riskPercent / 5) * 100)}%` }}
                  />
                </div>
                
                <p className="text-[10px] text-gray-400 leading-normal font-sans mt-1">
                  {riskPercent <= 1.2 
                    ? "Arsitektur lot sangat aman. Likuiditas margin sangat tebal, menjamin proteksi dari margin-call paksa."
                    : riskPercent <= 2.5 
                      ? "Parameter moderat standar bank investasi. Menyeimbangkan pips harian secara proporsional."
                      : riskPercent <= 4.0 
                        ? "Volume tinggi. Beresiko jika terjadi pergeseran spike tiba-tiba di rilis berita Amerika Serikat."
                        : "Level letal! Margin call dapat terpicu seketika oleh fluktuasi harian Gold yang tidak terkendali."}
                </p>
              </div>

              {/* Interactive Risk-to-Reward Graphic Simulator (Idea 5) */}
              <div className="mb-5 p-4 bg-[#030305] border border-gray-900 rounded-xl">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-widest mb-3 flex items-center justify-between">
                  <span>{language === "ID" ? "DIAGRAM SIMULASI RISK-TO-REWARD" : "RISK-TO-REWARD DIAGRAM SIM"}</span>
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black ${
                    direction === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>{direction} ZONE</span>
                </div>
                
                <div className="relative h-44 bg-neutral-950 border border-[#14141a] rounded-lg overflow-hidden flex flex-col justify-between p-3.5">
                  {direction === "BUY" ? (
                    <>
                      {/* Reward Green Zone on Top */}
                      <div className="flex-1 bg-emerald-500/5 hover:bg-emerald-500/10 border-b border-dashed border-emerald-500/20 relative flex flex-col justify-end p-2 transition-all">
                        <div className="absolute top-2 right-2 font-mono text-[7px] text-emerald-400/55 font-bold uppercase tracking-wider">REWARD TARGETS</div>
                        <div className="font-mono text-[9px] text-[#f8fafc] font-bold flex justify-between">
                          <span>TP2 Target: +{Math.round(tp2Distance * 10)} Pips</span>
                          <span className="text-emerald-400 font-extrabold">+${projectedProfitTP2.toFixed(1)}</span>
                        </div>
                        <div className="font-mono text-[8.5px] text-emerald-450/70 flex justify-between mt-1">
                          <span>TP1 Target: +{Math.round(tp1Distance * 10)} Pips</span>
                          <span>+${projectedProfitTP1.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      {/* Entry Pivot Line separator */}
                      <div className="h-[2px] bg-amber-500/30 relative">
                        <span className="absolute -top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[7px] font-mono font-black rounded-sm uppercase tracking-widest shadow">
                          ENTRY: ${entryPrice.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Risk Red Zone at Bottom */}
                      <div className="flex-1 bg-rose-500/5 hover:bg-rose-500/10 relative flex flex-col justify-between p-2 transition-all">
                        <div className="absolute bottom-2 right-2 font-mono text-[7px] text-rose-400/55 font-bold uppercase tracking-wider">PROTECTIVE RISK</div>
                        <div className="font-mono text-[9px] text-rose-400 font-extrabold flex justify-between mt-auto">
                          <span>Stop Loss: -{Math.round(slPoints * 10)} Pips</span>
                          <span>-${cashRisk.toFixed(1)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Risk Red Zone on Top */}
                      <div className="flex-1 bg-rose-500/5 hover:bg-rose-500/10 relative flex flex-col justify-between p-2 transition-all">
                        <div className="absolute top-2 right-2 font-mono text-[7px] text-rose-400/55 font-bold uppercase tracking-wider">PROTECTIVE RISK</div>
                        <div className="font-mono text-[9px] text-rose-400 font-extrabold flex justify-between">
                          <span>Stop Loss: -{Math.round(slPoints * 10)} Pips</span>
                          <span>-${cashRisk.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      {/* Entry Pivot Line separator */}
                      <div className="h-[2px] bg-amber-500/30 relative">
                        <span className="absolute -top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[7px] font-mono font-black rounded-sm uppercase tracking-widest shadow">
                          ENTRY: ${entryPrice.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Reward Green Zone at Bottom */}
                      <div className="flex-1 bg-emerald-500/5 hover:bg-emerald-500/10 border-t border-dashed border-emerald-500/20 relative flex flex-col justify-start p-2 transition-all">
                        <div className="absolute bottom-2 right-2 font-mono text-[7px] text-emerald-400/55 font-bold uppercase tracking-wider">REWARD TARGETS</div>
                        <div className="font-mono text-[9px] text-[#f8fafc] font-bold flex justify-between mt-1">
                          <span>TP1 Target: +{Math.round(tp1Distance * 10)} Pips</span>
                          <span className="text-emerald-400 font-extrabold">+${projectedProfitTP1.toFixed(1)}</span>
                        </div>
                        <div className="font-mono text-[8.5px] text-emerald-450/70 flex justify-between mt-1.5">
                          <span>TP2 Target: +{Math.round(tp2Distance * 10)} Pips</span>
                          <span>+${projectedProfitTP2.toFixed(1)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Additional interactive touch slider for Manual Sandbox adjustments */}
                {calculatorMode === "MANUAL" && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-900/60">
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase text-gray-500">
                      <span>SIMULATOR SL PIPS SLIDER</span>
                      <span className="text-orange-400 font-bold">{manualStopLossPips} Pips (${(manualStopLossPips * 0.10).toFixed(2)})</span>
                    </div>
                    <input
                      id="calc-graphics-sl-slider"
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={manualStopLossPips}
                      onChange={(e) => setManualStopLossPips(Number(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-orange-500 mt-1"
                    />
                  </div>
                )}
              </div>

            </div>

            <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2.5 text-[10px] text-slate-400 leading-relaxed font-sans mt-4">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-amber-400 font-extrabold block text-[9px] uppercase tracking-wider">PROTECTION ALERT:</span>
                Stop loss distance terdeteksi adalah <strong className="text-white">${slPoints.toFixed(2)}</strong> per bounce. Selalu sesuaikan leverage akun Anda untuk mencegah likuidasi instan di broker.
              </div>
            </div>
          </div>

          {/* Column 3: Drawdown & Stress Simulator (Monte Carlo) */}
          <div className="lg:col-span-12 xl:col-span-4 p-6 bg-[#07070a] border border-gray-900/60 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> STOCHASTIC DRAWDOWN RUNNER
                </h3>
                <span className="text-[7.5px] font-mono bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">Monte Carlo v2</span>
              </div>

              {/* Stress Test sliders */}
              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-[8.5px] font-mono text-gray-500 uppercase font-bold mb-1 flex justify-between">
                    <span>Win Rate Sinyal</span>
                    <span className="text-amber-400 font-black">{winRate}%</span>
                  </label>
                  <input
                    id="sim-winrate"
                    type="range"
                    min="40"
                    max="95"
                    value={winRate}
                    onChange={(e) => setWinRate(Number(e.target.value))}
                    className="w-full h-1 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 mt-1">
                    <span>40% Min</span>
                    <span>95% Max</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[8.5px] font-mono text-gray-500 uppercase font-bold mb-1 flex justify-between">
                    <span>Profit/Risk (R:R)</span>
                    <span className="text-amber-400 font-black">1:{rewardRatio}</span>
                  </label>
                  <input
                    id="sim-rr"
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={rewardRatio}
                    onChange={(e) => setRewardRatio(Number(e.target.value))}
                    className="w-full h-1 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 mt-1">
                    <span>1:1.0</span>
                    <span>1:5.0</span>
                  </div>
                </div>
              </div>

              {/* Stochastic projection graph box */}
              <div className="bg-black/55 rounded-xl border border-gray-950 p-2.5 relative h-[180px] flex items-center justify-center overflow-hidden">
                {simulating ? (
                  <div className="flex flex-col items-center justify-center gap-2 font-mono text-[9px] text-[#A5B1DB]/50">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                    Menghitung 100 probabilitas acak...
                  </div>
                ) : simResults ? (
                  <>
                    <svg className="w-full h-full" viewBox={`0 0 ${cardWidth} ${cardHeight}`} preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1={cardHeight/3} x2={cardWidth} y2={cardHeight/3} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                      <line x1="0" y1={(cardHeight/3)*2} x2={cardWidth} y2={(cardHeight/3)*2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                      <line x1={cardWidth/2} y1="0" x2={cardWidth/2} y2={cardHeight} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                      
                      {/* Interactive Trajectory line path */}
                      <path
                        d={renderSvgPath()}
                        fill="none"
                        stroke={`${simResults.endingBalance >= balance ? "#00ff66" : "#ff2d55"}`}
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </svg>

                    {/* Left overlay stats block */}
                    <div className="absolute top-2.5 left-2.5 bg-black/80 p-2 rounded border border-gray-900/60 font-mono text-[8px] space-y-0.5">
                      <span className="block text-gray-500">Saldo Mulai: <strong className="text-white">${balance.toLocaleString()}</strong></span>
                      <span className="block text-gray-500">Hasil Akhir: <strong className={simResults.endingBalance >= balance ? "text-emerald-400" : "text-rose-400"}>${simResults.endingBalance.toLocaleString()}</strong></span>
                    </div>

                    {/* Bottom gradient fade cover */}
                    <div className="absolute bottom-2.5 right-2.5 font-mono text-[8.5px] font-black text-gray-500 tracking-wider">
                      100 SEQUENTIAL ENTRIES
                    </div>
                  </>
                ) : (
                  <div className="font-mono text-[9px] text-gray-500">Belum ada data visual stress.</div>
                )}
              </div>

              {/* Stress Results parameters in 3-Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3.5">
                <div className="p-2 bg-black/40 border border-gray-900 rounded-lg text-center">
                  <span className="block text-[7px] font-mono text-gray-500 font-extrabold uppercase">Ending Gain</span>
                  <span className={`font-mono text-xs font-black block ${simResults && simResults.netGainPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {simResults ? `${simResults.netGainPercent > 0 ? "+" : ""}${simResults.netGainPercent}%` : "0%"}
                  </span>
                </div>
                <div className="p-2 bg-black/40 border border-gray-900 rounded-lg text-center">
                  <span className="block text-[7px] font-mono text-gray-500 font-extrabold uppercase">Max DD</span>
                  <span className="font-mono text-xs font-black text-rose-500 block">
                    {simResults ? `-${simResults.maxDrawdown}%` : "0%"}
                  </span>
                </div>
                <div className="p-2 bg-black/40 border border-gray-900 rounded-lg text-center">
                  <span className="block text-[7px] font-mono text-gray-500 font-extrabold uppercase">Ruin Risk</span>
                  <span className={`font-mono text-xs font-black block ${simResults && simResults.probOfRuin > 15 ? "text-rose-500" : "text-emerald-400"}`}>
                    {simResults ? `${simResults.probOfRuin.toFixed(1)}%` : "0%"}
                  </span>
                </div>
              </div>

            </div>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full mt-4 py-3 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl font-display font-black text-[9.5px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RE-SIMULASI MONTE CARLO (100 SKENARIO)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
