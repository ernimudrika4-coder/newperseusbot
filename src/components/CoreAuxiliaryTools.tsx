import React, { useState, useEffect } from "react";
import { 
  Volume2, VolumeX, ShieldAlert, Cpu, Activity, Clock, Flame, 
  TrendingUp, TrendingDown, RefreshCw, Layers, CheckCircle2 
} from "lucide-react";

// Web Audio API Synthesizer for pure browser-synthesized audio cues
export function playSyntheticBeep(freq: number, type: OscillatorType = "sine", duration: number = 0.15, volume: number = 0.05) {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Fail silently on browsers block policy
  }
}

// Subcomponent: Live Audio Synths control panel
export function AcousticAudioController() {
  const [muted, setMuted] = useState<boolean>(false);
  const [toneType, setToneType] = useState<OscillatorType>("sine");
  const [frequency, setFrequency] = useState<number>(550);

  const testTone = () => {
    if (muted) return;
    playSyntheticBeep(frequency, toneType, 0.4, 0.08);
  };

  useEffect(() => {
    if (!muted) {
      // Gentle system boot notification sound
      playSyntheticBeep(440, "sine", 0.5, 0.04);
      setTimeout(() => playSyntheticBeep(550, "sine", 0.3, 0.04), 160);
    }
  }, [muted]);

  return (
    <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/[0.02] rounded-full blur-xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-900">
        <h4 className="font-display font-black text-[11px] text-[#f8fafc] uppercase tracking-wider flex items-center gap-2">
          {muted ? <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
          TELEMETRY AUDIO COMPASS
        </h4>
        <button 
          onClick={() => setMuted(!muted)}
          className={`px-3 py-1 font-mono text-[9px] font-black rounded uppercase tracking-wider transition-all duration-300 ${
            muted 
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" 
              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20"
          }`}
        >
          {muted ? "MUTED" : "SYNTH ACTIVE"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mb-1.5 font-bold uppercase">
            <span>Synth Tone Pitch</span>
            <span className="text-cyan-400">{frequency} Hz ({toneType.toUpperCase()})</span>
          </div>
          <input 
            type="range"
            min="220"
            max="1200"
            step="10"
            value={frequency}
            onChange={(e) => {
              setFrequency(Number(e.target.value));
              if (!muted) playSyntheticBeep(Number(e.target.value), toneType, 0.08, 0.03);
            }}
            className="w-full h-1 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["sine", "triangle", "sawtooth"] as OscillatorType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setToneType(type);
                if (!muted) playSyntheticBeep(frequency, type, 0.2, 0.05);
              }}
              className={`px-2 py-1.5 rounded text-[10px] font-mono font-black border transition-all uppercase ${
                toneType === type
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
                  : "bg-black/40 text-gray-400 border-gray-900 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          onClick={testTone}
          disabled={muted}
          className="w-full py-2.5 rounded-lg bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 font-display font-black text-[9.5px] uppercase tracking-widest border border-cyan-500/25 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          💥 TEST ACOUSTIC CHIME WAVE
        </button>

        <span className="block text-[8px] font-mono text-slate-500 text-center leading-relaxed">
          Setiap pergeseran quotes spot atau eksekusi Sinyal TakeProfit akan disintesiskan secara lembut tanpa merusak fokus perdagangan Anda.
        </span>
      </div>
    </div>
  );
}

// Subcomponent: MTF Screener
interface TechnicalScreenerProps {
  currentQuote: number;
}
export function TechnicalScreener({ currentQuote }: TechnicalScreenerProps) {
  const [scanTime, setScanTime] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);

  const keyTimeframes = [
    { tf: "M5", rsi: 52, trend: "BULLISH CONFLUENCE", ma20: currentQuote - 2.50, action: "STRONG BUY" },
    { tf: "M15", rsi: 59, trend: "BREAKOUT LIQUIDITY", ma20: currentQuote - 4.10, action: "BUY" },
    { tf: "M30", rsi: 61, trend: "RETEST BLOCK TARGET", ma20: currentQuote - 6.40, action: "BUY" },
    { tf: "H1", rsi: 48, trend: "CONSOLIDATION ZONE", ma20: currentQuote + 1.20, action: "NEUTRAL / HOLD" },
    { tf: "H4", rsi: 41, trend: "DEMAND ZONE ACCUMULATIVE", ma20: currentQuote + 12.80, action: "BUY PROFILE" },
    { tf: "D1", rsi: 65, trend: "STRONG BULLISH WAVE", ma20: currentQuote - 55.40, action: "STRONG ACCUMULATION" }
  ];

  const triggerManualScan = () => {
    setScanning(true);
    playSyntheticBeep(1100, "triangle", 0.1, 0.02);
    setTimeout(() => {
      setScanTime(new Date().toLocaleTimeString());
      setScanning(false);
      playSyntheticBeep(1320, "sine", 0.2, 0.02);
    }, 600);
  };

  useEffect(() => {
    setScanTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.01] rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-900">
        <h4 className="font-display font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
          MULTI-TIMEFRAME QUANT CONFLUENCE
        </h4>
        <button 
          onClick={triggerManualScan}
          disabled={scanning}
          className="p-1 rounded bg-[#030305] border border-gray-900 text-gray-500 hover:text-amber-400 transition-all cursor-pointer"
          title="Force Screener Recalculation"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-amber-500" : ""}`} />
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-5 text-[8px] font-mono text-gray-500 uppercase font-black tracking-widest pb-1 border-b border-gray-950 px-1">
          <span>TF</span>
          <span>RSI (14)</span>
          <span className="col-span-2">TRENDING STATUS</span>
          <span className="text-right">ZONE ACTION</span>
        </div>

        {keyTimeframes.map((item) => {
          const isBull = item.action.includes("BUY");
          const isNeutral = item.action.includes("NEUTRAL");
          return (
            <div 
              key={item.tf} 
              className="grid grid-cols-5 items-center bg-[#030305]/65 border border-gray-950 p-2.5 rounded-lg text-xs font-mono transition-all hover:border-gray-900"
            >
              <span className="font-black text-white text-xs">{item.tf}</span>
              <span className={`font-bold ${item.rsi > 50 ? "text-emerald-400" : "text-rose-400"}`}>
                {item.rsi}
              </span>
              <span className="col-span-2 text-[10px] text-slate-400 font-medium tracking-tight">
                {item.trend}
              </span>
              <span className={`text-right font-black text-[9px] uppercase tracking-wider ${
                isBull ? "text-[#00ff66]" : isNeutral ? "text-slate-500" : "text-rose-400"
              }`}>
                {item.action}
              </span>
            </div>
          );
        })}

        <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 mt-2">
          <span>SNAPSHOT CORE: MULTI-TIME FRAME DECK</span>
          <span>STAMP: {scanTime}</span>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: GVX Volatility meter
export function GoldVolatilityIndex() {
  const [gvxValue, setGvxValue] = useState<number>(24.8);
  const [volatilityState, setVolatilityState] = useState<string>("OPTIMAL / HIGH LIQUIDITY");

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate micro tension swings in Gold Volatility
      setGvxValue((prev) => {
        const delta = (Math.random() - 0.5) * 1.8;
        const bounded = Math.max(12.0, Math.min(68.0, prev + delta));
        
        if (bounded > 45) {
          setVolatilityState("HIGH RANGE BURST (DANGER)");
        } else if (bounded < 18) {
          setVolatilityState("LOW COMPRESSION CONSOLIDATION");
        } else {
          setVolatilityState("OPTIMAL SYSTEM LIQUIDITY");
        }
        return Number(bounded.toFixed(1));
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const gaugePercentage = Math.min(100, (gvxValue / 80) * 100);

  return (
    <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.01] rounded-full blur-xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-red-500 via-transparent to-transparent" />
      
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-900">
        <h4 className="font-display font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-400 animate-pulse" />
          GOLD VOLATILITY INDEX (GVX)
        </h4>
        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/25 font-bold">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[9px] font-mono text-gray-500 block uppercase font-bold">VOLATILITY SCORE</span>
            <div className="font-mono text-3xl font-black text-white hover:text-red-400 transition-colors duration-300">
              {gvxValue.toFixed(1)} <span className="text-xs text-slate-500 font-normal">POINTS</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-gray-500 block uppercase font-bold">MARKET COMPRESSION</span>
            <span className={`text-[10px] font-mono font-black ${gvxValue > 42 ? "text-red-400 animate-pulse" : gvxValue < 18 ? "text-amber-400" : "text-[#00ff66]"}`}>
              {volatilityState}
            </span>
          </div>
        </div>

        {/* Custom Visual Liquid Scale meter */}
        <div className="w-full h-2 rounded-full bg-[#030305] border border-gray-950 overflow-hidden relative">
          <div 
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#00ff66] via-amber-500 to-red-500" 
            style={{ width: `${gaugePercentage}%` }}
          />
          <div className="absolute top-0 bottom-0 w-[1.5px] bg-white opacity-40 left-[25%]" />
          <div className="absolute top-0 bottom-0 w-[1.5px] bg-white opacity-40 left-[50%]" />
          <div className="absolute top-0 bottom-0 w-[1.5px] bg-white opacity-40 left-[75%]" />
        </div>

        <div className="grid grid-cols-4 font-mono text-[8px] text-gray-600 uppercase text-center font-bold">
          <span>12.0 (Low)</span>
          <span>25.0 (Optimal)</span>
          <span>45.0 (Critical)</span>
          <span>68.0+ (Extreme)</span>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Trading Sessions indicator
export function TradingSessions() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getSessionStatus = (startHr: number, endHr: number) => {
    // Basic standard GMT check for Tokyo, Sydney, London, New York
    const gmtHr = currentTime.getUTCHours();
    if (gmtHr >= startHr && gmtHr < endHr) {
      return "ACTIVE";
    }
    // Calculate countdown or display pending
    return "CLOSED";
  };

  const sessions = [
    { name: "Sydney Session", start: 22, end: 7, activeGmt: "22:00 - 07:00 GMT", sens: "LOW RANGE" },
    { name: "Tokyo Session", start: 0, end: 9, activeGmt: "00:00 - 09:00 GMT", sens: "MID SPREAD" },
    { name: "London Session", start: 8, end: 17, activeGmt: "08:00 - 17:00 GMT", sens: "EXTREME VOLATILITY" },
    { name: "New York Session", start: 13, end: 22, activeGmt: "13:00 - 22:00 GMT", sens: "HIGHEST VOLUME" }
  ];

  return (
    <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-900">
        <h4 className="font-display font-black text-[11px] text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00ff66]" />
          GLOBAL LIQUIDITY SESSIONS OVERLAP
        </h4>
        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wide">
          {currentTime.toLocaleTimeString()} UTC
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sessions.map((sess) => {
          const status = getSessionStatus(sess.start, sess.end);
          const isActive = status === "ACTIVE";
          
          return (
            <div 
              key={sess.name}
              className={`p-3 rounded-xl border transition-all ${
                isActive 
                  ? "bg-slate-950/40 border-emerald-500/20 shadow-[inset_0_1px_10px_rgba(0,255,102,0.03)]" 
                  : "bg-black/35 border-gray-950"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-sans font-bold text-white">{sess.name}</span>
                <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest ${
                  isActive 
                    ? "bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 animate-pulse" 
                    : "bg-gray-950 text-gray-500"
                }`}>
                  {status}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{sess.activeGmt}</span>
                <span className={`font-bold ${
                  isActive 
                    ? "text-orange-400 animate-pulse" 
                    : "text-slate-600"
                }`}>
                  {sess.sens}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
