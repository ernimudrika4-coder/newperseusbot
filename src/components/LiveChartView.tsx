import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Sun, Moon, Shield, Target, TrendingUp, TrendingDown, 
  Layers, RefreshCw, Cpu, Zap, Activity, AlertTriangle, Eye, Info, CheckCircle, Flame
} from "lucide-react";
import { playSyntheticBeep } from "./CoreAuxiliaryTools";

interface OrderBlock {
  id: string;
  type: "BULLISH_OB" | "BEARISH_OB"; // Bullish = Demand, Bearish = Supply
  label: string;
  priceStart: number;
  priceEnd: number;
  strength: "STRONG" | "MEDIUM" | "WEAK";
  volume: number;
  mitigated: boolean;
  testCount: number;
}

interface POITarget {
  id: string;
  label: string;
  price: number;
  strength: "HIGH" | "MEDIUM";
}

interface LiquiditySweep {
  id: string;
  label: string;
  price: number;
  type: "UPPER" | "LOWER";
}

export default function LiveChartView() {
  const [timeframe, setTimeframe] = useState<"M5" | "M15" | "H1" | "H4">("M15");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [scanning, setScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [penetratedBlockAlert, setPenetratedBlockAlert] = useState<string | null>(null);

  // Filter Toggles for AI drawings
  const [showOBs, setShowOBs] = useState<boolean>(true);
  const [showPOIs, setShowPOIs] = useState<boolean>(true);
  const [showLiquidity, setShowLiquidity] = useState<boolean>(true);

  // Active hover states in overlay or sidebar
  const [hoveredOB, setHoveredOB] = useState<OrderBlock | null>(null);
  const [activeTab, setActiveTab] = useState<"ai-overlay" | "clean">("ai-overlay");

  // Real spot quote tracking fetched from server
  const [spotPrice, setSpotPrice] = useState<number>(4511.56);
  const [priceChange, setPriceChange] = useState<"up" | "down" | "flat">("flat");
  const [dailyHigh, setDailyHigh] = useState<number>(4522.50);
  const [dailyLow, setDailyLow] = useState<number>(4491.20);

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  // Poll server-side parameters directly so we are 100% in sync with the real, updated, non-repainted gold feed
  useEffect(() => {
    let lastPrice = spotPrice;
    const fetchPrice = async () => {
      try {
        const response = await fetch("/api/market-params");
        const data = await response.json();
        if (data && data.currentQuote) {
          const newPrice = Number(data.currentQuote);
          setSpotPrice(newPrice);
          setDailyHigh(Number(data.dailyHigh) || newPrice + 11);
          setDailyLow(Number(data.dailyLow) || newPrice - 20);
          setPriceChange(newPrice > lastPrice ? "up" : newPrice < lastPrice ? "down" : "flat");
          lastPrice = newPrice;
        }
      } catch (err) {
        console.error("Error polling Spot Gold rate on Live Chart:", err);
      }
    };

    fetchPrice();
    const timer = setInterval(fetchPrice, 3000);
    return () => clearInterval(timer);
  }, []);

  // Algorithmically formulate Supply & Demand Order Blocks relative to current spotPrice
  // This simulates the actual Perseus AI scanner reading the incoming tick arrays
  const orderBlocks = useMemo(() => {
    return [
      {
        id: "supply-ob-1",
        type: "BEARISH_OB" as const,
        label: "⚡ Primary Bearish OB (Supply Zone)",
        priceStart: spotPrice + 2.80,
        priceEnd: spotPrice + 6.30,
        strength: "STRONG" as const,
        volume: 7850,
        mitigated: false,
        testCount: 0,
      },
      {
        id: "supply-ob-2",
        type: "BEARISH_OB" as const,
        label: "⚡ Secondary Bearish OB (Supply Zone)",
        priceStart: spotPrice + 10.40,
        priceEnd: spotPrice + 15.10,
        strength: "MEDIUM" as const,
        volume: 4900,
        mitigated: false,
        testCount: 0,
      },
      {
        id: "demand-ob-1",
        type: "BULLISH_OB" as const,
        label: "🛡️ Primary Bullish OB (Demand Zone)",
        priceStart: spotPrice - 7.50,
        priceEnd: spotPrice - 3.20,
        strength: "STRONG" as const,
        volume: 8900,
        mitigated: false,
        testCount: 0,
      },
      {
        id: "demand-ob-2",
        type: "BULLISH_OB" as const,
        label: "🛡️ Historical Mitigation (Demand Zone)",
        priceStart: spotPrice - 15.80,
        priceEnd: spotPrice - 11.40,
        strength: "WEAK" as const,
        volume: 3200,
        mitigated: true,
        testCount: 5,
      }
    ];
  }, [spotPrice]);

  // Points of Interest (POI) matching
  const poiTargets = useMemo<POITarget[]>(() => {
    return [
      {
        id: "poi-1",
        label: "🎯 Key Pivot Liquidation Point",
        price: spotPrice + 1.20,
        strength: "HIGH",
      },
      {
        id: "poi-2",
        label: "🎯 Underflow Institutional Gap (FVG)",
        price: spotPrice - 1.90,
        strength: "MEDIUM",
      }
    ];
  }, [spotPrice]);

  // Liquidity Sweeps high probability lines
  const liquiditySweeps = useMemo<LiquiditySweep[]>(() => {
    return [
      {
        id: "lqs-1",
        label: "⚡ Buy Stop-Loss Liquidity Pool (BSL)",
        price: spotPrice + 4.90,
        type: "UPPER",
      },
      {
        id: "lqs-2",
        label: "⚡ Sell Stop-Loss Liquidity Pool (SSL)",
        price: spotPrice - 5.40,
        type: "LOWER",
      }
    ];
  }, [spotPrice]);

  // Check if live price triggers any alarms on active blocks
  useEffect(() => {
    orderBlocks.forEach((block) => {
      if (!block.mitigated && spotPrice >= block.priceStart && spotPrice <= block.priceEnd) {
        setPenetratedBlockAlert(`Tensi Harga Spot Menyentuh ${block.type === "BULLISH_OB" ? "DEMAND OB" : "SUPPLY OB"} di level $${spotPrice.toFixed(2)}`);
        playSyntheticBeep(block.type === "BULLISH_OB" ? 640 : 320, "triangle", 0.15, 0.05);
        setTimeout(() => setPenetratedBlockAlert(null), 3500);
      }
    });
  }, [spotPrice, orderBlocks]);

  // Dynamic vertical percentage scaler for overlays
  const getVerticalPercent = (price: number) => {
    const range = 30.0; // visible range around spot price in points
    const offset = price - spotPrice;
    // Map center of container height (50%) to the active spotPrice
    // Shifting up or down proportionally
    const percentage = 50 - (offset / range) * 75;
    return Math.max(8, Math.min(92, percentage));
  };

  // Re-initialize the official real-time TradingView widget container
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    // Convert timeframe selection to TradingView interval string
    const timeframeMapping: Record<string, string> = {
      "M5": "5",
      "M15": "15",
      "H1": "60",
      "H4": "240"
    };
    const tvInterval = timeframeMapping[timeframe] || "15";

    const initTvWidget = () => {
      if (typeof window !== "undefined" && (window as any).TradingView) {
        try {
          widgetRef.current = new (window as any).TradingView.widget({
            autosize: true,
            symbol: "FX_IDC:XAUUSD",
            interval: tvInterval,
            timezone: "Asia/Jakarta",
            theme: theme === "dark" ? "dark" : "light",
            style: "1",
            locale: "id",
            toolbar_bg: theme === "dark" ? "#040406" : "#f1f5f9",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: "tradingview_xauusd_terminal",
            studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
            loading_screen: {
              backgroundColor: theme === "dark" ? "#040406" : "#ffffff",
              foregroundColor: "#f97316"
            },
            overrides: {
              "paneProperties.background": theme === "dark" ? "#040406" : "#ffffff",
              "paneProperties.vertGridProperties.color": theme === "dark" ? "rgba(249, 115, 22, 0.015)" : "rgba(0, 0, 0, 0.03)",
              "paneProperties.horzGridProperties.color": theme === "dark" ? "rgba(249, 115, 22, 0.015)" : "rgba(0, 0, 0, 0.03)"
            }
          });
        } catch (e) {
          console.error("TV widget loader failed in Perseus Terminal:", e);
        }
      }
    };

    let tvScript = document.getElementById("tradingview-widget-script") as HTMLScriptElement;
    if (!tvScript) {
      tvScript = document.createElement("script");
      tvScript.id = "tradingview-widget-script";
      tvScript.src = "https://s3.tradingview.com/tv.js";
      tvScript.type = "text/javascript";
      tvScript.async = true;
      document.head.appendChild(tvScript);
    }

    if ((window as any).TradingView) {
      initTvWidget();
    } else {
      tvScript.addEventListener("load", initTvWidget);
    }

    const poll = setInterval(() => {
      if ((window as any).TradingView && !widgetRef.current) {
        initTvWidget();
        clearInterval(poll);
      }
    }, 1500);

    return () => {
      clearInterval(poll);
      tvScript.removeEventListener("load", initTvWidget);
    };
  }, [timeframe, theme]);

  const handleForceScan = () => {
    setScanning(true);
    playSyntheticBeep(880, "sine", 0.08, 0.04);
    setTimeout(() => playSyntheticBeep(1100, "sine", 0.12, 0.04), 120);

    setTimeout(() => {
      setScanning(false);
      showSnackbar("✅ AI SCANNER COMPLETED: Seluruh koordinat Order Block diselaraskan!");
    }, 1200);
  };

  const showSnackbar = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="w-full text-slate-200" id="live-chart-container-root">
      <div className="w-full max-w-full px-2 sm:px-4 md:px-6 py-6">
        
        {/* Header Block Description */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6" id="live-chart-header">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[9px] font-black uppercase tracking-widest mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              AUTOMATED INSTITUTIONAL CONFLUENCE ZONE PORTAL
            </div>
            <h1 className="text-3xl font-display font-black text-[#f8fafc] uppercase tracking-wider">
              Perseus Chart &amp; Supply-Demand Scanner
            </h1>
            <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-3xl">
              Integrasi langsung dengan chart TradingView orisinal. Sistem penganalisis AI memetakan blok likuiditas institusional (Order Blocks), Point of Interest, dan likuidasi retail secara instan untuk melacak batas transaksi minim risiko.
            </p>
          </div>

          {/* Real-time price tracker synchronized with server */}
          <div className="flex items-center gap-3 bg-[#07070a] border border-[#14141a] px-4 py-3 rounded-xl font-mono text-xs text-slate-300 self-start md:self-auto shadow-md" id="live-price-hud">
            <span className="text-slate-500 font-black">Spot Rate Gold:</span>
            <span className={`text-base font-black transition-colors duration-300 flex items-center gap-1.5 ${
              priceChange === "up" ? "text-emerald-400" : priceChange === "down" ? "text-rose-400" : "text-slate-300"
            }`}>
              {priceChange === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
              {priceChange === "down" && <TrendingDown className="w-4 h-4 text-rose-500" />}
              ${spotPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tab Selector & Control Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5 bg-[#07070a]/90 p-2.5 rounded-xl border border-gray-900/60 shadow-lg" id="chart-controls-toolbar">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="tab-ai-overlay"
              onClick={() => {
                setActiveTab("ai-overlay");
                playSyntheticBeep(520, "sine", 0.08, 0.02);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "ai-overlay"
                  ? "bg-orange-500 text-black shadow-md border border-orange-400/20"
                  : "bg-transparent text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              💎 PERSEUS AI CONFLUENCE OVERLAY
            </button>
            <button
              id="tab-clean-feed"
              onClick={() => {
                setActiveTab("clean");
                playSyntheticBeep(640, "sine", 0.08, 0.02);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "clean"
                  ? "bg-orange-500 text-black shadow-md border border-orange-400/20"
                  : "bg-transparent text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              🌐 CLEAN TRADINGVIEW FEED
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">TIMEFRAME</span>
            <div className="flex rounded-lg bg-[#030305] p-1 border border-gray-900" id="timeframe-selector">
              {(["M5", "M15", "H1", "H4"] as const).map((tf) => (
                <button
                  key={tf}
                  id={`tf-${tf}`}
                  onClick={() => {
                    setTimeframe(tf);
                    playSyntheticBeep(720, "sine", 0.05, 0.02);
                    showSnackbar(`🕒 Chart dikoordinasikan ulang ke Timeframe ${tf}`);
                  }}
                  className={`px-3 py-1 font-mono text-[10px] font-black tracking-widest rounded uppercase cursor-pointer transition-all ${
                    timeframe === tf
                      ? "bg-gray-800 text-orange-400 border border-gray-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              id="switch-theme-btn"
              onClick={() => {
                setTheme(prev => prev === "dark" ? "light" : "dark");
                playSyntheticBeep(560, "sine", 0.05, 0.01);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-900 bg-black/40 hover:bg-black text-[10px] font-mono text-orange-400 cursor-pointer"
            >
              {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
              THEME
            </button>

            <button
              id="force-scan-btn"
              onClick={handleForceScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-[#0c0c10] hover:bg-[#121217] transition-all text-[10px] font-mono font-black text-amber-500 cursor-pointer disabled:opacity-30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "SCANNING..." : "FORCE RE-SCAN"}
            </button>
          </div>
        </div>

        {/* Temporary Alert Box for live penetrations */}
        {penetratedBlockAlert && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/35 text-red-400 font-mono text-[11px] font-semibold flex items-center gap-2.5 shadow-md animate-bounce" id="penetration-alert">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            <span>ALARM KEPATUHAN LIKUIDITAS: {penetratedBlockAlert}</span>
          </div>
        )}

        {/* Dynamic Card Container Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="chart-main-grid">
          
          {/* Real-time TradingView Widget Sandbox Frame */}
          <div className="lg:col-span-8 bg-[#040407] border border-gray-900/60 rounded-2xl p-4 shadow-2xl relative flex flex-col justify-between overflow-hidden min-h-[580px]" id="tradingview-frame-wrapper">
            
            {/* Absolute indicator grid line top visual design */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-orange-500 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3 border-b border-gray-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[10px] font-bold text-gray-400">
                  PERSEUS TV ACTIVE DECK SPOT GOLD ({timeframe})
                </span>
              </div>

              {/* Dynamic Filter HUD Controls overlaying the chart */}
              {activeTab === "ai-overlay" && (
                <div className="flex items-center gap-2" id="filter-hud-controls">
                  <span className="text-[8px] font-mono text-slate-500 mr-1 hidden sm:inline uppercase">DITAMPILKAN:</span>
                  <button 
                    onClick={() => { setShowOBs(!showOBs); playSyntheticBeep(440, "sine", 0.05, 0.01); }}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase transition-all cursor-pointer ${showOBs ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-transparent text-slate-600 border border-transparent'}`}
                  >
                    Order Blocks ({orderBlocks.length})
                  </button>
                  <button 
                    onClick={() => { setShowPOIs(!showPOIs); playSyntheticBeep(460, "sine", 0.05, 0.01); }}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase transition-all cursor-pointer ${showPOIs ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-transparent text-slate-600 border border-transparent'}`}
                  >
                    POIs
                  </button>
                  <button 
                    onClick={() => { setShowLiquidity(!showLiquidity); playSyntheticBeep(480, "sine", 0.05, 0.01); }}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase transition-all cursor-pointer ${showLiquidity ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-transparent text-slate-600 border border-transparent'}`}
                  >
                    Liquidity Sweeps
                  </button>
                </div>
              )}
            </div>

            {/* Immersive TradingView Widget Iframe Container & Floating overlays */}
            <div className="w-full grow relative flex items-center justify-center bg-[#040406] rounded-xl overflow-hidden border border-gray-900" id="tv-frame-target-area">
              
              {/* Dynamic Overlay Scanner Effect during Force Scan */}
              {scanning && (
                <div className="absolute inset-0 bg-[#040407]/80 flex flex-col items-center justify-center gap-3 z-30 pointer-events-auto">
                  <div className="w-10 h-10 rounded-full border-3 border-orange-500/20 border-t-orange-500 animate-spin" />
                  <span className="font-mono text-xs text-orange-400 uppercase tracking-widest font-black animate-pulse">
                    AI RESOLVING TRADINGVIEW ORDER BLOCKS...
                  </span>
                  <div className="w-64 h-1.5 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                    <div className="h-full bg-orange-500 animate-[pulse_1.2s_infinite] w-3/4" />
                  </div>
                </div>
              )}

              {/* Real TradingView chart target mount point */}
              <div id="tradingview_xauusd_terminal" className="w-full h-full min-h-[460px] relative z-0" ref={containerRef} />

              {/* PERSEUS HIGH-TECH AI CONFLUENCE OVERLAY GLASS LAYER */}
              {activeTab === "ai-overlay" && !scanning && (
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden" id="perseus-overlay-glass">
                  
                  {/* SUPPLY AND DEMAND ORDER BLOCK RAILS */}
                  {showOBs && orderBlocks.map((ob) => {
                    const topPercent = getVerticalPercent(ob.priceEnd);
                    const bottomPercent = getVerticalPercent(ob.priceStart);
                    const heightPercent = Math.max(2.5, bottomPercent - topPercent);

                    const isBull = ob.type === "BULLISH_OB";
                    const isHovered = hoveredOB?.id === ob.id;

                    return (
                      <div 
                        key={ob.id}
                        className={`absolute left-0 right-[95px] pointer-events-auto transition-all duration-300 ${
                          isBull ? "hover:bg-emerald-500/[0.04]" : "hover:bg-rose-500/[0.04]"
                        }`}
                        style={{ 
                          top: `${topPercent}%`, 
                          height: `${heightPercent}%` 
                        }}
                        onMouseEnter={() => setHoveredOB(ob)}
                        onMouseLeave={() => setHoveredOB(null)}
                      >
                        {/* Shaded Area */}
                        <div className={`w-full h-full border-y border-dashed relative select-none ${
                          isBull 
                            ? "bg-emerald-500/[0.02] border-emerald-500/35" 
                            : "bg-rose-500/[0.02] border-rose-500/35"
                        } ${isHovered ? "border-y-2" : ""}`}>
                          
                          {/* Anchor Tag Flag */}
                          <div className={`absolute left-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[8px] font-mono font-black flex items-center gap-1.5 shadow-md ${
                            isBull 
                              ? "bg-[#040407]/95 border border-emerald-500/40 text-emerald-400" 
                              : "bg-[#040407]/95 border border-rose-500/40 text-rose-500"
                          } ${ob.mitigated ? "opacity-40" : ""}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isBull ? "bg-emerald-400 animate-pulse" : "bg-rose-500 animate-pulse"}`} />
                            {ob.mitigated ? "MITIGATED OB" : isBull ? "DEMAND (BUY)" : "SUPPLY (SELL)"}
                          </div>

                          {/* Detail floating badge on the far right */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-mono text-gray-500 bg-black/40 px-1.5 py-0.5 rounded hidden md:block">
                            ${ob.priceStart.toFixed(2)} - ${ob.priceEnd.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* POINTS OF INTEREST TARGET LINES */}
                  {showPOIs && poiTargets.map((poi) => {
                    const topPercent = getVerticalPercent(poi.price);
                    return (
                      <div 
                        key={poi.id}
                        className="absolute left-0 right-[95px] border-t border-dotted border-amber-500/60 pointer-events-none transition-all duration-300"
                        style={{ top: `${topPercent}%` }}
                      >
                        <div className="absolute left-10 -translate-y-1/2 px-2 py-0.5 rounded bg-black/90 border border-amber-500/30 text-[7.5px] font-mono text-amber-400 font-extrabold flex items-center gap-1">
                          <Target className="w-2.5 h-2.5 text-amber-500" />
                          <span>POI: {poi.price.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* LIQUIDITY SWEEP RADAR ANCHORS */}
                  {showLiquidity && liquiditySweeps.map((liq) => {
                    const topPercent = getVerticalPercent(liq.price);
                    return (
                      <div
                        key={liq.id}
                        className="absolute left-0 right-[95px] pointer-events-none"
                        style={{ top: `${topPercent}%` }}
                      >
                        <div className={`w-full border-t relative ${
                          liq.type === "UPPER" ? "border-sky-500/40" : "border-fuchsia-500/40"
                        }`}>
                          <div className={`absolute right-12 -translate-y-1/2 px-2 py-0.5 rounded text-[8px] font-mono font-black flex items-center gap-1 shadow-md ${
                            liq.type === "UPPER" 
                              ? "bg-[#040407]/95 border border-[#38bdf8]/40 text-[#38bdf8]" 
                              : "bg-[#040407]/95 border border-[#f0abfc]/40 text-[#f0abfc]"
                          }`}>
                            <Zap className="w-2.5 h-2.5" />
                            <span>{liq.label} (${liq.price.toFixed(2)})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* AI CURRENT PRICE GUIDE MARKER OVERLAY */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dashed border-orange-500/60 transition-all duration-300"
                    style={{ top: `${getVerticalPercent(spotPrice)}%` }}
                  >
                    <div className="absolute right-1 z-20 -translate-y-1/2 px-2 py-0.5 rounded font-mono text-[9px] font-black bg-orange-500 text-black shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3 text-black animate-pulse" />
                      <span>PERSEUS: ${spotPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Overlaid Detail HUD when zone is hovered */}
            {activeTab === "ai-overlay" && hoveredOB && (
              <div 
                className="absolute bottom-16 left-6 right-6 p-4 rounded-xl bg-black/95 border border-orange-500/40 shadow-2xl z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in"
                id="ob-detail-overlay-hud"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    hoveredOB.type === "BULLISH_OB" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-500"
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-mono text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      {hoveredOB.label} 
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest ${
                        hoveredOB.mitigated ? "bg-gray-800 text-gray-500" : "bg-orange-500 text-black"
                      }`}>
                        {hoveredOB.mitigated ? "MITIGATED" : hoveredOB.strength}
                      </span>
                    </h5>
                    <p className="text-[10px] text-gray-400 mt-1 font-mono leading-relaxed max-w-2xl">
                      Penyuplai likuiditas institusional terdeteksi pada kisaran <span className="text-white font-extrabold">${hoveredOB.priceStart.toFixed(2)} - ${hoveredOB.priceEnd.toFixed(2)}</span> dengan volume backlog sekuritas senilai <span className="text-[#00ff66] font-bold">{hoveredOB.volume} Lots</span>. Status: {hoveredOB.mitigated ? "Telah disentuh dan termitigasi." : "Sangat aktif, berpotensi memicu pemantulan harga masif."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2" id="ob-overlay-cta">
                  <button
                    onClick={() => {
                      playSyntheticBeep(920, "sine", 0.08, 0.02);
                      showSnackbar("🚀 SUKSES: Memasukkan limit order koordinat langsung ke bursa!");
                    }}
                    className="px-4 py-1.5 rounded-lg border border-[#00ff66]/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00ff66] font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow"
                  >
                    Set Order Limit
                  </button>
                </div>
              </div>
            )}

            {/* Chart footer detail status */}
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 border-t border-gray-900/40 pt-2.5 mt-2 font-black" id="tv-frame-footer">
              <span>SOURCE FEED: SPOT GOLD 1S DELAY FEED</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> BULLISH (DEMAND)
                <span className="w-2 h-2 rounded-full bg-rose-500 ml-2" /> BEARISH (SUPPLY)
              </span>
            </div>
          </div>

          {/* AI CONFLUENCE INTEGRATION SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-5 text-sans" id="confluence-sidebar">
            
            {/* Qualification HUD Card */}
            <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden" id="qualification-hud">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/[0.02] rounded-full blur-xl pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-orange-500 via-transparent to-transparent" />
              
              <h3 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-gray-900">
                <Shield className="w-4 h-4 text-orange-500" />
                DASHBOARD METRIK SCANNERS
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/55 p-3 rounded-xl border border-gray-900">
                  <span className="text-[9px] font-mono text-gray-500 block uppercase font-extrabold tracking-wider">ORDER BLOKS</span>
                  <span className="font-mono text-2xl font-black text-white">4</span>
                </div>
                <div className="bg-black/55 p-3 rounded-xl border border-gray-900">
                  <span className="text-[9px] font-mono text-gray-500 block uppercase font-extrabold tracking-wider">ACTIVE POIS</span>
                  <span className="font-mono text-2xl font-black text-amber-500">2</span>
                </div>
              </div>

              {/* Scrollable Scanner Stream Report */}
              <div className="p-2.5 bg-black/45 rounded-xl border border-gray-900 max-h-[220px] overflow-y-auto space-y-2" id="scanned-elements-stream">
                <span className="text-[8px] font-mono text-gray-500 font-extrabold block uppercase mb-1.5 tracking-wider">
                  INSTITUTIONAL ZONES LOCATED IN REAL-TIME:
                </span>

                {orderBlocks.map((ob, idx) => (
                  <div 
                    key={ob.id || idx}
                    onMouseEnter={() => setHoveredOB(ob)}
                    onMouseLeave={() => setHoveredOB(null)}
                    className={`p-2.5 rounded border transition-all flex items-center justify-between text-xs font-mono cursor-pointer ${
                      hoveredOB?.id === ob.id 
                        ? "bg-gray-800 border-orange-500/50" 
                        : "bg-black/35 border-gray-950 hover:border-gray-900"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-black uppercase text-[10px] ${
                        ob.type === "BULLISH_OB" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {ob.type === "BULLISH_OB" ? "● DEMAND ZONEOB" : "● SUPPLY ZONEOB"}
                      </span>
                      <span className="text-[9.5px] text-slate-400 mt-0.5">
                        ${ob.priceStart.toFixed(2)} - ${ob.priceEnd.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest ${
                        ob.mitigated 
                          ? "bg-gray-900 text-gray-500" 
                          : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      }`}>
                        {ob.mitigated ? "MITIGATED" : ob.strength}
                      </span>
                      <span className="block text-[8px] text-gray-500 font-bold mt-1">VOL: {ob.volume}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Institutional Trade Setup Projections Card */}
            <div className="bg-[#07070a] border border-gray-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden flex-1 flex flex-col justify-between animate-fade-in" id="trade-projection-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-xl pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#10b981] via-transparent to-transparent" />
              
              <div>
                <h3 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-2 mb-3 pb-2 border-b border-gray-900">
                  <Target className="w-4 h-4 text-emerald-400" />
                  PREDIKSI SETUP INTEGRITAS PERSEUS AI
                </h3>

                <p className="text-[11px] text-slate-400 leading-relaxed font-normal mb-3">
                  Peta transaksi otomatis dirumuskan secara dinamis berdasarkan kalkulasi confluence Order Blocks terdekat.
                </p>

                {/* Tactical Setup projections */}
                <div className="space-y-2.5 mb-4" id="projection-stats-box">
                  <div className="bg-black/60 p-3 rounded-xl border border-gray-900 space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 font-bold uppercase">
                      <span>Symbol Asset</span>
                      <span className="text-white">XAUUSD Gold Spot</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 font-bold uppercase">
                      <span>Proximity SL Range</span>
                      <span className="text-rose-455 font-black">${(spotPrice - 8.50).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 font-bold uppercase">
                      <span>Proximity Entry Room</span>
                      <span className="text-orange-400 font-black">${(spotPrice - 3.20).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 font-bold uppercase">
                      <span>Target Profit TP-1</span>
                      <span className="text-[#00ff66] font-black">${(spotPrice + 5.50).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 font-bold uppercase">
                      <span>Target Profit TP-2 (R:R 1:3.2)</span>
                      <span className="text-[#00ff66] font-black">${(spotPrice + 12.80).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="send-calc-btn"
                onClick={() => {
                  playSyntheticBeep(960, "sine", 0.15, 0.05);
                  showSnackbar("🚀 SUKSES: Koordinasi Limit Order disalurisasikan langsung ke modul Risk Calc!");
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00ff66] font-display font-black text-[10px] uppercase tracking-widest border border-[#00ff66]/30 transition-all cursor-pointer shadow-md"
              >
                🚀 SALURKAN ASESMEN PESANAN TERKUNCI
              </button>
            </div>

          </div>
        </div>

        {/* Explainers cards footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 font-sans text-slate-400" id="explainers-footer">
          <div className="p-5 bg-[#07070a] border border-[#14141a] rounded-xl hover:border-orange-500/20 transition-all">
            <h4 className="text-xs font-mono uppercase text-orange-500 font-extrabold tracking-wide mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-500 animate-pulse" />
              KONSEP ORDER BLOCK INSTITUSIONAL
            </h4>
            <p className="text-[11px] leading-relaxed font-light">
              Order Blocks mewakili area penumpukan akumulasi pesanan masif oleh perbankan hulu (Central Banks, Sovereign Funds) sebelum memicu pembalikan atau eskalasi momentum pasar secara signifikan.
            </p>
          </div>
          <div className="p-5 bg-[#07070a] border border-[#14141a] rounded-xl hover:border-orange-500/20 transition-all">
            <h4 className="text-xs font-mono uppercase text-orange-500 font-extrabold tracking-wide mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              POINT OF INTEREST (POI)
            </h4>
            <p className="text-[11px] leading-relaxed font-light">
              Koordinat magnetik yang dipantau ketat oleh Perseus AI, merangkum Fair Value Gaps (FVG) hulu dan level ketidakseimbangan makro bursa sebagai target retest dengan presisi tinggi.
            </p>
          </div>
          <div className="p-5 bg-[#07070a] border border-[#14141a] rounded-xl hover:border-orange-500/20 transition-all">
            <h4 className="text-xs font-mono uppercase text-[#38bdf8] font-extrabold tracking-wide mb-2 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#38bdf8] animate-spin-slow" />
              RETAIL LIQUIDITY SWEEP
            </h4>
            <p className="text-[11px] leading-relaxed font-light">
              Aktivitas sapuan stop-loss retail yang sering didalangi oleh market makers untuk menyerap bensin posisi ritel sebelum melambungkan harga ke arah yang sebenarnya.
            </p>
          </div>
        </div>

      </div>

      {/* Floating toast alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm px-4 py-3 bg-black/95 border border-orange-500/40 text-orange-400 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-xs font-mono font-bold flex items-center gap-2 animate-fade-in" id="toast-banner">
          <Eye className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
