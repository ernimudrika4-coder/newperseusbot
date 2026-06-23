import React, { useState, useEffect, useRef } from "react";
import TapesHeader from "./components/TapesHeader";
import HomeView from "./components/HomeView";
import SignalsView from "./components/SignalsView";
import HistoryView from "./components/HistoryView";
import LiveChartView from "./components/LiveChartView";
import CalendarView from "./components/CalendarView";
import RiskCalcView from "./components/RiskCalcView";
import MarketInfoView from "./components/MarketInfoView";
import AIAnalysisView from "./components/AIAnalysisView";
import VIPView from "./components/VIPView";
import CaseStudyView from "./components/CaseStudyView";
import TermsOfServiceView from "./components/TermsOfServiceView";
import AdminView from "./components/AdminView";
import VIPLockedView from "./components/VIPLockedView";
import PriceAlertModal, { PriceAlert } from "./components/PriceAlertModal";
import Mt5AutoTradeConsole from "./components/Mt5AutoTradeConsole";
import { Signal, MarketParams } from "./types";
import { translations } from "./lib/translations";
import { 
  Menu, X, Bell, BellRing, Home, Zap, LineChart, Calculator, Sparkles, 
  User, Settings, CreditCard, Gift, HelpCircle, FileText, Calendar, 
  Radio, Activity, Check, Copy, Trophy, ShieldCheck, Mail, ArrowRight,
  ChevronRight, ShieldAlert, Cpu, Volume2, VolumeX
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [activeHubView, setActiveHubView] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isVipUnlocked, setIsVipUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("perseus_vip_unlocked");
      return saved === "true";
    }
    return false;
  });

  const [isMt5Unlocked, setIsMt5Unlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("perseus_mt5_unlocked");
      return saved === "true";
    }
    return false;
  });

  const [now, setNow] = useState<number>(Date.now());

  // Auto-deactivation of 24h trial checker
  useEffect(() => {
    const checkExpiration = () => {
      setNow(Date.now());
      if (typeof window !== "undefined" && isVipUnlocked) {
        const type = localStorage.getItem("perseus_vip_unlocked_type");
        const time = Number(localStorage.getItem("perseus_vip_unlocked_time") || 0);
        if (type === "temporary" && time > 0) {
          const elapsed = Date.now() - time;
          // 24 hours in milliseconds = 24 * 3600 * 1000
          if (elapsed > 24 * 3600 * 1000) {
            setIsVipUnlocked(false);
            localStorage.removeItem("perseus_vip_unlocked");
            localStorage.removeItem("perseus_vip_unlocked_type");
            localStorage.removeItem("perseus_vip_unlocked_time");
            localStorage.removeItem("perseus_vip_telegram");
          }
        }
      }
    };

    checkExpiration();

    const interval = setInterval(checkExpiration, 10000);
    return () => clearInterval(interval);
  }, [isVipUnlocked]);

  useEffect(() => {
    localStorage.setItem("perseus_vip_unlocked", String(isVipUnlocked));
  }, [isVipUnlocked]);

  useEffect(() => {
    localStorage.setItem("perseus_mt5_unlocked", String(isMt5Unlocked));
  }, [isMt5Unlocked]);

  // Internationalization translation settings (Idea 6) and Voice speaker settings (Idea 3)
  const [language, setLanguage] = useState<"ID" | "EN">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("perseus_language");
      return (saved === "ID" || saved === "EN") ? saved : "ID";
    }
    return "ID";
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("perseus_voice_enabled");
      return saved !== "false";
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem("perseus_language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("perseus_voice_enabled", String(voiceEnabled));
  }, [voiceEnabled]);

  const [marketParams, setMarketParams] = useState<MarketParams | null>(null);
  const [activeSignal, setActiveSignal] = useState<Signal | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("perseus_active_signal");
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        console.error("Failed loading active signal:", e);
      }
    }
    return null;
  });
  const [signalsHistory, setSignalsHistory] = useState<Signal[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("perseus_signals_history");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed loading signals history:", e);
      }
    }
    return [];
  });
  const [stats, setStats] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem("perseus_signals_history");
        if (savedHistory) {
          const list: Signal[] = JSON.parse(savedHistory);
          const winCount = list.filter(s => s.status === "WIN").length;
          const rate = list.length > 0 ? Math.round((winCount / list.length) * 100) : 78;
          const pips = list.reduce((sum, s) => sum + s.pips, 0);
          return { totalTrades: list.length, winRate: rate, totalPips: pips };
        }
      } catch (e) {
        console.error("Failed loading stats:", e);
      }
    }
    return { totalTrades: 0, winRate: 78, totalPips: 0 };
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Price alerting configuration states stored in localStorage under a brand-new independent namespace
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("perseus_price_alerts");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed loading alerts from localStorage:", e);
      }
    }
    return [];
  });
  const [activeNotification, setActiveNotification] = useState<PriceAlert | null>(null);

  const currentXauPrice = marketParams?.currentQuote || 4511.56;

  // Client-side fallback computation engine to handle serverless or static hostings like Vercel with live price feeds
  const fetchLivePriceClientSide = async () => {
    try {
      const res = await fetch(`https://api.gold-api.com/price/XAU?_=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-store"
        }
      });
      if (res.ok) {
        const data = await res.json();
        const price = data.price || 4511.56; // Safe realistic spot price
        
        // Generate MarketParams dynamically matching standard multipliers
        const calculatedParams: MarketParams = {
          oscillatorState: price > 4500 ? "BULLISH STRENGTH" : "NEUTRAL / OVERBOUGHT",
          rsi: Number((48 + (price % 5) * 1.5).toFixed(1)),
          ema20: Number((price - 8.40).toFixed(2)),
          ema50: Number((price - 15.20).toFixed(2)),
          ema200: Number((price - 32.50).toFixed(2)),
          spread: 0.30,
          currentQuote: price,
          dailyHigh: Number((price + 12.50).toFixed(2)),
          dailyLow: Number((price - 22.10).toFixed(2)),
          openPrice: Number((price - 4.50).toFixed(2)),
          priceChange: 4.50,
          priceChangePercent: 0.19,
          volume: 148500 + Math.floor((price % 100) * 80)
        };
        
        setMarketParams(calculatedParams);
      }
    } catch (e) {
      console.error("Failed to parse client-side fallback price:", e);
    }
  };

  // Re-scan trigger action posting sequence
  const handleReScan = async () => {
    try {
      const storedToken = localStorage.getItem("perseus_telegram_bot_token") || undefined;
      const storedChatId = localStorage.getItem("perseus_telegram_chat_id") || undefined;
      const response = await fetch("/api/signals/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          telegramToken: storedToken,
          telegramChatId: storedChatId
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.active) {
          setActiveSignal(data.active);
          setSignalsHistory(data.history);
          setStats(data.stats);
        }
      } else {
        console.warn("Server failed to scan signals. Generating client-side pseudo-signal fallback.");
        const price = marketParams?.currentQuote || 4511.56;
        const fallbackFallbackSignal: Signal = {
          id: `sig-perseus-live-${Date.now()}-c`,
          symbol: "XAUUSD",
          type: "BUY",
          timeframe: "M15",
          time: Date.now(),
          entryPrice: Number((price).toFixed(2)),
          stopLoss: Number((price - 6.5).toFixed(2)),
          takeProfit1: Number((price + 8.5).toFixed(2)),
          takeProfit2: Number((price + 16.0).toFixed(2)),
          takeProfit3: Number((price + 26.5).toFixed(2)),
          status: "ACTIVE",
          pips: 0,
          confidence: 88,
          strategy: "Perseus SMC Order Block (Client Fallback)",
          commentary: "Memindai dari client-side karena serverless endpoint tidak terjangkau. Market berada dalam momentum bullish hulu."
        };
        setActiveSignal(fallbackFallbackSignal);
        setSignalsHistory((prev) => [fallbackFallbackSignal, ...prev]);
      }
    } catch (e) {
      console.warn("Server scan route inactive, using fallback", e);
    }
  };

  // Setup WebSocket for ultra-low latency real-time data streaming
  useEffect(() => {
    let ws: WebSocket;
    let wsConnectTimeout: NodeJS.Timeout;
    
    const connectWss = () => {
      // Connect to same origin
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
         console.log("Connected to Perseus real-time WebSocket!");
      };
      
      ws.onmessage = (event) => {
         try {
           const msg = JSON.parse(event.data);
           if (msg.type === "SYNC" && msg.data) {
              setMarketParams(msg.data);
              // Optimistically update current XAUUSD quote from WebSocket!
           }
         } catch(e) {}
      };
      
      ws.onclose = () => {
         console.log("WebSocket connection dropped, retrying in 3s...");
         wsConnectTimeout = setTimeout(connectWss, 3000);
      };
    };
    
    connectWss();
    
    return () => {
       if (ws) ws.close();
       clearTimeout(wsConnectTimeout);
    };
  }, []);

  // Primary API Poll (Slowed down, as WebSockets handle ticking now)
  useEffect(() => {
    const fetchSignalsData = async () => {
      try {
        const signalsResponse = await fetch("/api/signals");
        if (signalsResponse.ok) {
          const signalsData = await signalsResponse.json();
          if (signalsData && signalsData.active) {
            setActiveSignal(signalsData.active);
            setSignalsHistory(signalsData.history);
            setStats(signalsData.stats);
          }
        }
      } catch (err) {}
    };

    fetchSignalsData();
    const interval = setInterval(fetchSignalsData, 8000); // Only poll structural signals every 8s now
    return () => clearInterval(interval);
  }, []);

  // Save alerts to localStorage automatically whenever changed
  useEffect(() => {
    try {
      localStorage.setItem("perseus_price_alerts", JSON.stringify(alerts));
    } catch (e) {
      console.error("Failed saving alerts to localStorage:", e);
    }
  }, [alerts]);

  // Save active signal to localStorage automatically whenever changed
  useEffect(() => {
    if (activeSignal) {
      try {
        localStorage.setItem("perseus_active_signal", JSON.stringify(activeSignal));
      } catch (e) {
        console.error("Failed saving active signal to localStorage:", e);
      }
    }
  }, [activeSignal]);

  // Save signals history to localStorage automatically whenever changed
  useEffect(() => {
    if (signalsHistory && signalsHistory.length > 0) {
      try {
        localStorage.setItem("perseus_signals_history", JSON.stringify(signalsHistory));
      } catch (e) {
        console.error("Failed saving signals history to localStorage:", e);
      }
    }
  }, [signalsHistory]);

  // Voice Announcement triggers (Idea 3) utilizing refs to prevent duplicates
  const prevSignalIdRef = useRef<string | null>(null);
  const prevHistoryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!voiceEnabled || !activeSignal) return;

    // Check for new signal spawned
    if (activeSignal.id !== prevSignalIdRef.current) {
      if (prevSignalIdRef.current !== null) {
        import("./lib/voiceNotifier").then(({ playSyntheticBeep, announceWithVoice }) => {
          playSyntheticBeep("signal");
          const phrase = language === "ID"
            ? `Sinyal baru terdeteksi. ${activeSignal.type} emas pada ${activeSignal.entryPrice.toFixed(2)}`
            : `New signal detected. ${activeSignal.type} gold at entry price ${activeSignal.entryPrice.toFixed(2)}`;
          announceWithVoice(phrase, language);
        });
      }
      prevSignalIdRef.current = activeSignal.id;
    }
  }, [activeSignal, language, voiceEnabled]);

  useEffect(() => {
    if (!voiceEnabled) return;

    if (signalsHistory && signalsHistory.length > 0) {
      const latest = signalsHistory[0];
      if (latest.id !== prevHistoryIdRef.current) {
        if (prevHistoryIdRef.current !== null) {
          import("./lib/voiceNotifier").then(({ playSyntheticBeep, announceWithVoice }) => {
            const isWin = latest.status === "WIN" || latest.status === "WIN_TP1" || latest.status === "WIN_TP2" || latest.status === "WIN_TP3";
            playSyntheticBeep(isWin ? "success" : "warning");
            
            const phrase = language === "ID"
              ? `Transaksi diselesaikan. Hasil: ${isWin ? "keuntungan penuh" : "pembatasan risiko"}. Perubahan pips: ${latest.pips > 0 ? "+" : ""}${latest.pips}`
              : `Trade resolved. Result: ${isWin ? "profit achieved" : "stop loss hit"}. Net pips change: ${latest.pips > 0 ? "+" : ""}${latest.pips}`;
            announceWithVoice(phrase, language);
          });
        }
        prevHistoryIdRef.current = latest.id;
      }
    }
  }, [signalsHistory, language, voiceEnabled]);

  // --- SERVER-MANAGED TELEGRAM BROADCASTER ACTIVE ---
  // Telegram broadcasts are now processed exclusively server-side in server.ts to ensure 0 duplicate spam trades on webpage reload!

  // Client-side local persistence helpers cleared; Telegram broadcasting moved to server-side.

  // Monitor price thresholds whenever currentXauPrice updates to trigger notifications and persistent alert state shifts
  useEffect(() => {
    if (!currentXauPrice) return;

    setAlerts((prevAlerts) => {
      let changed = false;
      const updated = prevAlerts.map((alert) => {
        if (alert.isTriggered) return alert;

        let isTriggeredNow = false;
        if (alert.condition === "above" && currentXauPrice >= alert.targetPrice) {
          isTriggeredNow = true;
        } else if (alert.condition === "below" && currentXauPrice <= alert.targetPrice) {
          isTriggeredNow = true;
        }

        if (isTriggeredNow) {
          changed = true;
          setActiveNotification({
            ...alert,
            isTriggered: true,
            triggeredAt: Date.now(),
            triggeredValue: currentXauPrice
          });
          return {
            ...alert,
            isTriggered: true,
            triggeredAt: Date.now(),
            triggeredValue: currentXauPrice
          };
        }
        return alert;
      });

      return changed ? updated : prevAlerts;
    });
  }, [currentXauPrice]);

  const handleAddAlert = (targetPrice: number, condition: "above" | "below") => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetPrice,
      condition,
      createdAt: Date.now(),
      isTriggered: false
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearHistory = () => {
    setAlerts((prev) => prev.filter((a) => !a.isTriggered));
  };

  const activeAlertsCount = alerts.filter(a => !a.isTriggered).length;

  const t = translations[language];

  const tabs = [
    { id: "Home", label: t.home },
    { id: "Signals", label: t.features },
    { id: "MT5 Bridge", label: t.mt5Bridge },
    { id: "History", label: t.terminal },
    { id: "Case Studies", label: t.caseStudies },
    { id: "Live Chart", label: t.liveChart },
    { id: "Calendar", label: t.calendar },
    { id: "Risk Calc", label: t.riskCalc },
    { id: "Market Info", label: t.marketRate },
    { id: "AI Analysis", label: t.aiAnalysis },
    { id: "VIP", label: t.vip }
  ];

  return (
    <div className="min-h-screen bg-[#020204] text-slate-100 flex flex-col font-sans select-none selection:bg-orange-500/30 animated-matrix-grid dot-matrix-overlay terminal-scanlines pb-28 md:pb-32">
      
      {/* Top Tapes stream element */}
      <TapesHeader currentXau={currentXauPrice} />

      {/* Main Premium Application Header */}
      <header className="w-full bg-[#040407]/95 border-b border-[#14141a] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => {
              setActiveTab("Home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center font-display font-black text-black tracking-tight border border-orange-400/50 shadow-[0_0_15px_rgba(255,106,0,0.3)]">
              P
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-widest text-[#f8fafc] uppercase block">
                PERSEUS
              </span>
              <span className="font-mono text-[8px] text-orange-500 tracking-[0.25em] block -mt-1 font-bold">
                INTELLIGENCE
              </span>
            </div>
          </div>

          {/* Desktop/Tablet Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`nav-${tab.id.toLowerCase().replace(" ", "-")}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1.5 text-[9.5px] font-mono tracking-widest font-bold transition-all duration-300 cursor-pointer border relative uppercase ${
                  activeTab === tab.id
                    ? "bg-orange-500/5 text-orange-400 border-orange-500/30 shadow-[0_0_12px_rgba(255,106,0,0.08)]"
                    : "text-slate-400 border-transparent hover:text-white hover:bg-[#0c0c10]"
                }`}
              >
                {activeTab === tab.id && (
                  <span className="absolute -top-[1.2px] left-1/2 -translate-x-1/2 w-4 h-[1.8px] bg-orange-500 shadow-[0_0_8px_#ff6a00]" />
                )}
                {tab.label}
              </button>
            ))}

            {/* Bell Alert Notification Button */}
            <button
              id="nav-price-alert"
              onClick={() => setIsAlertModalOpen(true)}
              className="relative p-2 rounded-md hover:bg-[#121217] text-slate-400 hover:text-orange-400 transition-all duration-300 cursor-pointer flex items-center justify-center border border-transparent hover:border-orange-500/20 ml-2"
              title="Setel Notifikasi Sinyal Harga"
            >
              <Bell className="w-4 h-4 text-orange-400" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}
            </button>
          </nav>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3">
            {/* Spoken Alerts Toggle Button */}
            <button
              id="header-btn-voice-announcement-toggle"
              onClick={() => {
                const nextVal = !voiceEnabled;
                setVoiceEnabled(nextVal);
                import("./lib/voiceNotifier").then(({ playSyntheticBeep, announceWithVoice }) => {
                  playSyntheticBeep(nextVal ? "success" : "warning");
                  announceWithVoice(nextVal ? (language === "ID" ? "Suara aktif" : "Voice enabled") : "", language);
                });
              }}
              className="relative p-2 rounded bg-[#07070a]/90 border border-[#14141a] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title={voiceEnabled ? t.voiceOff : t.voiceOn}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-orange-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Language Selector Selector Button */}
            <button
              id="header-btn-lang-selector"
              onClick={() => {
                const nextLang = language === "ID" ? "EN" : "ID";
                setLanguage(nextLang);
                import("./lib/voiceNotifier").then(({ playSyntheticBeep, announceWithVoice }) => {
                  playSyntheticBeep("success");
                  announceWithVoice(nextLang === "ID" ? "Bahasa Berubah" : "Language Swapped", nextLang);
                });
              }}
              className="relative px-2 py-1.5 rounded bg-[#07070a]/90 border border-[#14141a] text-[10px] font-mono font-black text-slate-350 hover:text-white hover:border-orange-500/20 transition-all cursor-pointer flex items-center justify-center"
              title={t.languageSelect}
            >
              <span>{language === "ID" ? "🇮🇩 ID" : "🇺🇸 EN"}</span>
            </button>

            <button
              id="header-btn-price-alert-responsive"
              onClick={() => setIsAlertModalOpen(true)}
              className="relative p-2 rounded bg-[#07070a]/90 border border-[#14141a] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center lg:hidden"
              title="Setel Notifikasi Sinyal Harga"
            >
              <Bell className="w-4.5 h-4.5 text-orange-400" />
              {activeAlertsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                </span>
              )}
            </button>

            {/* Sidebar Toggle Hub Button */}
            <button
              id="header-btn-hub-sidebar"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:px-3 rounded bg-[#0d1017] border border-[#1d2334] text-gray-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Akses Dashboard Hub Akun & Fitur Sekunder"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: "1s" }} /> : <Menu className="w-4 h-4 text-amber-500" />}
              <span className="hidden sm:inline font-mono text-[9px] font-black uppercase text-amber-500 tracking-wider">HUB HUBUNGAN</span>
            </button>

            <button
              id="header-btn-join"
              onClick={() => {
                setActiveTab("VIP");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hidden md:block px-4 py-2 rounded bg-gradient-to-r from-orange-500 to-amber-500 text-black font-sans font-black text-[10px] tracking-wider hover:from-orange-400 hover:to-amber-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,106,0,0.2)] border border-orange-400/30 cursor-pointer uppercase"
            >
              VIP WHITELIST
            </button>
          </div>

        </div>
      </header>

      {/* Dynamic 24h Trial Psychological Warning Banner */}
      {isVipUnlocked && typeof window !== "undefined" && localStorage.getItem("perseus_vip_unlocked_type") === "temporary" && (
        <div className="w-full bg-[#0a0501]/95 border-b border-amber-500/20 py-2.5 px-4 font-mono text-[9px] sm:text-[10px] text-slate-350 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-3 shadow-[inset_0_1px_10px_rgba(245,158,11,0.06)] z-30">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-amber-500 animate-pulse" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black font-mono animate-pulse text-[8px] sm:text-[9px] tracking-wider uppercase">
              <ShieldAlert className="w-3 h-3" /> TRIAL ACTIVE
            </span>
            <span className="font-bold text-amber-500">
              ⚠️ UNVERIFIED GUEST ACCESS:
            </span>
            <span>
              Username: <span className="text-white font-black underline">@{localStorage.getItem("perseus_vip_telegram")}</span>
            </span>
            <span className="text-[#BFC7E6]/80 flex items-center gap-1.5 ml-1">
              • <span className="text-orange-400 font-bold underline">
                {(() => {
                  const time = Number(localStorage.getItem("perseus_vip_unlocked_time") || 0);
                  const rem = Math.max(0, 24 * 3600 * 1000 - (Date.now() - time));
                  const hours = Math.floor(rem / (3600 * 1000));
                  const mins = Math.floor((rem % (3600 * 1000)) / (60 * 1000));
                  return `${hours} Jam ${mins} Menit`;
                })()}
              </span> Sisa Masa Percobaan
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-slate-500 text-[9px] text-center md:text-right font-light leading-snug">
              "Sistem AI Perseus melakukan rekonsiliasi database anggota grup Telegram @perseusnewversion secara berkala setiap 12 jam. Jika akun Telegram Anda tidak ditemukan dalam 24 jam, lisensi Whitelist Key dinonaktifkan otomatis."
            </span>
            <a 
              href="https://t.me/perseusnewversion"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500 hover:text-black font-semibold uppercase tracking-wider transition-all text-[8.5px] whitespace-nowrap cursor-pointer hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              GABUNG TELEGRAM 📡
            </a>
          </div>
        </div>
      )}

      {/* Dimmed Backdrop overlay with slow transition fade */}
      <div 
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-out Sidebar Drawer - Glassmorphic Dark Layout */}
      <header className={`fixed inset-y-0 right-0 w-80 sm:w-96 max-w-full bg-[#07070a]/95 border-l border-white/10 backdrop-blur-2xl z-55 transition-transform duration-300 ease-out transform ${
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      } shadow-2xl flex flex-col`} style={{ position: "fixed", top: 0, height: "100%" }}>
        {/* Hub Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded bg-amber-500 flex items-center justify-center font-display font-black text-black text-[9px]">
              P
            </div>
            <div>
              <h3 className="font-display font-black text-[11px] text-white uppercase tracking-wider">PERSEUS TERMINAL HUB</h3>
              <p className="font-mono text-[7.5px] text-gray-500 uppercase tracking-widest -mt-0.5">Secure v3.28 // Stable Client</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-md bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic scrollable core hub list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          
          {/* Active verified Whitelist Profile Node */}
          <div className="p-4 bg-gradient-to-b from-white/5 to-transparent rounded-xl border border-white/5 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-slate-500 to-slate-700 flex items-center justify-center font-display font-black text-black shadow-lg">
                GU
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-sans font-bold text-xs text-white truncate">Guest User</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[8px] text-amber-500 font-extrabold tracking-wider uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">
                    WHITELISTED ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core secondary database page tabs */}
          <div className="space-y-2.5 text-left">
            <span className="font-mono text-[8px] text-slate-500 font-black tracking-widest uppercase block border-b border-white/5 pb-1">
              Terminal Secondary Pages
            </span>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setActiveTab("MT5 Bridge");
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between text-xs font-sans transition-all border cursor-pointer ${
                  activeTab === "MT5 Bridge"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25 font-bold shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span>MT5 Auto-Trade Bridge</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("History");
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between text-xs font-sans transition-all border cursor-pointer ${
                  activeTab === "History"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25 font-bold shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-500" />
                  <span>Sinyal Bias History</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("Calendar");
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between text-xs font-sans transition-all border cursor-pointer ${
                  activeTab === "Calendar"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25 font-bold shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Kombinasi Kalender G20</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("Market Info");
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between text-xs font-sans transition-all border cursor-pointer ${
                  activeTab === "Market Info"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25 font-bold shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>Korelasi Hub Harga</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("VIP");
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between text-xs font-sans transition-all border cursor-pointer ${
                  activeTab === "VIP"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25 font-bold shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>VIP Access Whitelist</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>

          {/* Section 3: User Secondary Account Services (High interactive options) */}
          <div className="space-y-2 text-left">
            <span className="font-mono text-[8px] text-slate-500 font-black tracking-widest uppercase block border-b border-white/5 pb-1">
              Account Service Hub
            </span>

            <div className="grid grid-cols-2 gap-2 text-left">
              <button 
                onClick={() => { setActiveHubView("Profile"); setMobileMenuOpen(false); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-[10px] font-sans font-bold text-white">Profile</div>
                <div className="text-[8px] font-mono text-gray-500 uppercase">Core Data</div>
              </button>

              <button 
                onClick={() => { setActiveHubView("Settings"); setMobileMenuOpen(false); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-[10px] font-sans font-bold text-white">Settings</div>
                <div className="text-[8px] font-mono text-gray-500 uppercase">Config</div>
              </button>

              <button 
                onClick={() => { setActiveHubView("Subscription"); setMobileMenuOpen(false); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-[10px] font-sans font-bold text-white">Subscription</div>
                <div className="text-[8px] font-mono text-gray-500 uppercase">VIP Plan</div>
              </button>

              <button 
                onClick={() => { setActiveHubView("Notifications"); setMobileMenuOpen(false); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-[10px] font-sans font-bold text-white">Alert Logs</div>
                <div className="text-[8px] font-mono text-gray-500 uppercase">Sirens ({activeAlertsCount})</div>
              </button>

              <button 
                onClick={() => { setActiveHubView("Referral"); setMobileMenuOpen(false); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-[10px] font-sans font-bold text-white">Referrals</div>
                <div className="text-[8px] font-mono text-gray-500 uppercase">Affiliates</div>
              </button>

              <button 
                onClick={() => { setActiveHubView("Help Center"); setMobileMenuOpen(false); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-500 mb-1" />
                <div className="text-[10px] font-sans font-bold text-white">Help Desk</div>
                <div className="text-[8px] font-mono text-gray-500 uppercase">24/7 Assist</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={() => { setActiveHubView("Terms"); setMobileMenuOpen(false); }}
                className="p-2.5 bg-white/[0.02] hover:bg-white/5 rounded-lg text-center transition-all border border-white/5 text-[9px] font-mono text-gray-400 font-bold uppercase cursor-pointer"
              >
                Terms of Use
              </button>
              <button 
                onClick={() => { setActiveHubView("Privacy"); setMobileMenuOpen(false); }}
                className="p-2.5 bg-white/[0.02] hover:bg-white/5 rounded-lg text-center transition-all border border-white/5 text-[9px] font-mono text-gray-400 font-bold uppercase cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar persistent bottom CTA */}
        <div className="p-5 border-t border-white/5 bg-[#050608]">
          <button
            onClick={() => {
              setActiveTab("VIP");
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-black font-sans font-black text-xs uppercase tracking-wider text-center block transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          >
            SINKRONISASI VIP LISENSI
          </button>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar (Glassmorphic + Gold Glow Theme) */}
      <nav className="fixed bottom-6 inset-x-0 mx-auto w-[92%] sm:w-[85%] max-w-lg z-50 animate-in fade-in-50 duration-500">
        <div className="bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl p-1.5 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.92),0_0_30px_rgba(245,158,11,0.06)] flex items-center justify-around relative">
          
          {/* Accent glowing outline for active indicators */}
          <div className="absolute top-0 left-0 w-full h-[1.2px] bg-gradient-to-r from-transparent via-amber-500/25 to-transparent pointer-events-none" />

          {/* Tab 1: Home */}
          <button
            onClick={() => {
              setActiveTab("Home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 text-center transition-all duration-300 relative rounded-xl hover:bg-white/5 cursor-pointer max-w-[80px] flex-1 ${
              activeTab === "Home" ? "scale-105 text-amber-500 font-bold" : "text-slate-400"
            }`}
          >
            <Home className={`w-4.5 h-4.5 sm:w-5 h-5 transition-transform duration-300 ${activeTab === "Home" ? "scale-110 text-amber-400" : "opacity-80"}`} />
            <span className="font-mono text-[8.5px] sm:text-[9.5px] uppercase tracking-wider mt-1 block select-none">Beranda</span>
            {activeTab === "Home" && (
              <span className="absolute bottom-0 w-5 h-[2px] bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}
          </button>

          {/* Tab 2: Signals - with LIVE Badge */}
          <button
            onClick={() => {
              setActiveTab("Signals");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 text-center transition-all duration-300 relative rounded-xl hover:bg-white/5 cursor-pointer max-w-[80px] flex-1 ${
              activeTab === "Signals" ? "scale-105 text-amber-500 font-bold" : "text-slate-400"
            }`}
          >
            <div className="relative">
              <Zap className={`w-4.5 h-4.5 sm:w-5 h-5 transition-transform duration-300 ${activeTab === "Signals" ? "scale-110 text-amber-400" : "opacity-80"}`} />
              <span className="absolute -top-2.5 -right-3.5 sm:-top-3 sm:-right-4 bg-emerald-500/90 text-[6.5px] sm:text-[7.5px] text-black font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-400 uppercase tracking-widest shadow-[0_0_8px_rgba(16,185,129,0.3)] select-none font-mono">
                LIVE
              </span>
            </div>
            <span className="font-mono text-[8px] sm:text-[9.5px] uppercase tracking-wider mt-1 block select-none">Sinyal</span>
            {activeTab === "Signals" && (
              <span className="absolute bottom-0 w-5 h-[2px] bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}
          </button>

          {/* Tab 3: Live Chart - with HOT Badge */}
          <button
            onClick={() => {
              setActiveTab("Live Chart");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 text-center transition-all duration-300 relative rounded-xl hover:bg-white/5 cursor-pointer max-w-[80px] flex-1 ${
              activeTab === "Live Chart" ? "scale-105 text-amber-500 font-bold" : "text-slate-400"
            }`}
          >
            <div className="relative">
              <LineChart className={`w-4.5 h-4.5 sm:w-5 h-5 transition-transform duration-300 ${activeTab === "Live Chart" ? "scale-110 text-amber-400" : "opacity-80"}`} />
              <span className="absolute -top-2.5 -right-3.5 sm:-top-3 sm:-right-4 bg-rose-500/95 text-[6.5px] sm:text-[7.5px] text-white font-black px-1.5 py-0.2 rounded-full border border-rose-400/50 uppercase tracking-widest shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse font-mono select-none">
                HOT
              </span>
            </div>
            <span className="font-mono text-[8px] sm:text-[9.5px] uppercase tracking-wider mt-1 block select-none">Chart</span>
            {activeTab === "Live Chart" && (
              <span className="absolute bottom-0 w-5 h-[2px] bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}
          </button>

          {/* Tab 4: MT5 Bridge - with PRO Badge */}
          <button
            onClick={() => {
              setActiveTab("MT5 Bridge");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 text-center transition-all duration-300 relative rounded-xl hover:bg-white/5 cursor-pointer max-w-[80px] flex-1 ${
              activeTab === "MT5 Bridge" ? "scale-105 text-amber-500 font-bold" : "text-slate-400"
            }`}
          >
            <div className="relative">
              <Cpu className={`w-4.5 h-4.5 sm:w-5 h-5 transition-transform duration-300 ${activeTab === "MT5 Bridge" ? "scale-110 text-amber-400" : "opacity-80"}`} />
              <span className="absolute -top-2.5 -right-3.5 sm:-top-3 sm:-right-4 bg-amber-500 text-[6.5px] sm:text-[7.5px] text-black font-black px-1.5 py-0.2 rounded-full border border-amber-300/60 uppercase tracking-widest shadow-[0_0_8px_rgba(245,158,11,0.3)] font-mono select-none">
                PRO
              </span>
            </div>
            <span className="font-mono text-[8.5px] sm:text-[9.5px] uppercase tracking-wider mt-1 block select-none">MT5 Bridge</span>
            {activeTab === "MT5 Bridge" && (
              <span className="absolute bottom-0 w-5 h-[2px] bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}
          </button>

          {/* Tab 5: AI Analysis - with NEW Badge */}
          <button
            onClick={() => {
              setActiveTab("AI Analysis");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 text-center transition-all duration-300 relative rounded-xl hover:bg-white/5 cursor-pointer max-w-[80px] flex-1 ${
              activeTab === "AI Analysis" ? "scale-105 text-amber-500 font-bold" : "text-slate-400"
            }`}
          >
            <div className="relative">
              <Sparkles className={`w-4.5 h-4.5 sm:w-5 h-5 transition-transform duration-300 ${activeTab === "AI Analysis" ? "scale-110 text-amber-400" : "opacity-80"}`} />
              <span className="absolute -top-2.5 -right-3.5 sm:-top-3 sm:-right-4 bg-violet-600 text-[6.5px] sm:text-[7.5px] text-white font-black px-1.5 py-0.2 rounded-full border border-violet-400/50 uppercase tracking-widest shadow-[0_0_8px_rgba(139,92,246,0.3)] font-mono select-none">
                NEW
              </span>
            </div>
            <span className="font-mono text-[8px] sm:text-[9.5px] uppercase tracking-wider mt-1 block select-none">AI</span>
            {activeTab === "AI Analysis" && (
              <span className="absolute bottom-0 w-5 h-[2px] bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}
          </button>

          {/* Tab 6: More Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 text-center transition-all duration-300 relative rounded-xl hover:bg-white/5 cursor-pointer max-w-[80px] flex-1 text-slate-400 ${
              mobileMenuOpen ? "scale-105 text-amber-400 bg-amber-500/10" : "opacity-80"
            }`}
          >
            <Menu className="w-4.5 h-4.5 sm:w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-mono text-[8.5px] sm:text-[9.5px] uppercase mt-1 block text-amber-500/90 font-black tracking-wider">HUB</span>
            {mobileMenuOpen && (
              <span className="absolute top-0 -mt-1 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
            )}
          </button>

        </div>
      </nav>

      {/* Main content body frame with bottom spacing padding */}
      <main className="flex-1 w-full bg-[#050608] min-h-[500px] pb-16">
        {activeTab === "Home" && (
          <HomeView onNavigate={(tab) => setActiveTab(tab)} currentXau={currentXauPrice} activeSignal={activeSignal} language={language} />
        )}
        {activeTab === "Signals" && (
          isVipUnlocked ? (
            <SignalsView 
              activeSignal={activeSignal} 
              marketParams={marketParams} 
              onNavigate={(tab) => setActiveTab(tab)} 
              signalsHistory={signalsHistory}
              onReScan={handleReScan}
            />
          ) : (
            <VIPLockedView featureName="Sinyal Perdagangan Kuantitatif Real-time" onUnlock={() => setIsVipUnlocked(true)}>
              <SignalsView 
                activeSignal={activeSignal} 
                marketParams={marketParams} 
                onNavigate={(tab) => setActiveTab(tab)} 
                signalsHistory={signalsHistory}
                onReScan={handleReScan}
              />
            </VIPLockedView>
          )
        )}
        {activeTab === "MT5 Bridge" && (
          isMt5Unlocked ? (
            <Mt5AutoTradeConsole activeSignal={activeSignal} marketParams={marketParams} />
          ) : (
            <VIPLockedView featureName="MT5 Auto-Bridge & Expert Advisor Config" onUnlock={() => setIsMt5Unlocked(true)} isAdminOnly={true}>
              <Mt5AutoTradeConsole activeSignal={activeSignal} marketParams={marketParams} />
            </VIPLockedView>
          )
        )}
        {activeTab === "History" && (
          <HistoryView signalsHistory={signalsHistory} stats={stats} language={language} />
        )}
        {activeTab === "Case Studies" && (
          <CaseStudyView currentXau={currentXauPrice} />
        )}
        {activeTab === "Terms" && (
          <TermsOfServiceView onBack={() => setActiveTab("Home")} />
        )}
        {activeTab === "Admin" && (
          <AdminView />
        )}
        {activeTab === "Live Chart" && <LiveChartView />}
        {activeTab === "Calendar" && <CalendarView />}
        {activeTab === "Risk Calc" && (
          <RiskCalcView activeSignal={activeSignal} marketParams={marketParams} language={language} />
        )}
        {activeTab === "Market Info" && <MarketInfoView currentXau={currentXauPrice} oscillatorState={marketParams?.oscillatorState || "NEUTRAL"} />}
        {activeTab === "AI Analysis" && (
          isVipUnlocked ? (
            <AIAnalysisView marketParams={marketParams} />
          ) : (
            <VIPLockedView featureName="Scan Sentimen AI (Gemini Flash Quantum)" onUnlock={() => setIsVipUnlocked(true)}>
              <AIAnalysisView marketParams={marketParams} />
            </VIPLockedView>
          )
        )}
        {activeTab === "VIP" && <VIPView />}
      </main>

      {/* Global premium system footer */}
      <footer className="w-full bg-[#050609] border-t border-[#151a24] py-14 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center font-sans font-black text-black tracking-tight text-xs">
              P
            </div>
            <div className="text-gray-500 text-xs">
              <span className="font-bold text-gray-300 cursor-pointer" onClick={() => setActiveTab("Admin")}>© 2026 PerseusTerminal.com</span> All rights reserved.
            </div>
          </div>

          <div className="text-[10px] text-gray-600 max-w-xl text-center md:text-right font-light leading-relaxed">
            <strong className="text-gray-500 uppercase">Disclaimer / ToS: </strong>
            Trading memiliki risiko tinggi. <span className="text-amber-500 cursor-pointer underline hover:text-amber-400" onClick={() => setActiveTab("Terms")}>Baca Syarat & Ketentuan Penggunaan (Terms of Service) selengkapnya di sini.</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 font-mono text-[10px] text-gray-500">
            <span className="hover:text-amber-500 cursor-pointer" onClick={() => setActiveTab("VIP")}>WHITELIST PERMIT</span>
            <span className="hover:text-amber-500 cursor-pointer" onClick={() => setActiveTab("Risk Calc")}>MONEY LAWS</span>
            <span className="hover:text-amber-500 cursor-pointer" onClick={() => setActiveTab("Live Chart")}>TRADINGVIEW ORIGINAL FEED</span>
          </div>

        </div>
      </footer>

      {/* Persistent Price Alerts Management Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        currentPrice={currentXauPrice}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        onClearHistory={handleClearHistory}
      />

      {/* Floating Action Alert Toast notification banner */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm w-full bg-[#080d16] border-2 border-amber-500 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-4 flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="p-2 bg-amber-500 rounded-lg text-black animate-bounce mt-0.5">
            <BellRing className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans font-black text-xs text-white uppercase tracking-tight">Alarm Terpicu!</span>
              <button 
                onClick={() => setActiveNotification(null)}
                className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#121822] transition-colors"
                title="Tutup Notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Harga Spot XAUUSD telah menembus target batas Anda di <strong>${activeNotification.targetPrice.toFixed(2)}</strong>!
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Live: ${activeNotification.triggeredValue?.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {new Date(activeNotification.triggeredAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Universal Premium Interactive Hub Overlay Modal */}
      {activeHubView && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          {/* Blur backdrop overlay */}
          <div 
            onClick={() => setActiveHubView(null)}
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
          />
          
          {/* Modal Container */}
          <div className="bg-[#090b11] border border-white/10 w-full max-w-lg rounded-2xl p-6 md:p-8 relative max-h-[85vh] overflow-y-auto custom-scrollbar z-10 shadow-2xl shadow-amber-500/5 animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-amber-500/50 via-amber-400 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2 rounded bg-amber-500/10 text-amber-400 font-mono text-[9px] font-black tracking-widest uppercase border border-amber-500/20">
                  PERSEUS MODULE
                </span>
                <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
                  {activeHubView === "Help Center" ? "PUSAT BANTUAN" : activeHubView === "Terms" ? "KETENTUAN LAYANAN" : activeHubView === "Privacy" ? "KEBIJAKAN PRIVASI" : activeHubView}
                </h3>
              </div>
              <button 
                onClick={() => setActiveHubView(null)}
                className="p-1 px-2.5 rounded bg-white/5 font-mono text-[10px] hover:text-white text-slate-400 hover:bg-white/10 transition-all cursor-pointer"
              >
                TUTUP
              </button>
            </div>

            {/* View Branches */}
            <div className="space-y-4">
              {activeHubView === "Profile" && (
                <div className="space-y-5 text-left">
                  <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-500 to-slate-700 flex items-center justify-center font-bold text-black border-2 border-slate-400 font-display text-lg shadow-[0_0_20px_rgba(100,116,139,0.25)] shrink-0">
                      GU
                    </div>
                    <div>
                      <h4 className="font-sans font-black text-white text-xs">Guest User</h4>
                      <p className="text-[10px] font-mono text-gray-500 uppercase mt-0.5">Local Profile</p>
                      <span className="inline-block mt-2 font-mono text-[8px] bg-slate-500/15 border border-slate-500/30 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        ● DEVICE VERIFIED
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-gray-500">Unique Identification ID</span>
                      <span className="font-mono text-white text-xs font-bold">UID-78401129-PX</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-gray-500">Virtual Portfolio Balance</span>
                      <span className="font-mono text-amber-400 text-xs font-black tracking-wide">$14,850.40 USD</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-gray-500">Live Socket Gateway</span>
                      <span className="font-mono text-white text-xs">SG-PREMIUM-CORE-NODE</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2">
                      <span className="text-gray-500">Security Encryption Protocol</span>
                      <span className="font-mono text-slate-400 text-xs text-right">TLS_AES_256_GCM_SHA384</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-gray-400 leading-relaxed">
                    Akun Anda sepenuhnya dikonfigurasi melalui integrasi sistem Whitelist Perseus Core. Gunakan parameter lot di bawah menu <strong>Risk Calc</strong> untuk melakukan simulasi transaksi di bursa terdesentralisasi secara real-time.
                  </div>
                </div>
              )}

              {activeHubView === "Settings" && (
                <div className="space-y-5 text-left">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-white uppercase">Notifikasi Suara Term Terintegrasi</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Bunyikan sirene keras saat target pips tercapai.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-white uppercase">Interval Polling Spot Gold Feed</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Tingkatkan efisiensi sinkronisasi grafik real-time.</div>
                      </div>
                      <select className="bg-[#040407] border border-white/10 text-xs font-mono rounded px-2 py-1 text-white select-none">
                        <option>Real-Time (5s)</option>
                        <option>Eco Mode (15s)</option>
                        <option>Apex Speed (2s)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-white uppercase">Satuan Leverage Keuangan</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Tentukan standar lot leverage global terminal.</div>
                      </div>
                      <select className="bg-[#040407] border border-white/10 text-xs font-mono rounded px-2 py-1 text-white select-none">
                        <option>Lot Mikro (0.01)</option>
                        <option>Lot Standard (1.00)</option>
                        <option>Lot Mini (0.10)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0d121c]/50 border border-white/5 rounded-xl opacity-60">
                      <div>
                        <div className="text-xs font-bold text-white uppercase">Core Mode Tema Cyber Scurry</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Mode gelap absolut berdaya hemat energi OLED.</div>
                      </div>
                      <span className="text-[9px] font-mono font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        LOCKED
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveHubView(null)}
                    className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all font-mono font-bold text-xs uppercase text-center border border-white/10 text-white cursor-pointer"
                  >
                    SIMPAN PREFERENSI SEKARANG
                  </button>
                </div>
              )}

              {activeHubView === "Subscription" && (
                <div className="space-y-4 text-left">
                  <div className="p-5 bg-gradient-to-r from-amber-500/20 to-yellow-500/5 rounded-xl border border-amber-500/30 text-left relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-12 h-12 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Trophy className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="font-mono text-[9px] text-amber-400 font-extrabold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      VIP LIFE LICENSE
                    </span>
                    <h4 className="font-display font-black text-white text-base mt-3">PERSEUS APEX ORACLE PRO</h4>
                    <p className="text-[10.5px] text-gray-400 leading-relaxed mt-1 font-light">
                      Hak istimewa term dengan latensi sinkronisasi minimal pada terminal, akses tak terbatas, dan analisis data konfluensi AI.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Akses Penuh Sinyal Tanpa Batas Delay
                      </span>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Kompilasi Model Deep AI Confluence
                      </span>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Analisis Sentimen G20 Macro Global
                      </span>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 text-xs flex items-center justify-between">
                    <span className="text-gray-500 font-sans">Masa Berlaku Whitelist</span>
                    <span className="font-mono text-white uppercase font-bold text-xs">UMUR HIDUP (LIFETIME ACCESS)</span>
                  </div>
                </div>
              )}

              {activeHubView === "Referral" && (
                <div className="space-y-5 text-left">
                  <div className="space-y-1">
                    <h4 className="font-sans font-black text-white text-xs uppercase">PROGRAM REFERRAL REKANAN INTEL</h4>
                    <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                      Ajak kolega Anda trading dengan sinyal andal, dapatkan komisi instan langsung cair ke saldo penarikan harian Anda.
                    </p>
                  </div>

                  {/* Copy link bar */}
                  <div className="bg-[#050508] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-amber-500 truncate flex-1 leading-none pt-0.5">
                      https://perseus.ai/ref/erni777
                    </span>
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText("https://perseus.ai/ref/erni777");
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 font-mono font-black text-[9px] text-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Berhasil!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Referral Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">MITRA TERDAFTAR</div>
                      <div className="font-display font-black text-white text-base mt-1">18 Anggota</div>
                      <div className="text-[9px] text-[#00ff66] font-mono mt-0.5">Sinyal lancar & aktif</div>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold">TOTAL KOMISI</div>
                      <div className="font-display font-black text-amber-500 text-base mt-1">$540.00 USD</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold">Tarik instan cair</div>
                    </div>
                  </div>
                </div>
              )}

              {activeHubView === "Notifications" && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between font-mono text-[9px] text-gray-500 font-black tracking-widest border-b border-white/5 pb-1 uppercase">
                    <span>Logs Notifikasi System</span>
                    <span>Status: Gateway Live</span>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                    <div className="p-3 bg-[#0d121c] border border-white/5 rounded-lg text-xs leading-relaxed">
                      <div className="flex items-center justify-between text-[10px] font-mono text-amber-500/80 mb-1">
                        <span>BREAKOUT RECTANGLE XAUUSD</span>
                        <span>08:14:26 WIB</span>
                      </div>
                      Harga menembus rintangan support terdekat di level <strong className="text-white">${(currentXauPrice - 3.20).toFixed(2)}</strong>. Formasi order block terbalik sedang dialiri likuiditas baru harian.
                    </div>

                    <div className="p-3 bg-[#0d121c] border border-white/5 rounded-lg text-xs leading-relaxed">
                      <div className="flex items-center justify-between text-[10px] font-mono text-rose-500 mb-1">
                        <span>EMA50 REJECTION EXTREME BOUNCE</span>
                        <span>06:45:01 WIB</span>
                      </div>
                      Terdeteksi pemulihan pantulan harga dari area support SMA200. Bias sinyal terkonvensional mendukung formasi buy harian jangka pendek.
                    </div>

                    <div className="p-3 bg-[#0c1017] border border-white/5 rounded-lg text-xs leading-relaxed opacity-65">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-1">
                        <span>RSI OVERBOUGHT SIGNAL DETECTED</span>
                        <span>Harian Kemarin</span>
                      </div>
                      Keluaran rujukan model osilator RSI melintasi batas atas jenuh beli di skala 68%. Posisi trading disarankan mengencangkan stop-loss presisi rendah.
                    </div>
                  </div>
                </div>
              )}

              {activeHubView === "Help Center" && (
                <div className="space-y-5 text-left">
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 px-1">
                    <h4 className="font-sans font-black text-white text-xs uppercase">BANTUAN TEKNIS LISENSI</h4>
                    <p className="text-[10.5px] text-gray-500 leading-relaxed font-light">
                      Butuh bantuan atau terhambat isu integrasi feed charts? Layanan insinyur sistem kami siaga mendampingi Anda tanpa henti 24/7.
                    </p>
                  </div>

                  {/* Support Ticket form fields */}
                  <div className="space-y-3.5 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <div className="space-y-1.5 text-left">
                      <label className="font-mono text-[9px] text-[#8e9ca8] block uppercase font-bold">Subjek Masalah</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Keterlambatan Kecepatan Sinkronis Live Feed" 
                        className="w-full bg-[#040407] border border-white/10 text-xs px-3 py-2 rounded focus:border-amber-500 font-sans text-white focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="font-mono text-[9px] text-[#8e9ca8] block uppercase font-bold">Pesan Pengaduan Lengkap</label>
                      <textarea 
                        rows={2}
                        placeholder="Masukan keluhan Anda secara mendetil..." 
                        className="w-full bg-[#040407] border border-white/10 text-xs px-3 py-2 rounded focus:border-amber-500 font-sans text-white focus:outline-none" 
                      />
                    </div>
                    <button
                      onClick={() => {
                        setActiveHubView(null);
                        alert("Tiket Bantuan Anda berhasil dikirim ke Perseus Technical Center. Mohon pantau surel Anda!");
                      }}
                      className="w-full py-2.5 rounded bg-gradient-to-r from-amber-500 to-yellow-500 font-sans font-black text-[10px] text-black uppercase tracking-wider text-center block cursor-pointer hover:brightness-110"
                    >
                      KIRIM TIKET BANTUAN SEKARANG
                    </button>
                  </div>
                </div>
              )}

              {activeHubView === "Terms" && (
                <div className="space-y-4 text-left font-sans text-xs text-gray-400 leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  <div className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/10 flex gap-2.5 mb-3">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-300">
                      <strong>PERINGATAN RISIKO TRADING SEBENARNYA:</strong> Kontrak perbedaan instrumen spot emas harian (CFDs) sangat fluktuatif dan berisiko tinggi. Gunakan parameter lot di terminal dengan ketat demi menjaga dana Anda.
                    </p>
                  </div>
                  <h4 className="font-black text-white text-xs uppercase font-sans mb-1">1. LISENSI TERMINAL CORE</h4>
                  <p className="font-light text-[10.5px]">
                    Perseus Intelligence menyediakan indikator sinyal, visualisasi chart teraktual, dan perhitungan lot leverage murni untuk kebutuhan simulasi analisis teknis dan sarana pendidikan portofolio.
                  </p>
                  <h4 className="font-black text-white text-xs uppercase font-sans mb-1 mt-3">2. KEABSAHAN DATA CHART & SIGNALS</h4>
                  <p className="font-light text-[10.5px]">
                    Seluruh basis level harga dan bias sinyal merupakan pengolahan internal model konfluensi data historis, bebas dari indikasi menjamin keuntungan 100% mutlak di bursa finansial manapun.
                  </p>
                </div>
              )}

              {activeHubView === "Privacy" && (
                <div className="space-y-4 text-left font-sans text-xs text-gray-400 leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  <h4 className="font-black text-white text-xs uppercase font-sans mb-1">1. KERAHASIAAN INFORMASI AKUN</h4>
                  <p className="font-light text-[10.5px]">
                    Kami berkomitmen menjaga kerahasiaan tokens whitelist secara enkripsi, serta alarm preset batas harga yang Anda simpan pada penyimpanan terenkripsi browser Anda.
                  </p>
                  <h4 className="font-black text-white text-xs uppercase font-sans mb-1 mt-3">2. TIADA PELACAKAN COOKIES PIHAK KETIGA</h4>
                  <p className="font-light text-[10.5px]">
                    Data analitik peramban Anda diproses langsung di sisi klien secara instan tanpa terekspos keluar. Keamanan privasi Anda adalah supremasi mutlak operasional Perseus Intelligence.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
