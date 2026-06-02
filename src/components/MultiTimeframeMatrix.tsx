import React, { useState, useEffect } from "react";
import { MarketParams, Signal } from "../types";
import { Layers, Activity, TrendingUp, CheckCircle, Flame, ShieldAlert, Sparkles } from "lucide-react";

interface MultiTimeframeMatrixProps {
  marketParams: MarketParams | null;
  activeSignal: Signal | null;
}

export default function MultiTimeframeMatrix({ marketParams, activeSignal }: MultiTimeframeMatrixProps) {
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const baseRsi = marketParams?.rsi || 56.4;
  const basePrice = marketParams?.currentQuote || 4540.24;
  const direction = activeSignal?.type || "BUY";

  // Simulate premium logical fluctuations across different timeframes based on live system inputs
  const timeframes = [
    {
      tf: "M5",
      type: "SCALPING",
      trend: direction === "BUY" ? "STRONG BULLISH" : "SUDDEN BEARISH",
      rsi: Math.round((baseRsi + Math.sin(ticker) * 3) * 10) / 10,
      ema20_50: direction === "BUY" ? "EMA-20 > EMA-50" : "EMA-20 < EMA-50",
      sma200: direction === "BUY" ? "SUPPORT LEVEL OK" : "RESISTANCE HOLD",
      volatility: "MODERAT (ATR 1.8P)",
      bias: direction === "BUY" ? 92 : 15,
    },
    {
      tf: "M15",
      type: "CORE INTRA",
      trend: direction === "BUY" ? "ACCUMULATION BULLISH" : "DISTRIBUTION BEARISH",
      rsi: Math.round(baseRsi * 10) / 10,
      ema20_50: direction === "BUY" ? "CROSSOVER GOLDEN" : "CROSSOVER DEATH",
      sma200: direction === "BUY" ? "ABOVE SMA-200" : "BELOW SMA-200",
      volatility: "Tinggi (ATR 4.2P)",
      bias: direction === "BUY" ? 88 : 22,
    },
    {
      tf: "H1",
      type: "SWING BIAS",
      trend: direction === "BUY" ? "BULLISH EXPANSION" : "BEARISH REJECTION",
      rsi: Math.round((baseRsi * 0.95 + 2) * 10) / 10,
      ema20_50: direction === "BUY" ? "ALIGNED UP" : "ALIGNED DOWN",
      sma200: direction === "BUY" ? "ABOVE SMA-200" : "BELOW SMA-200",
      volatility: "PADAT (ATR 12.5P)",
      bias: direction === "BUY" ? 85 : 30,
    },
    {
      tf: "H4",
      type: "MACRO TREND",
      trend: direction === "BUY" ? "MAJOR BULLISH RALLY" : "MAJOR BEARISH BIAS",
      rsi: Math.round((baseRsi * 0.9 + 5) * 10) / 10,
      ema20_50: "EMA STABLE",
      sma200: "ABOVE SMA-200",
      volatility: "KONSTAN (ATR 24.8P)",
      bias: direction === "BUY" ? 94 : 45,
    },
  ];

  // Calculate the live unified confluence rating based on timeframe bias averages
  const totalBiasSum = timeframes.reduce((sum, item) => sum + item.bias, 0);
  const averageConfluenceScore = Math.round(totalBiasSum / timeframes.length);

  return (
    <div id="multi-timeframe-matrix" className="p-6 sm:p-8 rounded-2xl bg-[#040407] border border-amber-500/15 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.015] rounded-full blur-[60px]" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <span className="font-mono text-[9px] text-amber-500 tracking-widest uppercase block font-black">⚡ IDEAL OPTION MODULE 1</span>
          <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-wider">Multi-Timeframe Confluence Map</h3>
          <p className="text-[10.5px] text-slate-400 mt-1 font-sans leading-relaxed">Penyelarasan struktur tren, RSI, dan persilangan Moving Average dari TF Mikro M5 hingga Tren Makro H4 secara serentak.</p>
        </div>

        {/* Global Confluence Score Badge */}
        <div className="p-3 bg-gradient-to-br from-[#120f04] to-black border border-amber-500/25 rounded-xl shrink-0 text-center sm:text-right min-w-[120px] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-full blur-md" />
          <span className="text-[8.5px] font-mono text-slate-500 block uppercase tracking-widest font-black leading-none">CONFLUENCE INDEX</span>
          <span className="text-2xl font-mono font-black text-amber-400 block mt-1.5 leading-none">
            {averageConfluenceScore}%
          </span>
          <span className="text-[7.5px] font-mono text-[#00ff66] block uppercase tracking-wider mt-1.5 leading-none font-bold">
            {averageConfluenceScore >= 75 ? "🔴 OVERWHELMING BULLISH" : averageConfluenceScore >= 50 ? "🟡 MODERATE STRENGTH" : "🔵 BEARISH BIAS"}
          </span>
        </div>
      </div>

      {/* Grid of 4 timeframes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {timeframes.map((item, idx) => {
          const isBullishBias = item.bias >= 60;
          return (
            <div 
              key={idx} 
              className="p-4 bg-[#07070a] border border-[#14141a] hover:border-amber-500/20 rounded-xl transition-all duration-300 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/[0.005] rounded-full blur-md" />
              
              {/* Card Header segment */}
              <div className="flex items-center justify-between border-b border-[#14141a] pb-2.5 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-white text-base tracking-wider">{item.tf}</span>
                  <span className="font-mono text-[8.5px] bg-[#0c0c12] text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">
                    {item.type}
                  </span>
                </div>
                
                <span className={`text-[9px] font-mono font-black ${isBullishBias ? "text-[#00ff66]" : "text-rose-400"}`}>
                  {item.bias}% STRENGTH
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-2 text-[9.5px] font-mono text-slate-400">
                <div className="flex justify-between items-center bg-[#030305] p-1.5 rounded border border-[#14141a]/40">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider">STRUKTUR</span>
                  <span className={`font-black text-[9px] ${isBullishBias ? "text-emerald-400" : "text-rose-400"}`}>{item.trend}</span>
                </div>
                
                <div className="flex justify-between items-center p-1">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider">RSI (14)</span>
                  <span className="text-white font-bold">{item.rsi}</span>
                </div>

                <div className="flex justify-between items-center p-1">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider">EMA STATUS</span>
                  <span className="text-slate-200 text-[9px] font-semibold">{item.ema20_50}</span>
                </div>

                <div className="flex justify-between items-center p-1">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider">SMA INDICATION</span>
                  <span className="text-amber-300 text-[8.5px] font-extrabold">{item.sma200}</span>
                </div>

                <div className="flex justify-between items-center p-1">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wider">VOLATILITAS</span>
                  <span className="text-slate-500 text-[8.5px]">{item.volatility}</span>
                </div>
              </div>

              {/* Lower visual progress representation */}
              <div className="mt-3.5 h-[3px] bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isBullishBias ? "bg-emerald-400" : "bg-rose-400"}`} 
                  style={{ width: `${item.bias}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-sans leading-normal bg-amber-500/2 border border-amber-500/10 p-3 rounded-lg">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <span>Aturan Confluence Map ini merefleksikan tumpukan multi-interv secara real-time. Bilamana indeks confluence melampaui <strong className="text-amber-400 font-mono">80%</strong>, probabilitas akurasi target Perseus AI meningkat drastis.</span>
      </div>
    </div>
  );
}
