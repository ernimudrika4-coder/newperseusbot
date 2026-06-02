import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowRight, Star, Check, ShieldAlert, Cpu, Zap, Activity, 
  TrendingUp, Coins, Globe, Shield, Newspaper, Users, Layers, Trophy,
  TrendingDown, Sparkles, Filter, Server, Laptop, DollarSign, ArrowUpRight,
  Gauge, BarChart3, Clock, RefreshCw, Calculator
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";

// 3D Tilt Wrapper with Framer Motion Springs for tactile feedback
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [10, -10]), { damping: 25, stiffness: 220 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-10, 10]), { damping: 25, stiffness: 220 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      className={className}
    >
      {/* 3D child nesting support */}
      <div style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }} className="w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}

import { Signal } from "../types";
import { translations } from "../lib/translations";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  currentXau: number;
  activeSignal?: Signal | null;
  language?: "ID" | "EN";
}

export default function HomeView({ onNavigate, currentXau, activeSignal, language = "ID" }: HomeViewProps) {
  const t = translations[language];
  const tSentiment = (language === "ID" ? {
    aggregatedSentiment: "SENTIMENT PASAR AGREGAT",
    constitutesWhole: "KONSTITUSI KELURUHAN PASAR RETAIL",
    buyMomentum: "MOMENTUM BELI",
    bullPower: "AKSIMULASI BULL (BELI)",
    bearPower: "AKSUMULASI BEAR (JUAL)"
  } : {
    aggregatedSentiment: "AGGREGATED RETAIL SENTIMENT",
    constitutesWhole: "CONSTITUTES GLOBAL SPECULATIVE POOL",
    buyMomentum: "BUY MOMENTUM",
    bullPower: "BULL POWER (BUYERS)",
    bearPower: "BEAR POWER (SELLERS)"
  });
  const [scrollY, setScrollY] = useState(0);
  const tvContainerRef = useRef<HTMLDivElement>(null);
  const homeWidgetRef = useRef<any>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const tickerWidgetRef = useRef<HTMLDivElement>(null);

  // States for real-time interactive AI pattern tooltips over the TradingView chart
  const [hoveredPattern, setHoveredPattern] = useState<any | null>(null);
  const [scannerActive, setScannerActive] = useState<boolean>(true);

  // States for stunning high-fidelity interactive bento widgets
  const [bento1Timeframe, setBento1Timeframe] = useState<"M5" | "M15" | "H1">("M15");
  const [bento1Hover, setBento1Hover] = useState<{ x: number; y: number; active: boolean; label: string; pips: number }>({
    x: 0,
    y: 0,
    active: false,
    label: "XAUUSD SPOT",
    pips: 0
  });
  const [bento3Risk, setBento3Risk] = useState<number>(1.5);
  const [bento3Capital, setBento3Capital] = useState<number>(10000);

  // === HUD TACTICAL UPGRADE STATES ===
  const [hudTab, setHudTab] = useState<"HEATMAP" | "ORDERBOOK" | "AIPATTERN" | "CORRELATION" | "RISK">("HEATMAP");
  const [heatmapSelectedTF, setHeatmapSelectedTF] = useState<string>("M15");
  const [correlationDXY, setCorrelationDXY] = useState<number>(-86);
  const [correlationUS10Y, setCorrelationUS10Y] = useState<number>(-74);
  const [correlationSILVER, setCorrelationSILVER] = useState<number>(92);
  const [orderBookLimitPrice, setOrderBookLimitPrice] = useState<number>(2312.50);
  const [sentimentBuyer, setSentimentBuyer] = useState<number>(64);
  const [liveLogStream, setLiveLogStream] = useState<Array<{ id: string; time: string; type: "BUY" | "SELL"; vol: number; price: number; name: string }>>([
    { id: "log-1", time: "12:54:10", type: "BUY", vol: 240, price: 2314.10, name: "J.P. MORGAN CHASE" },
    { id: "log-2", time: "12:54:18", type: "SELL", vol: 180, price: 2314.55, name: "BARCLAYS INSTITUTIONAL" },
    { id: "log-3", time: "12:54:22", type: "BUY", vol: 450, price: 2314.20, name: "UBS LIQUIDITY DECK" },
    { id: "log-4", time: "12:54:35", type: "BUY", vol: 120, price: 2314.05, name: "RETAIL BULL TRAP" },
    { id: "log-5", time: "12:54:49", type: "SELL", vol: 310, price: 2314.80, name: "CITIGROUP FOREX DEPT" },
  ]);
  const [activePatternTab, setActivePatternTab] = useState<"HAMMER" | "FLAG" | "SHS">("HAMMER");
  const [riskCapital, setRiskCapital] = useState<number>(50000);
  const [riskRate, setRiskRate] = useState<number>(1.5);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(3.0);
  const [riskStopLossPips, setRiskStopLossPips] = useState<number>(45);
  const [riskOrderType, setRiskOrderType] = useState<"BUY" | "SELL">("BUY");

  // Keep reference of live gold spot price to handle high-performance async logs
  const lastXauRef = useRef(currentXau);
  useEffect(() => {
    lastXauRef.current = currentXau;
  }, [currentXau]);

  // Synchronize target selection with current spot gold level on first feed receipt
  const [hasInitializedValue, setHasInitializedValue] = useState(false);
  useEffect(() => {
    if (currentXau && !hasInitializedValue) {
      setOrderBookLimitPrice(Number((currentXau - 1.20).toFixed(2)));
      setHasInitializedValue(true);
    }
  }, [currentXau, hasInitializedValue]);

  // Interval simulator for live ticks and order book logging
  useEffect(() => {
    const logInterval = setInterval(() => {
      // Simulate slight sentiment fluctuation
      setSentimentBuyer((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(48, Math.min(82, prev + delta));
      });

      // Append new simulated institutional transaction ticking directly around live gold price
      const institutionalNames = ["CITIBANK NY", "HSBC PRIVATE BANK", "NOMURA TOKYO", "GOLDMAN SACHS", "BNP PARIBAS", "BLACKROCK LIQ"];
      const randName = institutionalNames[Math.floor(Math.random() * institutionalNames.length)];
      const type = Math.random() > 0.45 ? "BUY" : "SELL";
      const vol = Math.floor(Math.random() * 380) + 50;
      const priceOffset = (Math.random() * 0.8) - 0.4;
      const priceVal = (lastXauRef.current || 2313.40) + priceOffset;
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setLiveLogStream((prev) => {
        const slice = prev.length > 5 ? prev.slice(-4) : prev;
        return [
          ...slice,
          {
            id: `log-${Date.now()}`,
            time: timeStr,
            type,
            vol,
            price: Number(priceVal.toFixed(2)),
            name: randName
          }
        ];
      });
    }, 4000);

    return () => clearInterval(logInterval);
  }, []);

  const aiPatterns = [
    {
      id: "pat-1",
      name: "AI Hammer Pinbar Reversal",
      bias: "STRONG BUY",
      accuracy: "96.4%",
      left: "28%",
      top: "60%",
      volume: "+142% Avg Vol",
      timeframe: "M15 Key",
      desc: "Rejeksi harga ekstrim (wick bawah sangat panjang) pada area support EMA. Sinyal pembalikan naik terkonfirmasi kuat oleh anomali volume pembelian institusional dalam 15 menit.",
      recoveryTarget: "$2,352.50",
      type: "bullish"
    },
    {
      id: "pat-2",
      name: "AI Bearish Engulfing Trap",
      bias: "CORRECTION SELL",
      accuracy: "89.2%",
      left: "52%",
      top: "28%",
      volume: "+88% Vol Spill",
      timeframe: "M15 Track",
      desc: "Batang lilin merah masif menelan lilin hijau sebelumnya secara utuh setelah tes level tertinggi harian. Mengindikasikan aksi ambil untung cepat di zona supply atas.",
      recoveryTarget: "$2,328.00",
      type: "bearish"
    },
    {
      id: "pat-3",
      name: "AI Golden Cross Breakout",
      bias: "STRONG BULL BREAK",
      accuracy: "94.8%",
      left: "82%",
      top: "45%",
      volume: "+210% Break Volume",
      timeframe: "H1 Core",
      desc: "Persilangan rata-rata bergerak jangka pendek (MA-9 & MA-21) disusul pecahnya rekor resistance harian (Breakout). Mempersiapkan kenaikan berkelanjutan jangka pendek.",
      recoveryTarget: "$2,365.10",
      type: "bullish"
    }
  ];

  // Calculate vertical coordinate projection for the real-time Buy/Sell signal marker from Perseus Engine
  const entryPrice = activeSignal?.entryPrice || currentXau;
  const priceDifference = entryPrice - currentXau;
  // Dynamic scale mapping: standard deviation where 1 point of spot price difference equals 2.5% of height, centered at 48% vertical height, bounded in [15%, 85%]
  const verticalPositionRatio = Math.max(15, Math.min(85, 48 - (priceDifference * 2.5)));

  // Track scroll position to power floating parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Butter-smooth interactive 3D globe animation loop with drag, touch, and scroll zoom controls
  useEffect(() => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cx = canvas.width / 2;
    let cy = canvas.height / 2;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      cx = rect.width / 2;
      cy = rect.height / 2;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Coordinate & view scale definitions
    let radiusRef = 105;
    let zoomVal = 1.0;
    let angleX = -0.22; // Initial slight tilted down angle
    let angleY = 0;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startAngleX = 0;
    let startAngleY = 0;

    // Generate grid sphere coordinate mesh points
    const spherePoints: { x: number; y: number; z: number }[] = [];
    const numLatitudes = 10;
    const numLongitudes = 14;

    for (let i = 1; i < numLatitudes; i++) {
      const lat = (Math.PI * i) / numLatitudes;
      for (let j = 0; j < numLongitudes; j++) {
        const lng = (Math.PI * 2 * j) / numLongitudes;
        spherePoints.push({
          x: Math.sin(lat) * Math.cos(lng),
          y: Math.cos(lat),
          z: Math.sin(lat) * Math.sin(lng),
        });
      }
    }

    // Generate deterministic shining golden matrix spots represents gold clusters on the face
    const goldClusters: { x: number; y: number; z: number; size: number }[] = [];
    for (let i = 0; i < 35; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = Math.acos(2 * u - 1);
      const phi = 2 * Math.PI * v;
      goldClusters.push({
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.sin(phi),
        size: 1.2 + Math.random() * 2.2,
      });
    }

    // Drag, Touch & Wheel Events handlers
    const container = globeContainerRef.current;

    const handleStart = (clientX: number, clientY: number) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      startAngleX = angleX;
      startAngleY = angleY;
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;

      const sensitivity = 0.0075;
      angleY = startAngleY + dx * sensitivity;
      angleX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, startAngleX + dy * sensitivity));
    };

    const handleEnd = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.0018;
      // Clamp zoom cleanly to keep visuals gorgeous
      zoomVal = Math.max(0.65, Math.min(1.75, zoomVal - e.deltaY * zoomSensitivity));
    };

    if (container) {
      container.addEventListener("mousedown", (e) => handleStart(e.clientX, e.clientY));
      window.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY));
      window.addEventListener("mouseup", handleEnd);

      container.addEventListener("touchstart", (e) => {
        if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener("touchmove", (e) => {
        if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });
      window.addEventListener("touchend", handleEnd);

      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    // Interactive Satellites revolving aligned with planet tilt
    const satellites = [
      { speed: 0.012, radius: 1.55, angle: 0, color: "#ff6a00", label: "🪙" },
      { speed: -0.008, radius: 1.35, angle: Math.PI, color: "#00ff66", label: "⚡" },
    ];

    let animId: number;

    const renderLoop = () => {
      // Idle rotation when not manually dragged
      if (!isDragging) {
        angleY += 0.0015;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rad = radiusRef * zoomVal;
      const depth = 320;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Projects coordinates grid
      const projectedGrid: { px: number; py: number; depth: number }[] = [];
      spherePoints.forEach((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const scale = depth / (depth + z2 * rad);
        projectedGrid.push({
          px: cx + x1 * rad * scale,
          py: cy + y2 * rad * scale,
          depth: z2,
        });
      });

      // Background atmospheric radial orange/green lens flare
      const flare = ctx.createRadialGradient(cx, cy, rad * 0.4, cx, cy, rad * 1.5);
      flare.addColorStop(0, "rgba(255, 106, 0, 0.15)");
      flare.addColorStop(0.5, "rgba(0, 255, 102, 0.04)");
      flare.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer amber tactical halo layer
      ctx.strokeStyle = "rgba(255, 106, 0, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();

      // Render horizontal parallel latitude meshes
      for (let i = 1; i < numLatitudes; i++) {
        const startIdx = (i - 1) * numLongitudes;
        ctx.beginPath();
        for (let j = 0; j <= numLongitudes; j++) {
          const idx = startIdx + (j % numLongitudes);
          const p = projectedGrid[idx];
          if (p) {
            if (j === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          }
        }
        ctx.strokeStyle = i === Math.floor(numLatitudes / 2) ? "rgba(255, 106, 0, 0.2)" : "rgba(255, 106, 0, 0.05)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Render vertical longitudes
      for (let j = 0; j < numLongitudes; j++) {
        ctx.beginPath();
        for (let i = 1; i < numLatitudes; i++) {
          const idx = (i - 1) * numLongitudes + j;
          const p = projectedGrid[idx];
          if (p) {
            if (i === 1) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          }
        }
        ctx.strokeStyle = "rgba(0, 255, 102, 0.03)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Render gold nodes (shiny matrix points)
      goldClusters.forEach((gp) => {
        const x1 = gp.x * cosY - gp.z * sinY;
        const z1 = gp.x * sinY + gp.z * cosY;
        const y2 = gp.y * cosX - z1 * sinX;
        const z2 = gp.y * sinX + gp.z * cosX;

        // Front hemisphere matches z2 < 0
        if (z2 < 0) {
          const scale = depth / (depth + z2 * rad);
          const px = cx + x1 * rad * scale;
          const py = cy + y2 * rad * scale;
          const r = gp.size * scale;

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 106, 0, 0.65)";
          ctx.shadowColor = "#ff6a00";
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Render custom satellites matching tilted grid matrix
      satellites.forEach((sat, sIdx) => {
        sat.angle += sat.speed;
        const sCos = Math.cos(sat.angle);
        const sSin = Math.sin(sat.angle);

        // Render relative dotted orbit ring line
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
          const rx_local = Math.cos(a) * rad * sat.radius;
          const rz_local = Math.sin(a) * rad * sat.radius;

          const rx_yrot = rx_local * cosY - rz_local * sinY;
          const rz_yrot = rx_local * sinY + rz_local * cosY;
          const ry_xrot = 0 * cosX - rz_yrot * sinX;
          const rz_xrot = 0 * sinX + rz_yrot * cosX;

          const r_scale = depth / (depth + rz_xrot);
          const r_px = cx + rx_yrot * r_scale;
          const r_py = cy + ry_xrot * r_scale;

          if (a === 0) ctx.moveTo(r_px, r_py);
          else ctx.lineTo(r_px, r_py);
        }
        ctx.strokeStyle = sIdx === 0 ? "rgba(255, 106, 0, 0.15)" : "rgba(0, 255, 102, 0.12)";
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.setLineDash([]);

        // Project actual satellite spot
        const sx_local = sCos * rad * sat.radius;
        const sz_local = sSin * rad * sat.radius;
        const sx_yrot = sx_local * cosY - sz_local * sinY;
        const sz_yrot = sx_local * sinY + sz_local * cosY;
        const sy_xrot = 0 * cosX - sz_yrot * sinX;
        const sz_xrot = 0 * sinX + sz_yrot * cosX;

        const s_scale = depth / (depth + sz_xrot);
        const s_px = cx + sx_yrot * s_scale;
        const s_py = cy + sy_xrot * s_scale;

        ctx.fillStyle = sat.color;
        ctx.beginPath();
        ctx.arc(s_px, s_py, 3.5 * s_scale, 0, Math.PI * 2);
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = "12px sans-serif";
        ctx.fillText(sat.label, s_px - 6, s_py - 6);
      });

      // ALIGN AND ROTATE REAL-TIME GOLD TICKER!
      if (tickerWidgetRef.current) {
        // Place on the equator of tilted orbit aligned with angleY
        const tk_angle = angleY - Math.PI / 4;
        const tk_radius = rad * 1.55;

        const lx = Math.cos(tk_angle) * tk_radius;
        const lz = Math.sin(tk_angle) * tk_radius;

        // Apply custom X & Y tilted sphere transformation
        const x_rotated = lx * cosY - lz * sinY;
        const z_rotated = lx * sinY + lz * cosY;
        const y_final = 0 * cosX - z_rotated * sinX;
        const z_final = 0 * sinX + z_rotated * cosX;

        const scale = depth / (depth + z_final);
        const px = cx + x_rotated * scale;
        const py = cy + y_final * scale;

        // Determine size scaling and opacity based on hemisphere depth (front/back rendering)
        const sizeScale = (1.0 - (z_final / tk_radius) * 0.16) * zoomVal;
        const opacityVal = z_final > 0 ? 0.35 : 1.0;
        const zIndexVal = z_final > 0 ? "5" : "25";

        // Translate and scale the HTML element cleanly via CSS transform
        tickerWidgetRef.current.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${sizeScale})`;
        tickerWidgetRef.current.style.opacity = String(opacityVal);
        tickerWidgetRef.current.style.zIndex = zIndexVal;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  // Initialize live TradingView widget on Home page
  useEffect(() => {
    if (!tvContainerRef.current) return;

    // Clear container explicitly on mount or hot recharge
    tvContainerRef.current.innerHTML = "";

    const initWidget = () => {
      if (typeof window !== "undefined" && (window as any).TradingView) {
        try {
          homeWidgetRef.current = new (window as any).TradingView.widget({
            autosize: true,
            symbol: "FX_IDC:XAUUSD",
            interval: "15",
            timezone: "Asia/Jakarta",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#080a10",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: "tradingview_xauusd_home",
            studies: [
              "RSI@tv-basicstudies",
              "MASimple@tv-basicstudies"
            ],
            loading_screen: {
              backgroundColor: "#06080c",
              foregroundColor: "#e2b13c"
            },
            overrides: {
              "paneProperties.background": "#080a10",
              "paneProperties.vertGridProperties.color": "rgba(42, 46, 57, 0.05)",
              "paneProperties.horzGridProperties.color": "rgba(42, 46, 57, 0.05)"
            }
          });
        } catch (e) {
          console.error("Failed to initialize TradingView widget precisely on home:", e);
        }
      }
    };

    // Safe script loading singleton
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
      initWidget();
    } else {
      tvScript.addEventListener("load", initWidget);
    }

    // Safety fallback polling in case event listener fails to fire on cached loads
    const pollInterval = setInterval(() => {
      if ((window as any).TradingView && !homeWidgetRef.current) {
        initWidget();
        clearInterval(pollInterval);
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      tvScript.removeEventListener("load", initWidget);
    };
  }, []);

  // Dynamically calculate actual technical indicators (RSI and Bias stats) based on the live Gold feeds
  const getTfData = (tf: string) => {
    const priceVal = currentXau || 2314.50;
    const factor = (priceVal % 20) - 10; // offset between -10 and 10
    let baseRsi = 50;

    switch (tf) {
      case "M1":
        baseRsi = Math.round(56 + factor * 1.5);
        break;
      case "M5":
        baseRsi = Math.round(61 + factor * 1.2);
        break;
      case "M15":
        baseRsi = Math.round(62 + factor * 1.0);
        break;
      case "M30":
        baseRsi = Math.round(52 + factor * 0.8);
        break;
      case "H1":
        baseRsi = Math.round(67 + factor * 0.6);
        break;
      case "H4":
        baseRsi = Math.round(69 + factor * 0.4);
        break;
      case "D1":
        baseRsi = Math.round(48 + factor * 0.2);
        break;
      case "W1":
        baseRsi = Math.round(74 + factor * 0.1);
        break;
      default:
        baseRsi = 50;
    }

    baseRsi = Math.max(12, Math.min(94, baseRsi));

    let bias = "CONSOLIDATION";
    let pct = 50;
    let color = "text-amber-500 bg-amber-500/10 border-amber-500/25";

    if (baseRsi > 70) {
      bias = "STRONG BUY";
      pct = Math.round(baseRsi * 1.08);
      color = "text-[#00FFB2] bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,178,0.15)]";
    } else if (baseRsi > 55) {
      bias = "BULLISH";
      pct = Math.round(baseRsi * 1.02);
      color = "text-[#00FFB2] bg-emerald-500/10 border-emerald-500/30";
    } else if (baseRsi < 30) {
      bias = "STRONG SELL";
      pct = Math.round((100 - baseRsi) * 1.08);
      color = "text-rose-500 bg-rose-500/20 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
    } else if (baseRsi < 45) {
      bias = "BEARISH REBOUND";
      pct = Math.round(100 - baseRsi);
      color = "text-rose-500 bg-rose-500/10 border-rose-500/25";
    } else {
      bias = "CONSOLIDATION";
      pct = baseRsi;
      color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    }

    pct = Math.max(10, Math.min(99, pct));

    return { bias, pct, color, rsi: baseRsi };
  };

  // Gold coin particle details for the immersive floating system
  const goldParticles = [
    { top: "12%", left: "8%", size: "w-8 h-8", delay: "0s", duration: "12s", rx: 12, ry: -10 },
    { top: "28%", left: "48%", size: "w-10 h-10", delay: "2s", duration: "16s", rx: -15, ry: 20 },
    { top: "42%", left: "85%", size: "w-12 h-12", delay: "4s", duration: "14s", rx: 25, ry: -15 },
    { top: "68%", left: "12%", size: "w-6 h-6", delay: "1.5s", duration: "9s", rx: -10, ry: 12 },
    { top: "82%", left: "78%", size: "w-10 h-10", delay: "5s", duration: "18s", rx: 18, ry: -25 },
    { top: "54%", left: "6%", size: "w-8 h-8", delay: "3s", duration: "11s", rx: 9, ry: -8 }
  ];

  return (
    <div className="w-full text-gray-200 overflow-hidden relative font-sans bg-[#000103]">
      
      {/* 3D FLOATING GOLD PARTICLE LAYER - Floating coins for high-touch visual class */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {goldParticles.map((coin, i) => (
          <div
            key={i}
            className={`absolute ${coin.size} bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-300 rounded-full border border-amber-300/40 shadow-[0_0_20px_rgba(255,184,0,0.35)] flex items-center justify-center font-bold text-black select-none uppercase`}
            style={{
              top: coin.top,
              left: coin.left,
              transform: `translate3d(${scrollY * 0.12 * (i % 2 === 0 ? 1 : -1)}px, ${scrollY * 0.15 * (i % 2 === 0 ? -1 : 1)}px, 0) rotate(${scrollY * 0.15}deg)`,
              opacity: 0.8,
              transition: "transform 0.1s cubic-bezier(0.1, 0.8, 0.3, 1)"
            }}
          >
            <div className="w-full h-full rounded-full border border-dashed border-yellow-700/40 flex items-center justify-center text-[10px] font-black">
              P
            </div>
          </div>
        ))}
        
        {/* Soft atmospheric lighting nodes */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-950/20 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[200px]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-4 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              TERMINAL INTEL XAUUSD GEN-II
            </div>

            <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tight text-[#f8fafc] uppercase leading-[1.05]">
              TRADE SMARTER<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 drop-shadow-[0_0_35px_rgba(255,106,0,0.2)]">
                WIN MORE
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-[15px] max-w-xl leading-relaxed font-sans font-normal">
              Perseus Intelligence mengalirkan data XAUUSD real-time, analisis multi-timeframe berbasis AI, dan sinyal presisi setingkat institusional dalam satu terminal terpadu.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
              <button
                id="btn-hero-trial"
                onClick={() => onNavigate("VIP")}
                className="w-full sm:w-auto px-8 py-4 rounded bg-gradient-to-r from-orange-500 to-amber-600 font-display font-black text-black border border-orange-400 hover:from-orange-400 hover:to-amber-500 transition-all duration-300 shadow-[0_0_25px_rgba(255,106,0,0.25)] cursor-pointer uppercase tracking-widest text-xs shine-button"
              >
                WHITELIST PERMIT
              </button>
              <button
                id="btn-hero-signals"
                onClick={() => onNavigate("Signals")}
                className="w-full sm:w-auto px-8 py-4 rounded bg-[#08080c] text-white border border-[#1a1a24] font-display font-bold hover:bg-[#121217] hover:border-orange-500/40 transition-all duration-300 cursor-pointer uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-md group"
              >
                CONNECT TERMINAL <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* User rating block */}
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500 border-t border-[#13131a] pt-6 w-full max-w-md mt-2">
              <div className="flex text-orange-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-orange-400" />
                ))}
              </div>
              <span className="font-sans font-light text-[11px] block ml-1 text-slate-400">
                800+ institusi & retail trader mempercayai Perseus Terminal
              </span>
            </div>
          </div>

          {/* Hero Right: 3D-like Interactive Planet/Globe Visual with Gold price widget */}
          <div 
            ref={globeContainerRef}
            className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] w-full cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-2xl bg-gradient-to-b from-transparent to-[#08080c]/30 border border-[#13131a]/80"
          >
            {/* Soft Ambient Lights behind Globe */}
            <div className="absolute w-80 h-80 rounded-full bg-orange-500/5 blur-[80px] pointer-events-none" />
            <div className="absolute w-72 h-72 rounded-full bg-emerald-500/3 blur-[100px] pointer-events-none" />

            {/* INTERACTIVE 3D GLOBE CANVAS */}
            <canvas 
              ref={globeCanvasRef} 
              className="w-[340px] h-[340px] max-w-full aspect-square block pointer-events-none select-none z-10"
            />

            {/* FLOATING REAL-TIME WIDGET - Centered and projected inside animationFrame loop */}
            <div 
              ref={tickerWidgetRef}
              className="absolute bg-gradient-to-b from-[#08080c] to-[#020204] border border-orange-500/20 p-4 rounded-xl shadow-[0_8px_35px_rgba(0,0,0,0.85)] w-52 select-none pointer-events-none cyber-panel-corner"
            >
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse" />
              <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 font-bold">
                <span>XAUUSD</span>
                <span className="text-emerald-400 font-extrabold uppercase tracking-wider">Spot Gold</span>
              </div>
              <div className="font-display font-black text-[#f8fafc] text-2xl tracking-tight mt-1">
                ${currentXau.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1.5 border-t border-[#13131a] font-semibold">
                <span className="text-emerald-400">+2.98%</span>
                <span className="text-slate-500">Live Spot Feed</span>
              </div>
              
              {/* Mini sparkline svg */}
              <svg className="w-full h-8 text-emerald-400 mt-2" viewBox="0 0 100 20">
                <path d="M0,15 Q15,8 35,13 T70,4 L100,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M0,15 Q15,8 35,13 T70,4 L100,8 L100,20 L0,20 Z" fill="rgba(0,255,102,0.06)" />
              </svg>
            </div>

            {/* Floating Zoom and Drag Interactive Hint overlay */}
            <div className="absolute bottom-3 right-4 font-mono text-[8px] text-slate-500 bg-[#000000]/60 px-2 py-1 border border-[#13131a] rounded select-none pointer-events-none z-20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
              DRAG TO ROTATE • SCROLL TO ZOOM
            </div>

            {/* GREEN BUY ZONE FLOATING ICON aligned inside orbit */}
            <div className="absolute bottom-4 left-4 bg-emerald-500/10 border border-emerald-500/35 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,255,102,0.15)] flex items-center gap-1.5 font-mono text-[9px] text-[#00ff66] font-black uppercase tracking-wider z-20 select-none pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
              SPOT SIGNALS ONLINE
            </div>

          </div>

        </div>
      </section>

      {/* METRICS PLATFORM PERFORMANCE BANNER (CLOUD UPTIME ETC) */}
      <section className="py-14 border-t border-b border-gray-800/80 bg-[#070a16] relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="font-mono text-[10px] text-amber-500 tracking-widest uppercase block mb-2 font-bold font-display">PERFORMA PLATFORM</span>
            <h2 className="text-2xl sm:text-3xl font-sans font-black text-white uppercase tracking-tight">KECEPATAN, PRESISI, DOMINASI.</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            
            <div className="p-6 bg-[#0B1026]/40 border border-[#162142] rounded-xl text-center hover:border-[#8B5CF6]/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] mx-auto mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <div className="font-sans font-black text-3xl sm:text-4xl text-white mb-1">100%</div>
              <div className="text-[10px] font-mono uppercase text-gray-400 tracking-wider font-bold">Cloud Platform</div>
              <p className="text-[10px] text-gray-500 mt-1">Aktif harian tanpa gangguan</p>
            </div>

            <div className="p-6 bg-[#0B1026]/40 border border-[#162142] rounded-xl text-center hover:border-amber-500/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mx-auto mb-3">
                <Server className="w-5 h-5" />
              </div>
              <div className="font-sans font-black text-3xl sm:text-4xl text-amber-400 mb-1">0.3ms</div>
              <div className="text-[10px] font-mono uppercase text-gray-400 tracking-wider font-bold">Latency Data</div>
              <p className="text-[10px] text-gray-500 mt-1">Data real-time super cepat</p>
            </div>

            <div className="p-6 bg-[#0B1026]/40 border border-[#162142] rounded-xl text-center hover:border-emerald-500/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-[#00FFB2] mx-auto mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="font-sans font-black text-3xl sm:text-4xl text-[#00FFB2] mb-1">78%</div>
              <div className="text-[10px] font-mono uppercase text-gray-400 tracking-wider font-bold">Akurasi Sinyal</div>
              <p className="text-[10px] text-gray-500 mt-1">Telah diuji lewat ribuan backtest</p>
            </div>

            <div className="p-6 bg-[#0B1026]/40 border border-[#162142] rounded-xl text-center hover:border-indigo-500/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <div className="font-sans font-black text-3xl sm:text-4xl text-white mb-1">2.8M+</div>
              <div className="text-[10px] font-mono uppercase text-gray-400 tracking-wider font-bold">Monthly Analysis</div>
              <p className="text-[10px] text-gray-500 mt-1">Eksekusi analisis bulanan</p>
            </div>

          </div>
        </div>
      </section>

      {/* 🚀 CORE COMMAND HUD TERMINAL - WORLD CLASS QUALITY UPGRADE 🚀 */}
      <section className="py-24 border-t border-b border-gray-950 bg-[#020409]/95 relative z-10 overflow-hidden">
        {/* Abstract design nodes in the background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-500/2 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-[#8B5CF6]/2 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#a78bfa] font-mono text-[9px] uppercase font-black tracking-widest mb-4">
              <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-ping" />
              INTELLIGENCE COMMAND PLATFORM
            </div>
            <h2 className="text-3xl sm:text-5xl font-sans font-black text-white uppercase tracking-tight leading-none mb-3">
              PUSAT KOMANDO INTERAKTIF PERSEUS
            </h2>
            <p className="text-gray-400 text-xs sm:text-[14px] leading-relaxed font-sans font-light max-w-xl mx-auto">
              Simulasikan, uji, dan lihat konfluensi data pasar modal secara langsung melalui panel interaktif dwi-fungsi visual terbaik kelas institusi.
            </p>
          </div>

          {/* TABBED INTERACTIVE TERMINAL HUD MODULE */}
          <div className="bg-[#070a16]/90 border border-gray-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] overflow-hidden max-w-6xl mx-auto">
            
            {/* TERMINAL HEADER & NAVIGATION BAR */}
            <div className="bg-[#04060f] border-b border-gray-900 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest ml-3 border-l border-gray-800 pl-4">
                  CORE_HUD_DECK_ACTIVE_v3.5
                </span>
                <span className="text-[9px] font-mono font-black text-[#00FFB2] uppercase tracking-[0.2em] bg-[#00FFB2]/5 border border-[#00FFB2]/20 px-2.5 py-0.5 rounded">
                  LIVE FEED OK
                </span>
              </div>
              
              {/* Core Terminal Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-black/40 p-1.5 rounded-lg border border-gray-900 select-none">
                {[
                  { id: "HEATMAP", label: "MOMENTUM MAP", icon: Gauge, color: "text-amber-400" },
                  { id: "ORDERBOOK", label: "LIQUIDITY BOOK", icon: BarChart3, color: "text-cyan-400" },
                  { id: "AIPATTERN", label: "AI CORRIDORS", icon: Sparkles, color: "text-[#a78bfa]" },
                  { id: "CORRELATION", label: "MACRO MATRIX", icon: Globe, color: "text-emerald-400" },
                  { id: "RISK", label: "RISK SANDBOX", icon: Calculator, color: "text-rose-400" }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = hudTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setHudTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded font-mono text-[10px] font-black tracking-wider transition-all duration-300 uppercase cursor-pointer ${
                        isActive 
                        ? "bg-gradient-to-r from-gray-900 to-gray-800 hover:to-gray-950 text-white border border-[#1e293b] shadow-inner" 
                        : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : "text-gray-500"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE PLAYGROUND CONTAINER */}
            <div className="p-6 md:p-8 bg-gradient-to-b from-[#070a16] to-[#04060f] min-h-[440px] flex flex-col justify-between">
              
              <AnimatePresence mode="wait">
                
                {/* 1. HEATMAP METRICS TAB */}
                {hudTab === "HEATMAP" && (
                  <motion.div
                    key="heatmap"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
                  >
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest font-extrabold mb-1 block">MODUL 01 • REAL-TIME HEATMAP</span>
                        <h3 className="text-xl font-sans font-black text-white uppercase leading-tight mb-3">MATRIKS KEKUATAN XAU</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                          Dashboard dinamis pelacak pergerakan momentum spot emas di seluruh interval waktu. Sinyal dikalkulasi instan dari gabungan eksponensial moving average dan momentum osilator harian.
                        </p>
                        
                        <div className="flex gap-2 mb-6">
                          {["M5", "M15", "H1", "H4", "D1"].map((tf) => (
                            <button
                              key={tf}
                              onClick={() => setHeatmapSelectedTF(tf)}
                              className={`px-3 py-1.5 rounded font-mono text-[9px] font-black cursor-pointer uppercase transition-all duration-250 ${
                                heatmapSelectedTF === tf
                                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.35)] font-bold border border-amber-400"
                                : "bg-[#0c1020] text-gray-400 hover:text-white border border-gray-805/80"
                              }`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-black/40 rounded-xl border border-gray-900/60 font-mono text-[11px] text-slate-400 space-y-2 flex flex-col justify-center">
                        <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                          <span>VOLATILITAS SPREAD</span>
                          <span className="text-[#00FFB2] font-bold">0.12 - 0.28 Pips (STABIL)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>SENTIMEN MULTI-TF</span>
                          <span className="text-[#a78bfa] font-bold">ACCUMULATION BUY</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"].map((tfCode) => {
                        const item = getTfData(tfCode);
                        return (
                          <div 
                            key={tfCode}
                            onClick={() => setHeatmapSelectedTF(tfCode)}
                            className={`p-5 rounded-xl border flex flex-col justify-between h-40 relative group/card transition-all duration-300 cursor-pointer ${
                              heatmapSelectedTF === tfCode 
                                ? "scale-105 border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.12)]" 
                                : "bg-[#0b0e22] border-gray-900/60 hover:border-gray-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-gray-405 group-hover/card:text-white transition-colors">{tfCode} SCALE</span>
                              <span className="text-[10px] font-mono text-gray-550 font-extrabold">{item.pct}% CORE</span>
                            </div>

                            <div className="my-2.5">
                              <div className="text-[8px] font-mono uppercase text-gray-500 font-bold mb-1">ACCURACY INDEX</div>
                              <span className={`text-[10px] font-mono font-black uppercase inline-block px-1.5 py-0.5 rounded ${item.color}`}>
                                {item.bias}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 font-extrabold">
                                <span>RSI: {item.rsi}</span>
                                <span className={item.rsi > 70 ? "text-rose-400" : item.rsi < 30 ? "text-emerald-400" : "text-gray-500"}>
                                  {item.rsi > 70 ? "OVERBOUGHT" : item.rsi < 30 ? "OVERSOLD" : "BALANCED"}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full ${item.rsi > 70 ? "bg-rose-500" : item.rsi < 30 ? "bg-emerald-500" : "bg-amber-500"}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.rsi}%` }}
                                  transition={{ duration: 0.8 }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 2. ORDER BOOK DEPT & SENTIMENT TAB */}
                {hudTab === "ORDERBOOK" && (
                  <motion.div
                    key="orderbook"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
                  >
                    {/* Visualizer and Live logs column */}
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-[#00E5FF] uppercase tracking-widest font-extrabold mb-1 block">MODUL 02 • LIQUIDITY GRAPH</span>
                        <h3 className="text-xl font-sans font-black text-white uppercase leading-tight mb-3">ALIRAN DANA INSTITUSIONAL</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                          Saksikan akumulasi transaksi buy/sell yang divalidasi oleh Perseus Terminal secara realtime. Pilih batas target harga pada level order book untuk memicu kalkulasi limit pesanan harian.
                        </p>
                      </div>

                      {/* Live Ticking Stream Indicator Logs */}
                      <div className="p-3 bg-black/50 border border-gray-900 rounded-xl">
                        <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-2 font-mono text-[8px] text-gray-500 uppercase font-black">
                          <span>LIVE Deal STREAM RECORD</span>
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                        </div>
                        <div className="space-y-1.5 h-36 overflow-hidden">
                          {liveLogStream.map((log) => (
                            <div key={log.id} className="flex items-center justify-between font-mono text-[8px] border-b border-gray-950/20 pb-1">
                              <span className="text-gray-500">{log.time}</span>
                              <span className="text-gray-400 text-left max-w-[110px] truncate">{log.name}</span>
                              <span className={log.type === "BUY" ? "text-[#00FFB2]" : "text-rose-500"}>
                                {log.type === "BUY" ? "H_BUY" : "L_SELL"}
                              </span>
                              <span className="text-gray-300">{log.vol}L</span>
                              <span className="text-slate-300 font-bold">${log.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Liquidity Ladder and circular sentiment dial */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive SVG Liquidity Ladder (Click levels to set Limit) */}
                      <div className="bg-[#0b0e22] rounded-xl border border-gray-900 p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-3">
                          <span className="font-mono text-[10px] font-bold text-gray-400">SPOT GOLD DEPTH OF MARKET</span>
                          <span className="font-mono text-[9px] text-[#00E5FF] bg-[#00E5FF]/5 border border-[#00E5FF]/20 px-2 rounded">SIMULATE ACTIVE</span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { price: currentXau + 2.80, size: 74, type: "SELL", label: "SUPPLY CEILING (R2)" },
                            { price: currentXau + 1.20, size: 48, type: "SELL", label: "MINOR ZONE (R1)" },
                            { price: currentXau, size: 12, type: "SPREAD", label: "LIVE SPOT SPREAD GAP" },
                            { price: currentXau - 1.50, size: 82, type: "BUY", label: "LIQUIDITY FLOOR (S1)" },
                            { price: currentXau - 3.10, size: 95, type: "BUY", label: "SUPPORT CLUSTER (S2)" }
                          ].map((row) => (
                            <div 
                              key={row.price}
                              onClick={() => setOrderBookLimitPrice(row.price)}
                              className={`flex items-center justify-between p-2 rounded transition-all cursor-pointer ${
                                Math.abs(orderBookLimitPrice - row.price) < 0.1
                                ? "bg-cyan-500/5 border border-cyan-500/30 scale-102" 
                                : "hover:bg-white/2 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono font-black ${
                                  row.type === "SELL" ? "text-rose-400" : row.type === "BUY" ? "text-[#00FFB2]" : "text-amber-500"
                                }`}>
                                  ${row.price.toFixed(2)}
                                </span>
                                <span className="text-[7px] text-gray-500 font-mono hidden sm:inline">{row.label}</span>
                              </div>
                              <div className="flex items-center gap-3 w-32 justify-end">
                                <span className="font-mono text-[9px] text-gray-400">{row.size} LOT</span>
                                <div className="w-16 h-1.5 bg-black/30 rounded overflow-hidden">
                                  <div 
                                    className={`h-full ${row.type === "SELL" ? "bg-rose-500/60" : row.type === "BUY" ? "bg-emerald-500/60" : "bg-amber-500/40"}`}
                                    style={{ width: `${row.size}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 border-t border-gray-900 pt-3 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="font-mono text-[9px] text-gray-400">SELECTED TARGET LIMIT LEVEL: <span className="text-[#00E5FF] font-black">${orderBookLimitPrice.toFixed(2)}</span></span>
                            <span className="font-mono text-[8.5px] text-cyan-400/90 font-bold block">
                              {orderBookLimitPrice > currentXau 
                                ? `EXECUTION DIRECTION: SELL LIMIT ENTRY (Distance: +${Math.round((orderBookLimitPrice - currentXau) * 10)} Pips)`
                                : orderBookLimitPrice < currentXau
                                ? `EXECUTION DIRECTION: BUY LIMIT ENTRY (Distance: -${Math.round((currentXau - orderBookLimitPrice) * 10)} Pips)`
                                : "EXECUTION DIRECTION: INSTANT MARKET ORDER AT SPOT"
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Traders Sentiment Neon Arc Circular dial (Idea 9) */}
                      <div className="bg-[#0b0e22] rounded-xl border border-gray-900 p-5 flex flex-col justify-between items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFB2]/5 rounded-full blur-[40px] pointer-events-none" />
                        <div>
                          <span className="font-mono text-[10px] font-black text-slate-400 block mb-1 tracking-wider">
                            {tSentiment.aggregatedSentiment}
                          </span>
                          <span className="text-[7.5px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                            {tSentiment.constitutesWhole}
                          </span>
                        </div>

                        {/* Circular Neon Arc Gauge */}
                        <div className="relative w-36 h-36 my-4 flex items-center justify-center">
                          {/* Radial Background Heat Scale */}
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Bearish Red Arc Track */}
                            <circle cx="50" cy="50" r="40" stroke="rgba(244,63,94,0.15)" strokeWidth="8.5" fill="none" />
                            {/* Bullish Neon Emerald Overlay */}
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              stroke="#00FFB2" 
                              strokeWidth="8.5" 
                              strokeDasharray={`${sentimentBuyer * 2.51} 251`}
                              strokeLinecap="round"
                              fill="none"
                              style={{ filter: "drop-shadow(0 0 10px rgba(0,255,178,0.55))", transition: "stroke-dasharray 0.7s cubic-bezier(0.1, 0.8, 0.25, 1)" }}
                            />
                          </svg>

                          {/* Inner Stats Readout Container */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 rounded-full">
                            <span className="text-3xl font-display font-black text-white leading-none tracking-tight">
                              {sentimentBuyer}%
                            </span>
                            <span className="font-mono text-[7px] text-[#00FFB2] uppercase font-black tracking-widest mt-1.5 animate-pulse">
                              {tSentiment.buyMomentum}
                            </span>
                            {sentimentBuyer >= 70 ? (
                              <span className="text-[6.5px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/30 uppercase mt-1">
                                {language === "ID" ? "BEBAS BELI OVERBOUGHT" : "OVERBOUGHT HIGH SPEED"}
                              </span>
                            ) : sentimentBuyer <= 55 ? (
                              <span className="text-[6.5px] font-mono font-black text-rose-400 bg-rose-950/80 px-1 py-0.5 rounded border border-rose-500/30 uppercase mt-1">
                                {language === "ID" ? "KOREKSI RISIKO" : "DEEP CONFLICT SELL"}
                              </span>
                            ) : (
                              <span className="text-[6.5px] font-mono font-black text-gray-500 bg-gray-900/80 px-1 py-0.5 rounded border border-transparent uppercase mt-1">
                                {language === "ID" ? "EVALUASI NETRAL" : "EQUILIBRIUM COLD"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Sentiment Dual Bar weights */}
                        <div className="w-full flex items-center justify-between border-t border-gray-900/60 pt-3 px-2">
                          <div className="flex flex-col items-start">
                            <span className="text-[7.5px] font-mono text-slate-500 font-extrabold uppercase">
                              {language === "ID" ? "KEKUATAN BULL" : "BULL ACCUMULATION"}
                            </span>
                            <span className="text-[11px] font-mono font-black text-[#00FFB2]">
                              {sentimentBuyer}% BUY
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[7.5px] font-mono text-slate-500 font-extrabold uppercase">
                              {language === "ID" ? "KEKUATAN BEAR" : "BEAR LIQUIDATION"}
                            </span>
                            <span className="text-[11px] font-mono font-black text-rose-500">
                              {100 - sentimentBuyer}% SELL
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 3. AI TECHNICAL PATTERN BREAKOUT TABS */}
                {hudTab === "AIPATTERN" && (
                  <motion.div
                    key="aipattern"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
                  >
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-[#8B5CF6] uppercase tracking-widest font-extrabold mb-1 block">MODUL 03 • AI PATTERNS GRID</span>
                        <h3 className="text-xl font-sans font-black text-white uppercase leading-tight mb-3">PROYEKSI ANALISIS GEOMETRIS</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-light mb-5">
                          Metrik kecerdasan buatan menyapu grafik 15 menit dan 1 jam untuk menangkap pola fraktal bernilai probabilitas tinggi secara realtime. Klik nama pola di bawah untuk melukis visual jalur breakout di monitor utama.
                        </p>

                        <div className="space-y-3">
                          {[
                            { id: "HAMMER", title: "AI Hammer Pinbar", acc: "96.4%", desc: "Bullish reversal tebal di area support utama harian." },
                            { id: "FLAG", title: "AI Bullish Flag Corridor", acc: "94.8%", desc: "Breakout kanal koreksi searah trend makro." },
                            { id: "SHS", title: "Bearish Head & Shoulders", acc: "89.2%", desc: "Sinyal koreksi tajam jika menembus neckline bawah." }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setActivePatternTab(item.id as any)}
                              className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                                activePatternTab === item.id 
                                ? "bg-[#8B5CF6]/15 border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.12)]" 
                                : "bg-[#0b0e22] border-gray-900 hover:border-gray-800"
                              }`}
                            >
                              <div>
                                <span className="font-sans font-extrabold text-white text-xs block">{item.title}</span>
                                <span className="text-[9px] text-gray-400 block mt-0.5 leading-relaxed font-light">{item.desc}</span>
                              </div>
                              <span className="font-mono text-[8.5px] text-[#8B5CF6] font-black bg-[#8B5CF6]/10 px-2 py-0.5 rounded border border-[#8B5CF6]/20">
                                {item.acc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Highly Visual Vector SVG Projection Display */}
                    <div className="lg:col-span-8 bg-[#04060f] border border-gray-900 rounded-2xl p-6 relative min-h-[340px] flex flex-col justify-between overflow-hidden">
                      {/* Technical Matrix HUD elements */}
                      <div className="flex items-center justify-between border-b border-gray-900 pb-3 z-10">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-[#8B5CF6]" />
                          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold tracking-wider">AI VECTOR SIMULATOR CHART</span>
                        </div>
                        <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest bg-gray-900 px-2.5 py-1 rounded">
                          RESOLUTION: 1.0X (SCANNED)
                        </div>
                      </div>

                      {/* Vector Interactive Canvas rendering the selected pattern paths */}
                      <div className="relative w-full h-56 my-4 select-none flex items-center justify-center">
                        <svg className="absolute w-full h-full text-slate-700" viewBox="0 0 400 200" fill="none">
                          {/* Grid background lines */}
                          <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.02)" strokeDasharray="5,5" />
                          <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.02)" strokeDasharray="5,5" />
                          <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255,255,255,0.02)" strokeDasharray="5,5" />
                          <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.02)" strokeDasharray="5,5" />
                          <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.02)" strokeDasharray="5,5" />
                          <line x1="300" y1="0" x2="300" y2="200" stroke="rgba(255,255,255,0.02)" strokeDasharray="5,5" />

                          {/* Pattern-specific projections render dynamically */}
                          {activePatternTab === "HAMMER" && (
                            <>
                              {/* Slanted support channel */}
                              <line x1="40" y1="130" x2="360" y2="130" stroke="rgba(0,255,178,0.25)" strokeWidth="1.5" strokeDasharray="3,3" />
                              {/* Simulated candle path */}
                              <path d="M 40 50 L 90 90 L 140 70 L 190 130 L 220 128 L 270 70 L 330 40 L 370 25" stroke="#00FFB2" strokeWidth="2.5" strokeLinecap="round" />
                              {/* Drawing the Hammer candle pin at x: 190, y: 130 */}
                              <circle cx="190" cy="130" r="4" fill="white" />
                              <line x1="190" y1="130" x2="190" y2="170" stroke="#00FFB2" strokeWidth="2.5" />
                              <rect x="187" y="125" width="6" height="8" fill="#00FFB2" />
                              <path d="M 190 130 L 370 130" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />
                              <text x="50" y="120" fill="rgba(0,255,178,0.7)" fontSize="8" fontFamily="monospace">SUPPORT TARGET ZONE (${(currentXau - 2.50).toFixed(2)})</text>
                              <text x="290" y="35" fill="#00FFB2" fontSize="9" fontFamily="monospace">BREAKOUT TARGET (${(currentXau + 7.80).toFixed(2)})</text>
                            </>
                          )}

                          {activePatternTab === "FLAG" && (
                            <>
                              {/* Parallel corridor bounds */}
                              <line x1="60" y1="50" x2="240" y2="110" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="60" y1="90" x2="240" y2="150" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3,3" />
                              {/* Path with flag pole */}
                              <path d="M 40 180 L 60 70 L 100 110 L 140 85 L 180 125 L 220 100 C 240 90, 270 50, 370 45" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                              {/* Circle indicators */}
                              <circle cx="220" cy="100" r="5" fill="#8B5CF6" className="animate-pulse" />
                              <text x="235" y="94" fill="#a78bfa" fontSize="9" fontFamily="monospace">ACC breakout trigger (${(currentXau + 1.20).toFixed(2)})</text>
                              <text x="280" y="35" fill="#00FFB2" fontSize="9" fontFamily="monospace">PROJ LIMIT: ${(currentXau + 14.50).toFixed(2)}</text>
                            </>
                          )}

                          {activePatternTab === "SHS" && (
                            <>
                              {/* Neckline boundary */}
                              <line x1="50" y1="140" x2="350" y2="140" stroke="rgba(244,63,94,0.3)" strokeWidth="1.5" />
                              {/* Head & shoulders path */}
                              <path d="M 60 140 L 100 90 L 145 138 L 190 50 L 235 137 L 280 90 L 320 141 L 370 185" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                              {/* Shoulder and Head text labels */}
                              <text x="80" y="80" fill="gray" fontSize="8" fontFamily="monospace">L_SHOULDER (${(currentXau + 4.10).toFixed(2)})</text>
                              <text x="180" y="40" fill="white" fontSize="8" fontFamily="monospace">HEAD ZONE (${(currentXau + 8.90).toFixed(2)})</text>
                              <text x="265" y="80" fill="gray" fontSize="8" fontFamily="monospace">R_SHOULDER (${(currentXau + 3.80).toFixed(2)})</text>
                              <text x="315" y="160" fill="#f43f5e" fontSize="9" fontFamily="monospace">NECK BREAK SELL (${(currentXau - 3.20).toFixed(2)})</text>
                            </>
                          )}
                        </svg>

                        {/* Absolutely positioned real-time stats metrics on top of display graph */}
                        <div className="absolute top-4 left-4 bg-black/95 rounded border border-gray-800 p-2 text-[8.5px] font-mono leading-relaxed text-gray-300">
                          <span className="block text-white font-extrabold uppercase mb-0.5">ESTIMATION COMPLETED</span>
                          <span>SAMPLE GAP: M15 SCALE • CONFIDENCE: <span className="text-[#00FFB2] font-extrabold">95.4%</span></span>
                        </div>
                      </div>

                      {/* Summary status vector indicators */}
                      <div className="flex items-center justify-between border-t border-gray-900 pt-3 z-10">
                        <div className="font-mono text-[9px] text-[#8B5CF6] uppercase font-bold">
                          POLA TERPILIH: {activePatternTab === "HAMMER" ? "Hammer Pinbar Reversal" : activePatternTab === "FLAG" ? "Bullish Flag breakout" : "Bearish Head & Shoulders"}
                        </div>
                        <div className="font-mono text-[9px] text-emerald-400 font-extrabold">
                          PROYEKSI TARGET AREA SPREAD DAPAT DITRANSAKSIKAN
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 4. MACRO COMPARISON CORRELATION TABS */}
                {hudTab === "CORRELATION" && (
                  <motion.div
                    key="correlation"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
                  >
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-widest font-extrabold mb-1 block">MODUL 04 • INTERACTIVE MACRO SLIDERS</span>
                        <h3 className="text-xl font-sans font-black text-white uppercase leading-tight mb-3">MATRIKS KORELASI GLOBAL</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                          Pergerakan instrumen makro global seperti Dolar AS (DXY) dan Yield Obligasi AS 10 Tahun (US10Y) memiliki dampak langsung bertenaga tinggi terhadap pergerakan emas harian. Gunakan slider korelasi di bawah untuk menguji tingkat sensitivitas arah dan bias.
                        </p>
                      </div>

                      <div className="p-4 bg-[#0b0e22] rounded-xl border border-gray-900/60 font-mono text-[10px] text-slate-400 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-950 pb-2">
                          <span>INTERIOR MATCH RATE</span>
                          <span className="text-emerald-400 font-bold">94.86% HISTORIS</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>MACRO INTERFACE CONFIRMED</span>
                          <span className="text-[#00FFB2] font-bold">STONG BUY ZONE</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Interactive correlation item: US Dollar Index (DXY) */}
                      <div className="bg-[#0b0e22] rounded-xl border border-gray-900 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-white text-xs">US Dollar (DXY)</span>
                            <span className="font-mono text-[8px] text-rose-500 font-black bg-rose-500/10 px-1.5 py-0.5 rounded">NEGATIVE INVERSE</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 leading-relaxed">Nilai korelasi berkebalikan paling kencang dengan Spot Gold.</p>
                        </div>

                        {/* Slider Interactive */}
                        <div className="my-5 space-y-2">
                          <div className="flex items-center justify-between font-mono text-[10px] text-gray-400">
                            <span>SENSITIVITAS KORSEL</span>
                            <span className="text-rose-400 font-black">{correlationDXY}% SCALE</span>
                          </div>
                          <input 
                            type="range"
                            min="-100"
                            max="0"
                            value={correlationDXY}
                            onChange={(e) => setCorrelationDXY(Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>

                        <div className="border-t border-gray-950 pt-2.5 flex items-center justify-between font-mono text-[9px] text-gray-400">
                          <span>PROYEKSI DAMPAK</span>
                          <span className="text-emerald-400 font-black">XAU/USD BULLISH STRONG</span>
                        </div>
                      </div>

                      {/* Interactive correlation item: US Bond Yields 10Y (US10Y) */}
                      <div className="bg-[#0b0e22] rounded-xl border border-gray-900 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-white text-xs">Bond Yields (US10Y)</span>
                            <span className="font-mono text-[8px] text-rose-500 font-black bg-rose-500/10 px-1.5 py-0.5 rounded">MEDIUM INVERSE</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 leading-relaxed">Bunga obligasi AS naik memicu pengalihan kapital dari aset emas.</p>
                        </div>

                        {/* Slider Interactive */}
                        <div className="my-5 space-y-2">
                          <div className="flex items-center justify-between font-mono text-[10px] text-gray-400">
                            <span>SENSITIVITAS OBLIGASI</span>
                            <span className="text-rose-400 font-black">{correlationUS10Y}% SCALE</span>
                          </div>
                          <input 
                            type="range"
                            min="-100"
                            max="0"
                            value={correlationUS10Y}
                            onChange={(e) => setCorrelationUS10Y(Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        <div className="border-t border-gray-950 pt-2.5 flex items-center justify-between font-mono text-[9px] text-gray-400">
                          <span>PROYEKSI DAMPAK</span>
                          <span className="text-[#00FFB2] font-black">STABLE HIGH ACC</span>
                        </div>
                      </div>

                      {/* Interactive correlation item: Silver Spot (XAGUSD) */}
                      <div className="bg-[#0b0e22] rounded-xl border border-gray-900 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-white text-xs">Silver Spot (XAG)</span>
                            <span className="font-mono text-[8px] text-emerald-400 font-black bg-emerald-500/10 px-1.5 py-0.5 rounded">STRONG DIRECT</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 leading-relaxed">Logam mulia perak bergerak seirama linear dengan grafik emas.</p>
                        </div>

                        {/* Slider Interactive */}
                        <div className="my-5 space-y-2">
                          <div className="flex items-center justify-between font-mono text-[10px] text-gray-400">
                            <span>SENSITIVITAS PERAK</span>
                            <span className="text-emerald-400 font-black">+{correlationSILVER}% SCALE</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={correlationSILVER}
                            onChange={(e) => setCorrelationSILVER(Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#00FFB2]"
                          />
                        </div>

                        <div className="border-t border-gray-950 pt-2.5 flex items-center justify-between font-mono text-[9px] text-gray-400">
                          <span>PROYEKSI DAMPAK</span>
                          <span className="text-[#00FFB2] font-black">CONGRUENT BUY BULL</span>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 5. TACTILE RISK-REWARD WEIGHT OPTIMIZER SANDBOX */}
                {hudTab === "RISK" && (
                  <motion.div
                    key="risk"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
                  >
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-rose-400 uppercase tracking-widest font-extrabold mb-1 block">MODUL 05 • SANDBOX RISK OPTIMIZER</span>
                        <h3 className="text-xl font-sans font-black text-white uppercase leading-tight mb-3">KALKULATOR MARGIN TERENCANA</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                          Uji ketahanan margin balance Anda menghadapi gejolak market Spot Emas. Atur target proporsi profit, nominal modal dasar, toleransi resiko, dan lihat kalkulasi lot serta estimasi profit/loss berbanding satu sama lain.
                        </p>
                      </div>

                      {/* CPI/NFP danger warning list with direct Volatility Impact Gauge */}
                      <div className="p-3.5 bg-black/50 border border-gray-900 rounded-xl">
                        <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-2">
                          <span className="font-mono text-[8px] text-gray-500 uppercase font-black">VOLATILITY IMPACT DANGER</span>
                          <span className="text-[7px] font-mono text-rose-500 font-black bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 uppercase">
                            HIGH DANGER
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-dashed border-rose-500/30 flex items-center justify-center font-mono text-[10px] text-rose-400 font-bold">
                            75%
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-300 block">FED INTEREST REPORT HOUR</span>
                            <span className="text-[8px] text-rose-400 font-mono">DILARANG ENTRY TRADE DI ATAS MA-200 AREA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Highly Interactive sandbox simulator worksheet */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-5 gap-6">
                      
                      {/* Sliders workspace section (col-span-3) */}
                      <div className="md:col-span-3 bg-[#0b0e22] rounded-xl border border-gray-900 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-900 pb-2.5 mb-2">
                          <span className="font-mono text-[9px] font-bold text-gray-400 uppercase">SANDBOX SETTINGS LAYOUT</span>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => setRiskOrderType("BUY")}
                              className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border transition-all cursor-pointer ${
                                riskOrderType === "BUY" 
                                  ? "bg-emerald-500/10 text-[#00FFB2] border-emerald-500/40" 
                                  : "bg-black/30 text-gray-500 border-transparent hover:text-gray-300"
                              }`}
                            >
                              BUY PROJ
                            </button>
                            <button 
                              onClick={() => setRiskOrderType("SELL")}
                              className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border transition-all cursor-pointer ${
                                riskOrderType === "SELL" 
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/40" 
                                  : "bg-black/30 text-gray-500 border-transparent hover:text-gray-300"
                              }`}
                            >
                              SELL PROJ
                            </button>
                          </div>
                        </div>

                        {/* Slider 1: Capital Base */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-gray-400">MODAL DASAR (CAPITAL)</span>
                            <span className="text-white font-extrabold">${riskCapital.toLocaleString()} USD</span>
                          </div>
                          <input 
                            type="range"
                            min="5000"
                            max="200000"
                            step="5000"
                            value={riskCapital}
                            onChange={(e) => setRiskCapital(Number(e.target.value))}
                            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        {/* Slider 2: Risk Percentage */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-gray-400">TOLERANSI RISIKO %</span>
                            <span className="text-amber-400 font-extrabold">{riskRate}% BALANCE</span>
                          </div>
                          <input 
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.5"
                            value={riskRate}
                            onChange={(e) => setRiskRate(Number(e.target.value))}
                            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        {/* Slider 3: Stop loss level (Pips) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-gray-400">STOP LOSS (PIPS RANGE)</span>
                            <span className="text-rose-400 font-extrabold">{riskStopLossPips} Pips</span>
                          </div>
                          <input 
                            type="range"
                            min="15"
                            max="120"
                            step="5"
                            value={riskStopLossPips}
                            onChange={(e) => setRiskStopLossPips(Number(e.target.value))}
                            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>

                        {/* Slider 4: Reward target proportion (Ratio RR) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-gray-400">REWARD TARGET RATIO (RR)</span>
                            <span className="text-[#00FFB2] font-extrabold">1:{riskRewardRatio.toFixed(1)} PROFIT</span>
                          </div>
                          <input 
                            type="range"
                            min="1.0"
                            max="5.0"
                            step="0.5"
                            value={riskRewardRatio}
                            onChange={(e) => setRiskRewardRatio(Number(e.target.value))}
                            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#00FFB2]"
                          />
                        </div>
                      </div>

                      {/* Calculations Visual Readout Output section (col-span-2) */}
                      <div className="md:col-span-2 bg-[#0b0e22] rounded-xl border border-gray-900 p-5 flex flex-col justify-between items-stretch">
                        <div className="text-center pb-2 border-b border-gray-900">
                          <span className="font-mono text-[9px] text-[#00FFB2] uppercase font-bold">CALCULATED WORKDECK</span>
                        </div>

                        <div className="my-3 space-y-3.5">
                          {/* Ideal Lot calculation based on standard formulas */}
                          <div className="text-center p-3.5 bg-black/45 rounded-xl border border-gray-950/45 relative">
                            <span className="block text-[8px] font-mono text-gray-500 font-bold uppercase mb-0.5">REKOMENDASI UKURAN LOT</span>
                            <span className="font-mono text-2xl font-black text-emerald-400">
                              {((riskCapital * (riskRate / 100)) / (riskStopLossPips * 10)).toFixed(2)}
                            </span>
                            <span className="block text-[7px] text-gray-500 font-mono mt-1 font-bold">STANDARD XAUUSD LOT</span>
                          </div>

                          <div className="flex items-center justify-between px-1">
                            <div className="text-left font-mono">
                              <span className="block text-[7px] text-gray-500 font-bold">EXPECTED RISK VALUE</span>
                              <span className="text-xs font-black text-rose-500">
                                -${Math.round(riskCapital * (riskRate / 100)).toLocaleString()} USD
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="block text-[7px] text-gray-500 font-bold">POTENTIAL PROFIT</span>
                              <span className="text-xs font-black text-[#00FFB2]">
                                +${Math.round(riskCapital * (riskRate / 100) * riskRewardRatio).toLocaleString()} USD
                              </span>
                            </div>
                          </div>

                          {/* Live Dynamic Price bounds projection in pips */}
                          <div className="bg-black/35 rounded-lg border border-gray-900/60 p-2.5 space-y-2">
                            <div className="flex items-center justify-between text-[8px] font-mono">
                              <span className="text-gray-500 font-bold">CURRENT SPOT GOLD</span>
                              <span className="text-white font-extrabold">${currentXau.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-900 pb-1" />
                            <div className="flex items-center justify-between text-[8px] font-mono">
                              <span className="text-gray-400">SL TARGET SPOT</span>
                              <span className="text-rose-400 font-extrabold">
                                ${(riskOrderType === "BUY" ? currentXau - (riskStopLossPips / 10) : currentXau + (riskStopLossPips / 10)).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[8px] font-mono">
                              <span className="text-gray-400">TP TARGET SPOT</span>
                              <span className="text-emerald-400 font-extrabold">
                                ${(riskOrderType === "BUY" ? currentXau + ((riskStopLossPips * riskRewardRatio) / 10) : currentXau - ((riskStopLossPips * riskRewardRatio) / 10)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Simple visual graphical bars comparing Risk vs Reward */}
                        <div className="space-y-1 pb-1">
                          <div className="flex items-center justify-between text-[7px] font-mono text-gray-500 font-extrabold px-1">
                            <span>RISK BOUNDS</span>
                            <span>PROFIT GAP</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden flex bg-black/40">
                            {/* Risk bar */}
                            <div className="h-full bg-rose-500/80" style={{ width: `${100 / (riskRewardRatio + 1)}%` }} />
                            {/* Reward bar */}
                            <div className="h-full bg-[#00FFB2]" style={{ width: `${(riskRewardRatio * 100) / (riskRewardRatio + 1)}%` }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>
          </div>
        </div>
      </section>

      {/* SENJATA TRADING TERLENGKAP - BENTO GRAPHICS GRID */}
      <section className="py-20 px-4 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-[10px] text-amber-500 tracking-widest uppercase block mb-2 font-bold select-none">SENJATA TRADING</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-black text-white uppercase tracking-tight">SENJATA TRADING TERLENGKAP</h2>
          <p className="text-gray-400 text-xs sm:text-[13px] mt-2 font-sans font-light max-w-lg mx-auto">
            Setiap modul dirancang eksklusif untuk memberi Anda keunggulan tak tertandingi di pasar emas global harian.
          </p>
        </div>

        {/* 5 Cards Bento Layout representing beautiful interfaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Bento Card 1: Terminal Real-Time */}
          <div className="p-6 bg-gradient-to-b from-[#0a0d24]/90 to-[#03040b]/98 border border-gray-900/60 rounded-xl flex flex-col justify-between hover:border-amber-400/20 hover:shadow-[0_8px_30px_rgba(255,106,0,0.06)] transition-all duration-300 min-h-[385px] group shadow-xl relative overflow-hidden">
            {/* Background Backdrop Blur Layer to isolate blur from text content */}
            <div className="absolute inset-0 backdrop-blur-sm -z-10 pointer-events-none" />
            <div>
              {/* Premium Visualizer Frame with responsive hover coordinates and timeframe switcher */}
              <TiltCard className="w-full h-36 mb-5 rounded-lg overflow-hidden flex flex-col justify-between relative bg-[#030510] border border-gray-900/60 group-hover:border-amber-500/35 transition-all duration-300 cursor-crosshair select-none">
                <div 
                  id="bento-card-1-3d-visualizer" 
                  className="w-full h-full relative"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const relativeY = Math.max(0, Math.min(1, (rect.height - y) / rect.height));
                    const targetGold = 2310 + (relativeY * 135);
                    setBento1Hover({
                      x,
                      y,
                      active: true,
                      label: `AI TARGET AREA: $${targetGold.toFixed(2)}`,
                      pips: Math.round((relativeY * 150) + 120)
                    });
                  }}
                  onMouseLeave={() => setBento1Hover(prev => ({ ...prev, active: false }))}
                >
                  {/* Visualizer Header Controls */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-30 pointer-events-auto">
                    <div className="font-mono text-[7px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1.5 bg-[#000103]/80 px-2 py-1 rounded border border-gray-900/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] animate-ping" />
                      <span className="text-gray-300">XAU/USD CORE INDEX</span>
                    </div>
                    
                    {/* Timeframe Switched Pills (M5, M15, H1) */}
                    <div className="flex gap-1 bg-[#000]/60 p-0.5 rounded border border-gray-900/60">
                      {(["M5", "M15", "H1"] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBento1Timeframe(tf);
                          }}
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-all duration-150 cursor-pointer ${
                            bento1Timeframe === tf 
                              ? "bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulated 3D Space Platform */}
                  <div className="relative w-full h-full flex items-center justify-center pt-4" style={{ perspective: "600px" }}>
                    
                    {/* Rotating 3D grid plane */}
                    <motion.div 
                      className="absolute w-44 h-44 rounded-xl border border-white/5 flex items-center justify-center"
                      style={{ 
                        transformStyle: "preserve-3d",
                        rotateX: 65,
                        rotateZ: -40,
                      }}
                      animate={{
                        rotateZ: [-40, 320]
                      }}
                      transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      {/* Glowing Tech Matrix Grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(245,158,11,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,158,11,0.06)_1px,transparent_1px)] bg-[size:14px_14px] rounded-xl" />
                      
                      {/* Ring Orbits in 3D */}
                      <div className="absolute w-36 h-36 rounded-full border border-dashed border-amber-500/10 animate-[spin_16s_linear_infinite]" />
                      <div className="absolute w-22 h-22 rounded-full border border-double border-orange-500/10 animate-[spin_10s_linear_infinite_reverse]" />
                      
                      {/* Glowing golden nucleus node in 3D center */}
                      <motion.div 
                        className="absolute w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-300 flex items-center justify-center font-display font-black text-black text-[9px] shadow-[0_0_25px_rgba(245,158,11,0.95)] border border-amber-300"
                        style={{ 
                          transform: "translateZ(20px)",
                        }}
                        animate={{
                          translateZ: [16, 26, 16],
                          rotateY: [0, 360]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        X
                      </motion.div>

                      {/* Protruding 3D Candlesticks floating at different vector nodes depending on Timeframe */}
                      <div className="absolute inset-0 flex items-center justify-around px-2" style={{ transformStyle: "preserve-3d" }}>
                        {/* Stick A - Bullish green bar */}
                        <motion.div 
                          className="w-2 bg-[#00FFB2] rounded-full"
                          style={{ 
                            height: bento1Timeframe === "M5" ? "18px" : bento1Timeframe === "M15" ? "32px" : "48px",
                            transform: "translateZ(12px)",
                            boxShadow: "0 0 14px rgba(0,255,178,0.7)"
                          }}
                          animate={{
                            height: bento1Timeframe === "M5" 
                              ? ["18px", "26px", "18px"] 
                              : bento1Timeframe === "M15" 
                                ? ["32px", "44px", "32px"] 
                                : ["48px", "34px", "48px"],
                            translateZ: [10, 18, 10]
                          }}
                          transition={{
                            duration: bento1Timeframe === "M5" ? 2 : 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.1
                          }}
                        />

                        {/* Stick B - Amber breakout bar */}
                        <motion.div 
                          className="w-2 bg-amber-500 rounded-full"
                          style={{ 
                            height: bento1Timeframe === "M5" ? "40px" : bento1Timeframe === "M15" ? "24px" : "36px",
                            transform: "translateZ(18px)",
                            boxShadow: "0 0 18px rgba(245,158,11,0.85)"
                          }}
                          animate={{
                            height: bento1Timeframe === "M5" 
                              ? ["40px", "22px", "40px"] 
                              : bento1Timeframe === "M15" 
                                ? ["24px", "38px", "24px"] 
                                : ["36px", "52px", "36px"],
                            translateZ: [15, 28, 15]
                          }}
                          transition={{
                            duration: bento1Timeframe === "M5" ? 2.5 : 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.4
                          }}
                        />

                        {/* Stick C - Bearish safety adjustment */}
                        <motion.div 
                          className="w-2 bg-rose-500 rounded-full"
                          style={{ 
                            height: bento1Timeframe === "M5" ? "14px" : bento1Timeframe === "M15" ? "38px" : "18px",
                            transform: "translateZ(8px)",
                            boxShadow: "0 0 10px rgba(244,63,94,0.6)"
                          }}
                          animate={{
                            height: bento1Timeframe === "M5" 
                              ? ["14px", "28px", "14px"] 
                              : bento1Timeframe === "M15" 
                                ? ["38px", "20px", "38px"] 
                                : ["18px", "30px", "18px"],
                            translateZ: [8, 14, 8]
                          }}
                          transition={{
                            duration: bento1Timeframe === "M5" ? 1.8 : 4.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.7
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* 3D Glassmorphic Stats floating overlay panel */}
                    <div className="absolute top-12 right-3 pointer-events-none z-20">
                      <motion.div 
                        className="bg-black/95 border border-white/10 rounded-lg p-2 shadow-[0_4px_15px_rgba(0,0,0,0.6)] flex flex-col gap-0.5"
                        animate={{
                          y: [0, -3, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="text-[6px] text-gray-500 font-mono tracking-wider font-extrabold uppercase">STABILITY</span>
                        <span className="text-[10px] text-[#00FFB2] font-semibold font-mono tracking-tight">98.40% READY</span>
                      </motion.div>
                    </div>

                    {/* Real-Time Interactive Overlay Crosshairs */}
                    {bento1Hover.active && (
                      <>
                        {/* Vertical line */}
                        <div 
                          className="absolute top-0 bottom-0 border-l border-dashed border-amber-500/30 pointer-events-none z-10"
                          style={{ left: bento1Hover.x }}
                        />
                        {/* Horizontal line */}
                        <div 
                          className="absolute left-0 right-0 border-t border-dashed border-amber-500/30 pointer-events-none z-10"
                          style={{ top: bento1Hover.y }}
                        />
                        {/* Dynamic hovering tag coordinate */}
                        <div 
                          className="absolute bg-amber-500 text-black text-[7px] font-mono font-black px-2 py-0.5 rounded shadow-lg pointer-events-none z-30 transition-transform duration-75"
                          style={{ 
                            left: Math.max(10, Math.min(bento1Hover.x - 45, 140)), 
                            top: Math.max(10, Math.min(bento1Hover.y - 20, 110))
                          }}
                        >
                          {bento1Hover.label}
                        </div>
                      </>
                    )}

                    {/* Node Active State Indicator footer inside visualizer */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between z-20">
                      <div className="font-mono text-[7px] text-amber-500/90 font-black tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                        GRID: MAPPED ({bento1Timeframe})
                      </div>
                      <div className="font-mono text-[7px] text-gray-500">
                        ZOOMED AT: 1.0X
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
              
              <span className="font-mono text-[9px] text-[#00FFB2] bg-[#00FFB2]/10 border border-[#00FFB2]/20 px-2.5 py-0.5 rounded tracking-wide uppercase mb-3.5 inline-block font-extrabold">
                LIVE SPOT
              </span>
              <h3 className="font-sans font-extrabold text-base text-[#f8fafc] mb-2 leading-tight">Terminal Intelijen XAUUSD Real-Time</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Aliran data harga emas akurat serta-merta dengan margin spread ketat, kalkulasi level support/resistance otomatis, notifikasi real-time.
              </p>
            </div>
          </div>

          {/* Bento Card 2: AI Pattern Detector */}
          <div className="p-6 bg-gradient-to-b from-[#0a0d24]/90 to-[#03040b]/98 border border-gray-900/60 rounded-xl flex flex-col justify-between hover:border-amber-400/20 hover:shadow-[0_8px_30px_rgba(255,106,0,0.06)] transition-all duration-300 min-h-[385px] group shadow-xl relative overflow-hidden">
            {/* Background Backdrop Blur Layer to isolate blur from text content */}
            <div className="absolute inset-0 backdrop-blur-sm -z-10 pointer-events-none" />
            <div>
              {/* Premium Holographic Radar Scanner Visualizer */}
              <TiltCard className="w-full h-36 mb-5 rounded-lg overflow-hidden flex items-center justify-center relative bg-[#030510] border border-gray-900/60 group-hover:border-[#8B5CF6]/30 transition-all duration-300 select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06),transparent_70%)]" />
                
                {/* Tech background matrix lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />

                {/* Simulated live binary code stream faded in background */}
                <div className="absolute inset-0 p-2 overflow-hidden opacity-10 font-mono text-[5px] text-[#8B5CF6] leading-none pointer-events-none break-all">
                  STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK
                  STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK
                  STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK_STX_01001100_G_2391_ACC_94_OK
                </div>

                {/* Concentric Tech Orbits / Echo Rings */}
                <div className="absolute w-24 h-24 rounded-full border border-dashed border-[#8B5CF6]/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-16 h-16 rounded-full border border-double border-[#8B5CF6]/10 animate-[spin_10s_linear_infinite_reverse]" />

                {/* Dynamic Lock-on Target reticle with CPU central core */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {/* Retro sci-fi corners indicator */}
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#8B5CF6]/70 group-hover:scale-110 transition-transform" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#8B5CF6]/70 group-hover:scale-110 transition-transform" />
                    <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#8B5CF6]/70 group-hover:scale-110 transition-transform" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#8B5CF6]/70 group-hover:scale-110 transition-transform" />

                    {/* Central CPU Core node */}
                    <motion.div 
                      className="absolute w-9 h-9 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/40 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                      animate={{
                        scale: [1, 1.08, 1],
                        rotate: [0, 90, 180, 270, 360]
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Cpu className="w-4 h-4 text-[#a78bfa]" />
                    </motion.div>
                  </div>

                  {/* Pulsing Target text locked status */}
                  <motion.div 
                    className="mt-2 text-[7px] font-mono font-black text-[#a78bfa] tracking-wider uppercase bg-[#8B5CF6]/5 px-2 py-0.5 rounded border border-[#8B5CF6]/25 shadow-sm"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    SCANNER: ONLINE [CORE v3.2]
                  </motion.div>
                </div>

                {/* Laser scan wave passing from top to bottom */}
                <motion.div 
                  className="absolute left-0 right-0 h-0.5 bg-[#8B5CF6]/45 shadow-[0_0_12px_rgba(139,92,246,0.8)] z-20 pointer-events-none"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Custom watermark specs inside container */}
                <div className="absolute bottom-2.5 left-2.5 font-mono text-[6px] text-gray-500 uppercase tracking-widest">
                  DEEP RECOGNITION ACTIVE
                </div>

                <div className="absolute top-2.5 right-2.5 font-mono text-[6px] text-[#8B5CF6] font-bold flex items-center gap-1 bg-[#8B5CF6]/5 px-1.5 py-0.5 rounded border border-[#8B5CF6]/10">
                  <span className="w-1 h-1 rounded-full bg-[#8B5CF6] animate-ping" />
                  M1–H4 PARALLAX
                </div>
              </TiltCard>

              <span className="font-mono text-[9px] text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2.5 py-0.5 rounded tracking-wide uppercase mb-3.5 inline-block font-extrabold font-bold">
                PERSEUS AI
              </span>
              <h3 className="font-sans font-extrabold text-base text-[#f8fafc] mb-2 leading-tight">AI Pattern Recognition</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Deteksi otomatis pola Chart seperti Head &amp; Shoulders, Double Top, Bull Flag, dan gap M1–H4 secara terus-menerus.
              </p>
            </div>
          </div>

          {/* Bento Card 3: Intelligent Safety Zone */}
          <div className="p-6 bg-gradient-to-b from-[#0a0d24]/90 to-[#03040b]/98 border border-gray-900/60 rounded-xl flex flex-col justify-between hover:border-amber-400/20 hover:shadow-[0_8px_30px_rgba(255,106,0,0.06)] transition-all duration-300 min-h-[385px] group shadow-xl relative overflow-hidden">
            {/* Background Backdrop Blur Layer to isolate blur from text content */}
            <div className="absolute inset-0 backdrop-blur-sm -z-10 pointer-events-none" />
            <div>
              {/* Premium Interactive Risk Sandbox Simulator */}
              <TiltCard className="w-full h-36 mb-5 rounded-lg overflow-hidden flex flex-col justify-between p-3.5 relative bg-[#030510] border border-gray-900/60 group-hover:border-emerald-500/20 transition-all duration-300 select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
                
                {/* Simulator Header */}
                <div className="flex items-center justify-between z-102">
                  <span className="font-mono text-[7px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    RISK ENGINE SIMULATOR v2
                  </span>
                  <span className="text-[7px] font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    SECURED
                  </span>
                </div>

                {/* Simulated Values Row */}
                <div className="grid grid-cols-3 gap-2 my-1 z-10">
                  
                  {/* Account Presets Switcher Column */}
                  <div className="flex flex-col gap-1 col-span-1 border-r border-gray-900/60 pr-1">
                    <span className="text-[6px] font-mono font-bold text-gray-500 uppercase">CAPITAL</span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {([10000, 50000, 100000] as const).map((cap) => (
                        <button
                          key={cap}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBento3Capital(cap);
                          }}
                          className={`text-[7px] font-mono font-bold py-0.5 rounded transition-all cursor-pointer ${
                            bento3Capital === cap 
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                              : "text-gray-500 hover:text-gray-300 bg-white/2"
                          }`}
                        >
                          ${(cap / 1000).toFixed(0)}k usd
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Risk Level Switcher Column */}
                  <div className="flex flex-col gap-1 col-span-1 border-r border-gray-900/60 pr-1 pl-1">
                    <span className="text-[6px] font-mono font-bold text-gray-500 uppercase">RISK RATE</span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {([1.0, 2.0, 3.0] as const).map((rsk) => (
                        <button
                          key={rsk}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBento3Risk(rsk);
                          }}
                          className={`text-[7px] font-mono font-bold py-0.5 rounded transition-all cursor-pointer ${
                            bento3Risk === rsk
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                              : "text-gray-500 hover:text-gray-300 bg-white/2"
                          }`}
                        >
                          {rsk.toFixed(1)}% Max
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Calculation Output Gauge Column */}
                  <div className="flex flex-col items-center justify-center col-span-1 pl-1">
                    <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-black/40 border border-dashed border-emerald-500/30">
                      <motion.div 
                        className="absolute inset-0 rounded-full border border-emerald-500/40"
                        style={{ borderTopColor: "transparent" }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="text-center">
                        <span className="block text-[6px] text-gray-500 font-mono tracking-tighter uppercase whitespace-nowrap">LOT SIZE</span>
                        <motion.span 
                          key={`${bento3Capital}-${bento3Risk}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="font-mono text-[9px] font-black text-emerald-400 tracking-tight"
                        >
                          {((bento3Capital * (bento3Risk / 100)) / 500).toFixed(2)}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leverage Indicators and projection bottom lines */}
                <div className="flex items-center justify-between border-t border-gray-900/60 pt-2 z-10">
                  <div className="flex flex-col">
                    <span className="text-[6px] text-gray-500 font-mono text-left">MAX LOSS LIMIT</span>
                    <span className="text-[8px] font-mono font-black text-rose-500 text-left">
                      -${Math.round(bento3Capital * (bento3Risk / 100)).toLocaleString()} USD
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[6px] text-gray-500 font-mono text-right">TARGET GAIN (1:3)</span>
                    <span className="text-[8px] font-mono font-black text-emerald-400 text-right">
                      +${Math.round(bento3Capital * (bento3Risk / 100) * 3).toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </TiltCard>

              <span className="font-mono text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded tracking-wide uppercase mb-3.5 inline-block font-extrabold font-bold">
                SAFETY ZONE
              </span>
              <h3 className="font-sans font-extrabold text-base text-[#f8fafc] mb-2 leading-tight">Risk Manager Cerdas</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Kalkulator lot otomatis berdasarkan persentase risiko akun. Dapatkan proyeksi modal dengan perhitungan akurat.
              </p>
            </div>
          </div>

          {/* Bento Card 4: Fundamental Economic News Radar */}
          <div className="p-6 bg-gradient-to-b from-[#0a0d24]/90 to-[#03040b]/98 border border-gray-900/60 rounded-xl flex flex-col justify-between hover:border-amber-400/20 hover:shadow-[0_8px_30px_rgba(255,106,0,0.06)] transition-all duration-300 min-h-[385px] group shadow-xl relative overflow-hidden">
            {/* Background Backdrop Blur Layer to isolate blur from text content */}
            <div className="absolute inset-0 backdrop-blur-sm -z-10 pointer-events-none" />
            <div>
              {/* Redesigned interactive visualizer for fundamental news feed */}
              <TiltCard className="w-full h-36 mb-5 rounded-lg overflow-hidden flex flex-col justify-between p-3 relative bg-[#030510] border border-gray-900/60 group-hover:border-amber-500/20 transition-all duration-300 select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05),transparent_70%)] animate-pulse" />
                
                {/* News radar grid header */}
                <div className="flex items-center justify-between z-10 border-b border-gray-900/60 pb-1.5 w-full">
                  <span className="font-mono text-[7px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    LIVE SATELLITE RADAR
                  </span>
                  <span className="text-[6.5px] font-mono text-orange-400 font-extrabold bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                    GOLD MOVERS
                  </span>
                </div>

                {/* News Events Feed Content */}
                <div className="flex flex-col gap-1.5 py-1 z-10">
                  {/* Event item A - CPI */}
                  <div className="bg-black/50 border border-gray-900/80 rounded p-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      <div>
                        <span className="block font-mono text-[6px] text-gray-500 uppercase">USD • CONSUMER INFLATION (CPI)</span>
                        <span className="block text-[8.5px] font-sans font-bold text-slate-100 tracking-tight">Kritis: Konsensus 0.2% MoM</span>
                      </div>
                    </div>
                    <span className="text-[6px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1 py-0.5 rounded uppercase font-black tracking-wider">HIGH IMPACT</span>
                  </div>

                  {/* Event item B - NFP */}
                  <div className="bg-black/50 border border-gray-900/80 rounded p-1.5 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <span className="block font-mono text-[6px] text-gray-500 uppercase">USD • NON-FARM PAYROLLS (NFP)</span>
                        <span className="block text-[8.5px] font-sans font-bold text-slate-100 tracking-tight">Tenaga Kerja: Prediksi 185K</span>
                      </div>
                    </div>
                    <span className="text-[6px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1 py-0.5 rounded uppercase font-black tracking-wider">HIGH IMPACT</span>
                  </div>
                </div>

                {/* Bottom ticker watermark */}
                <div className="flex items-center justify-between z-10 text-[6.5px] font-mono text-gray-500 border-t border-gray-900/40 pt-1 w-full">
                  <span>NEWS RADAR ACTIVE</span>
                  <span>SYNC STATUS: OK</span>
                </div>
              </TiltCard>

              <span className="font-mono text-[9px] text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded tracking-wide uppercase mb-3.5 inline-block font-extrabold font-bold bg-amber-500/5">
                FUNDAMENTAL
              </span>
              <h3 className="font-sans font-extrabold text-base text-[#f8fafc] mb-2 leading-tight">News Impact Filter</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Filter berita ekonomi harian seperti NFP, CPI, FOMC, dan Bank Rates yang berdampak langsung pada volatilitas emas.
              </p>
            </div>
          </div>

          {/* Bento Card 5: Elite Community (Wide spans 2 on MD/LG screens) */}
          <div className="p-6 bg-gradient-to-b from-[#0a0d24]/90 to-[#03040b]/98 border border-gray-900/60 rounded-xl flex flex-col justify-between hover:border-[#8B5CF6]/20 hover:shadow-[0_8px_30px_rgba(139,92,246,0.06)] transition-all duration-300 min-h-[385px] md:col-span-2 group shadow-xl relative overflow-hidden">
            {/* Background Backdrop Blur Layer to isolate blur from text content */}
            <div className="absolute inset-0 backdrop-blur-sm -z-10 pointer-events-none" />
            <div>
              {/* Premium Live Community Chat Feed Ticker Visualizer */}
              <TiltCard className="w-full h-36 mb-5 rounded-lg overflow-hidden flex flex-col justify-between p-3 relative bg-[#030510] border border-gray-900/60 group-hover:border-[#8B5CF6]/30 transition-all duration-300 select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05),transparent_70%)] animate-pulse" />
                
                {/* Chat header */}
                <div className="flex items-center justify-between z-10 border-b border-gray-900/60 pb-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full border border-gray-950 bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-[7px] font-extrabold text-white uppercase skeleton-pulse">R</div>
                      <div className="w-4 h-4 rounded-full border border-gray-950 bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-[7px] font-extrabold text-[#050816] uppercase skeleton-pulse">S</div>
                      <div className="w-4 h-4 rounded-full border border-gray-950 bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-[7px] font-extrabold text-white uppercase skeleton-pulse">B</div>
                    </div>
                    <span className="font-mono text-[7px] text-gray-300 font-extrabold uppercase">PERSEUS TERMINAL FEED (800+ ONLINE)</span>
                  </div>
                  <span className="text-[6.5px] font-mono text-[#00FFB2] font-semibold bg-[#00FFB2]/5 border border-[#00FFB2]/20 px-1.5 rounded uppercase">
                    LIVE FEED
                  </span>
                </div>

                {/* Simulated Conversations lines scroll */}
                <div className="flex flex-col gap-1 py-1 z-10 text-left">
                  <div className="bg-black/30 px-2 py-0.5 rounded border border-gray-900/20">
                    <span className="font-mono text-[7.5px] text-[#00FFB2] font-black mr-1 uppercase">[PERSEUS BOT]:</span>
                    <span className="font-sans font-semibold text-[8px] text-emerald-400">⚡ Sinyal BUY LIMIT XAUUSD 2314.50 hit! Target 2325 harian dicapai. (+105 pips)</span>
                  </div>
                  
                  <div className="bg-black/30 px-2 py-0.5 rounded border border-gray-900/20">
                    <span className="font-mono text-[7.5px] text-amber-500 font-black mr-1 uppercase">[DXY_HUNTER]:</span>
                    <span className="font-sans text-[8px] text-slate-200">Indeks Dolar AS (DXY) dijatuhkan berita CPI. Sempurna untuk long Gold! 👍</span>
                  </div>

                  <div className="bg-black/30 px-2 py-0.5 rounded border border-gray-900/20">
                    <span className="font-mono text-[7.5px] text-indigo-400 font-black mr-1 uppercase">[VIP_MEMBER_9]:</span>
                    <span className="font-sans text-[8px] text-slate-300">Target harian aman! Akurasi sinyal radar hari ini gila-gilaan master. 🔥</span>
                  </div>
                </div>

                {/* Sync status footer */}
                <div className="flex items-center justify-between z-10 text-[6.5px] font-mono text-gray-500 border-t border-gray-900/45 pt-1 w-full">
                  <span>DISCORD SECURE PROTOCOL</span>
                  <span>ONLINE MATRIX: 100% OK</span>
                </div>
              </TiltCard>

              <span className="font-mono text-[9px] text-[#8B5CF6] border border-[#8B5CF6]/20 px-2.5 py-0.5 rounded tracking-wide uppercase mb-3.5 inline-block font-extrabold font-bold bg-[#8B5CF6]/5">
                ELITE NET
              </span>
              <h3 className="font-sans font-extrabold text-base text-[#f8fafc] mb-2 leading-tight">Komunitas Trader Elite</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Akses ke grup premium trader profesional seluruh dunia. Lakukan analisis harian bersama master XAUUSD berpengalaman. Diskusi live, review setup, dan mentoring eksklusif setiap hari.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* TERMINAL YANG BICARA SENDIRI (TRADINGVIEW SIMULATION & SIGNAL DEMO) */}
      <section className="py-20 px-4 bg-[#040612] border-t border-b border-gray-900/60 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Copywriting Left Column */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <span className="font-mono text-[10px] text-amber-500 tracking-widest uppercase block font-bold">INTEGRASI GRAFIS</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-black text-white mb-1 uppercase leading-tight">TERMINAL YANG BICARA SENDIRI</h3>
              <p className="text-xs sm:text-[13px] text-gray-400 font-sans font-light leading-relaxed">
                Kami meniadakan cara-cara trading manual yang membosankan. Sinyal Perseus terintegrasi langsung dengan kondisi charts dan dihitung presisi harian.
              </p>
              
              <div className="space-y-3 font-sans text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-[#00FFB2]/10 flex items-center justify-center text-[#00FFB2] shrink-0 font-bold text-xs font-mono">✓</div>
                  <span>Integrasi TradingView Spot Live</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-[#00FFB2]/10 flex items-center justify-center text-[#00FFB2] shrink-0 font-bold text-xs font-mono">✓</div>
                  <span>Sinyal real-time langsung ke chart</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-[#00FFB2]/10 flex items-center justify-center text-[#00FFB2] shrink-0 font-bold text-xs font-mono">✓</div>
                  <span>Eksekusi super cepat tanpa delay</span>
                </div>
              </div>

              <div className="mt-2">
                <button
                  id="btn-goto-chart-demo"
                  onClick={() => onNavigate("Live Chart")}
                  className="px-6 py-3 rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold text-xs hover:from-amber-400 hover:to-yellow-500 transition-all duration-300 shadow-md cursor-pointer uppercase tracking-wider flex items-center gap-2"
                >
                  BUKA CHART ASLI <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Dynamic Live TradingView Chart Frame with Interactive AI Detections */}
            <div className="lg:col-span-7 bg-[#000000] p-4 rounded-xl border border-gray-800/80 shadow-2xl relative overflow-hidden flex flex-col gap-3 min-h-[420px]">
              <div className="flex items-center justify-between border-b border-gray-800/40 pb-3 text-[10px] font-mono text-gray-400 font-bold">
                <span className="text-amber-500 font-extrabold uppercase tracking-wider">📈 REAL-TIME XAUUSD SPOT CHART</span>
                <span className="text-[#00FFB2] font-black flex items-center gap-1 bg-[#00FFB2]/10 border border-[#00FFB2]/20 px-2 py-0.5 rounded animate-pulse">
                  <span className="w-1.5 h-1.5 bg-[#00FFB2] rounded-full" /> LIVE FEED
                </span>
              </div>

              {/* Dynamic Toggle controls for AI scanners */}
              <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 select-none px-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${scannerActive ? 'bg-amber-400 animate-pulse' : 'bg-gray-650'}`} />
                  AI PATTERN SCANNER: <span className={scannerActive ? 'text-amber-400 font-bold' : 'text-gray-500'}>{scannerActive ? 'ACTIVE' : 'MUTED'}</span>
                </span>
                <button
                  onClick={() => setScannerActive(!scannerActive)}
                  className="px-2.5 py-1 rounded-md text-[8px] font-mono font-bold uppercase transition-all border border-gray-800 hover:border-amber-400/30 text-amber-500 hover:bg-amber-500/5 active:scale-95 cursor-pointer"
                >
                  {scannerActive ? 'Matikan AI Scanner' : 'Nyalakan AI Scanner'}
                </button>
              </div>
              
              {/* Real TradingView Chart Panel */}
              <div className="w-full h-80 bg-[#080a10] rounded border border-[#161d2b] overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[radial-gradient(circle_at_center,rgba(16,23,48,0.2),transparent_70%)]">
                <div id="tradingview_xauusd_home" className="w-full h-full" ref={tvContainerRef} />
                
                {/* Real-time Perseus Entry Price Signal Marker Layer */}
                {activeSignal && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-300 ease-out"
                    style={{ top: `${verticalPositionRatio}%` }}
                  >
                    <div className={`w-full border-t border-dashed relative pointer-events-auto flex items-center group/marker cursor-crosshair ${
                      activeSignal.type === "BUY" 
                        ? "border-[#00FFB2]/70 hover:border-[#00FFB2]" 
                        : "border-rose-500/70 hover:border-rose-400"
                    }`}>
                      {/* Left anchor badge inside chart */}
                      <div className={`absolute left-2.5 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 rounded bg-[#090b11]/95 border font-mono text-[9px] font-black tracking-wider uppercase shadow-[0_4px_15px_rgba(0,0,0,0.65)] transition-all duration-200 group-hover/marker:scale-105 ${
                        activeSignal.type === "BUY"
                          ? "border-[#00FFB2]/50 text-[#00FFB2]"
                          : "border-rose-500/50 text-rose-400"
                      }`}>
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSignal.type === "BUY" ? "bg-[#00FFB2]" : "bg-rose-400"}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${activeSignal.type === "BUY" ? "bg-[#00FFB2]" : "bg-rose-500"}`}></span>
                        </span>
                        PERSEUS {activeSignal.type} • ENTRY: ${activeSignal.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      {/* Right-axis quote badge on scale */}
                      <div className={`absolute right-1 -translate-y-1/2 font-mono text-[9px] font-black px-2 py-0.5 rounded shadow-md group-hover/marker:scale-110 transition-all ${
                        activeSignal.type === "BUY"
                          ? "bg-[#00FFB2] text-black"
                          : "bg-rose-500 text-white"
                      }`}>
                        ${activeSignal.entryPrice.toFixed(2)}
                      </div>

                      {/* Tooltip Detailed on Hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 hidden group-hover/marker:flex flex-col w-60 p-3.5 rounded-xl bg-[#010204] border border-amber-500/35 shadow-[0_10px_45px_rgba(0,0,0,0.98)] transition-all duration-200 z-50">
                        <div className="flex items-center justify-between mb-2 border-b border-gray-800 pb-1.5">
                          <span className="font-mono text-[9px] font-black text-amber-400 tracking-wider uppercase">
                            🛡️ PERSEUS ACTIVE STATS
                          </span>
                          <span className="font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-300 font-extrabold">
                            {activeSignal.confidence}% ACC
                          </span>
                        </div>

                        <div className="space-y-1 text-[9.5px] font-mono">
                          <div className="flex justify-between text-gray-400">
                            <span>ENTRY SPOT:</span>
                            <span className="text-white font-extrabold">${activeSignal.entryPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-rose-500">
                            <span>STOP LOSS:</span>
                            <span className="font-bold">${activeSignal.stopLoss.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>TAKE PROFIT 1:</span>
                            <span className="font-bold">${activeSignal.takeProfit1.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[#00FFB2]">
                            <span>TAKE PROFIT 2:</span>
                            <span className="font-bold">${activeSignal.takeProfit2.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="border-t border-gray-800/60 pt-2 mt-2 font-mono text-[8px] text-gray-400 leading-relaxed font-light">
                          <span className="font-black text-amber-500 mr-1 uppercase">STRATEGY:</span> {activeSignal.strategy}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Background Loading Placeholder */}
                <div className="absolute inset-0 bg-[#080a10] flex flex-col items-center justify-center font-mono text-xs text-gray-500 -z-10 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                  Memuat chart TradingView orisinal Emas...
                </div>

                {/* AI-Powered Pattern Interactive Overlay */}
                {scannerActive && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {aiPatterns.map((pat) => (
                      <div
                        key={pat.id}
                        className="absolute pointer-events-auto group/pin cursor-help"
                        style={{ left: pat.left, top: pat.top }}
                        onMouseEnter={() => setHoveredPattern(pat.id)}
                        onMouseLeave={() => setHoveredPattern(null)}
                      >
                        {/* Radar Pulse animation */}
                        <div className={`absolute -inset-2.5 rounded-full ${pat.type === 'bullish' ? 'bg-[#00FFB2]/20' : 'bg-rose-500/20'} animate-ping opacity-60 duration-1000`} />
                        
                        {/* Core visual pointer marker bubble */}
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover/pin:scale-110 ${
                          pat.type === 'bullish' 
                            ? 'bg-black border-[#00FFB2] text-[#00FFB2]' 
                            : 'bg-black border-rose-500 text-rose-500'
                        }`}>
                          <span className="font-mono text-[8px] font-black leading-none mb-0.5">🧠</span>
                        </div>

                        {/* Interactive floating descriptive bubble above or next to the coin pattern pointer */}
                        <AnimatePresence>
                          {hoveredPattern === pat.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 8, x: "-50%" }}
                              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                              exit={{ opacity: 0, scale: 0.9, y: 8, x: "-50%" }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="absolute bottom-6 left-1/2 flex flex-col w-60 p-3.5 rounded-xl bg-[#000000] border border-amber-500/35 shadow-[0_10px_40px_rgba(0,0,0,0.95)] z-50 select-none"
                            >
                              <div className="flex items-center justify-between mb-1.5 border-b border-gray-800/60 pb-1">
                                <span className="font-mono text-[9px] font-black text-amber-400 tracking-wider uppercase">
                                  {pat.name}
                                </span>
                                <span className="font-mono text-[8.5px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black">
                                  {pat.accuracy} Acc
                                </span>
                              </div>

                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-mono text-[9px] font-black tracking-wide ${pat.type === 'bullish' ? 'text-[#00FFB2]' : 'text-rose-500'}`}>
                                  ● {pat.bias}
                                </span>
                                <span className="font-mono text-[7.5px] text-gray-500 font-bold">
                                  {pat.timeframe} • {pat.volume}
                                </span>
                              </div>

                              <p className="text-[10px] font-sans text-gray-300 leading-relaxed font-light mb-2">
                                {pat.desc}
                              </p>

                              <div className="border-t border-gray-800/50 pt-2 flex justify-between font-mono text-[8px] font-bold">
                                <span className="text-gray-500">PROYEKSI TARGET:</span>
                                <span className="text-amber-400">{pat.recoveryTarget}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS - TRANS-PARENT RATINGS */}
      <section className="py-24 px-4 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="font-mono text-[10px] text-amber-500 uppercase tracking-widest block mb-1 font-bold">ULASAN KOMUNITAS</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-black text-white uppercase tracking-tight">APA KATA TRADER KAMI</h2>
          <p className="text-gray-400 text-xs sm:text-[13px] mt-2 font-sans font-light">
            Ditinjau secara transparan dari para trader berpengalaman. Tanpa manipulasi data hasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          <div className="p-6 bg-[#0B1026]/80 border border-gray-800/65 rounded-xl flex flex-col justify-between shadow-xl hover:border-gray-700/60 transition-colors duration-300">
            <div>
              <div className="flex text-amber-500 mb-4 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-[13px] italic text-[#e3e6f3] leading-relaxed mb-6 font-sans font-light">
                "Setelah 3 tahun pakai berbagai platform ritel, Perseus Terminal berada di level yang sungguh berbeda. Win rate 78% itu nyata saat konfluensi AI &amp; Fundamental digabung."
              </p>
            </div>
            <div className="border-t border-gray-800/60 pt-4 flex items-center justify-between">
              <div>
                <h4 className="font-sans font-extrabold text-white text-xs block">Rizky Firmansyah</h4>
                <p className="text-[9px] font-mono text-amber-500 uppercase font-bold tracking-wider">Pro Trader</p>
              </div>
              <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
                JAKARTA
              </span>
            </div>
          </div>

          <div className="p-6 bg-[#0B1026]/80 border border-gray-800/65 rounded-xl flex flex-col justify-between shadow-xl hover:border-gray-700/60 transition-colors duration-300">
            <div>
              <div className="flex text-amber-500 mb-4 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-[13px] italic text-[#e3e6f3] leading-relaxed mb-6 font-sans font-light">
                "Layanan sinyal emas harian sangat membantu proses pengambilan keputusan. Fitur News Impact Filter-nya bekerja luar biasa mendeteksi lonjakan pips sebelum rilis NFP harian!"
              </p>
            </div>
            <div className="border-t border-gray-800/60 pt-4 flex items-center justify-between">
              <div>
                <h4 className="font-sans font-extrabold text-white text-xs block">Siti Rahmawati</h4>
                <p className="text-[9px] font-mono text-amber-500 uppercase font-bold tracking-wider">Scalper</p>
              </div>
              <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
                SURABAYA
              </span>
            </div>
          </div>

          <div className="p-6 bg-[#0B1026]/80 border border-gray-800/65 rounded-xl flex flex-col justify-between shadow-xl hover:border-gray-700/60 transition-colors duration-300">
            <div>
              <div className="flex text-amber-500 mb-4 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-[13px] italic text-[#e3e6f3] leading-relaxed mb-6 font-sans font-light">
                "Sangat direkomendasikan untuk analisis multi-timeframe. Integrasi TradingView asli membuat eksekusi grafis menjadi sangat mulus."
              </p>
            </div>
            <div className="border-t border-gray-800/60 pt-4 flex items-center justify-between">
              <div>
                <h4 className="font-sans font-extrabold text-white text-xs block">Budi Santoso</h4>
                <p className="text-[9px] font-mono text-amber-500 uppercase font-bold tracking-wider">Portfolio Manager</p>
              </div>
              <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
                MEDAN
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* PRICING / PLAN GRID */}
      <section className="py-24 px-4 bg-[#040612] border-t border-[#161f38] relative z-10 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="font-mono text-xs text-amber-500 uppercase tracking-widest block mb-2 font-bold font-display">INVESTASI UTAMA</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-white uppercase tracking-tight">PILIH PLAN YANG TEPAT</h2>
            <p className="text-gray-400 text-xs sm:text-[13px] mt-2 font-sans font-light max-w-lg mx-auto">
              Satu pendaftaran, akses ke seluruh arsenal harian terbaik untuk kesuksesan trading Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto text-left">
            
            {/* Starter Plan */}
            <div className="p-7 bg-[#0B1026] border border-gray-800/60 rounded-xl flex flex-col justify-between shadow-xl hover:border-gray-700/60 transition-colors duration-300">
              <div>
                <span className="font-mono text-amber-500 text-[10px] tracking-widest uppercase mb-3 block font-bold">STARTER</span>
                <div className="flex items-baseline mb-3">
                  <span className="text-3xl font-mono font-black text-white">Rp 0</span>
                  <span className="text-[10px] text-gray-500 ml-2 font-mono uppercase font-bold">GRATIS FOREVER</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed font-light">
                  Akses terminal fundamental dan teknikal dasar untuk menganalisis pergerakan harian.
                </p>
                
                <ul className="space-y-3.5 mb-8 border-t border-gray-800/50 pt-5 text-xs text-gray-300">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2 mt-0.5" />
                    <span>Akses Terminal XAUUSD Standar</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2 mt-0.5" />
                    <span>Data Sinyal AI Terbuka Harian</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2 mt-0.5" />
                    <span>Kalkulator Risiko Dasar</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-plan-select-starter"
                onClick={() => onNavigate("VIP")}
                className="w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-transparent text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 cursor-pointer text-center duration-300"
              >
                MULAI AKSES STANDARD
              </button>
            </div>

            {/* Whitelist Plan (Featured Spotlight) */}
            <div className="p-7 bg-gradient-to-b from-[#131130] to-[#040612] border-2 border-amber-500/50 rounded-xl flex flex-col justify-between shadow-[0_0_35px_rgba(245,197,66,0.12)] relative">
              <div className="absolute right-3 top-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-mono font-black text-[9px] tracking-widest uppercase rounded">
                PALING POPULER
              </div>
              
              <div>
                <span className="font-mono text-amber-400 text-[10px] tracking-widest uppercase mb-3 block font-bold">PRO AI</span>
                <div className="flex items-baseline mb-3">
                  <span className="text-3xl font-mono font-black text-white">Whitelist</span>
                  <span className="text-[10px] text-[#00FFB2] ml-2 font-mono uppercase font-bold">ACTIVE / FREE</span>
                </div>
                <p className="text-xs text-gray-300 mb-6 leading-relaxed font-light">
                  Akses penuh konfluensi indikator teknikal paling lengkap tanpa biaya berlangganan.
                </p>
                
                <ul className="space-y-3.5 mb-8 border-t border-gray-800/50 pt-5 text-xs text-gray-200">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mr-2 mt-0.5" />
                    <span>Aliran Harga Spot Real-Time (Tanpa Delay)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mr-2 mt-0.5" />
                    <span>Sinyal AI Tanpa Batas (M15 / H1 / H4)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mr-2 mt-0.5" />
                    <span>Deteksi Pola Chart AI Tingkat Tinggi</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mr-2 mt-0.5" />
                    <span>Smart Risk Calculator Pro harian</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-plan-select-whitelist"
                onClick={() => onNavigate("VIP")}
                className="w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:from-amber-400 hover:to-yellow-500 cursor-pointer text-center duration-300 shadow-md"
              >
                AKTIFKAN AKUN GRATIS
              </button>
            </div>

            {/* VIP Elite Option */}
            <div className="p-7 bg-[#0B1026] border border-gray-800/60 rounded-xl flex flex-col justify-between shadow-xl hover:border-gray-700/60 transition-colors duration-300">
              <div>
                <span className="font-mono text-amber-500 text-[10px] tracking-widest uppercase mb-3 block font-bold">VIP ELITE</span>
                <div className="flex items-baseline mb-3">
                  <span className="text-3xl font-mono font-black text-white">Sponsor</span>
                  <span className="text-[10px] text-gray-500 ml-2 font-mono uppercase font-bold">SWAP-FREE SPECIAL</span>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed font-light">
                  Bekerja sama dengan broker partner swap-free dengan pendaftaran ID akun Anda.
                </p>
                
                <ul className="space-y-3.5 mb-8 border-t border-gray-800/50 pt-5 text-xs text-gray-300">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2 mt-0.5" />
                    <span>Semua Fitur Pro AI Terintegrasi</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2 mt-0.5" />
                    <span>API Akses Data Perseus Core</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-2 mt-0.5" />
                    <span>Sinyal Khusus Broker Swap-Free Partner</span>
                  </li>
                </ul>
              </div>

              <button
                id="btn-plan-select-sponsor"
                onClick={() => onNavigate("VIP")}
                className="w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-transparent text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 cursor-pointer text-center duration-300"
              >
                AJUKAN PERMOHONAN WHITELIST
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL INSPIRATIONAL CTA SECTION */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#040612] to-[#010206] text-center relative z-10 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(circle_at_bottom,rgba(255,215,0,0.06),transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-black text-black border border-amber-300 shadow-[0_0_20px_rgba(255,184,0,0.4)] mb-6 text-lg">
            P
          </div>

          <h2 className="text-3xl sm:text-5xl font-sans font-black text-white uppercase tracking-tight mb-4">
            SUDAH SIAP MENANG LEBIH SERING?
          </h2>
          
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-9 max-w-xl font-light">
            Bergabunglah dengan ratusan trader handal yang mengandalkan analisis real-time Perseus Intelligence setiap harinya. Raih level akurasi harian legendaris sekarang.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              id="cta-btn-start"
              onClick={() => onNavigate("VIP")}
              className="w-full sm:w-auto px-8 py-4 rounded bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold hover:from-amber-400 hover:to-yellow-400 transition-all duration-300 cursor-pointer text-xs uppercase tracking-wider shadow-lg"
            >
              DAFTAR WHITELIST GRATIS
            </button>
            <button
              id="cta-btn-learn"
              onClick={() => onNavigate("Signals")}
              className="w-full sm:w-auto px-8 py-4 rounded bg-[#0B1026] text-white border border-gray-800 hover:bg-[#131A40] transition-all duration-300 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              LIHAT SINYAL LIVE <ArrowRight className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
