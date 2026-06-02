import React, { useState } from "react";
import { Signal, MarketParams } from "../types";
import { Sliders, Sparkles, AlertTriangle, Layers, Activity, HelpCircle } from "lucide-react";

interface InteractiveFibonacciChartProps {
  activeSignal: Signal | null;
  marketParams: MarketParams | null;
}

export default function InteractiveFibonacciChart({ activeSignal, marketParams }: InteractiveFibonacciChartProps) {
  // We can calculate dynamic levels based on the live current price or market high/low
  const entryPrice = activeSignal?.entryPrice || 4540.24;
  const highPrice = marketParams?.dailyHigh || (entryPrice + 19.50);
  const lowPrice = marketParams?.dailyLow || (entryPrice - 23.80);
  const priceRange = highPrice - lowPrice || 40.0;

  // Let's establish standard Fibonacci Retracement levels
  const fibRatios = [
    { ratio: 0.0, name: "0.00% (High Jenuh)", desc: "Resistensi tren teratas harian" },
    { ratio: 0.236, name: "23.60% (Pullback)", desc: "Zona istirahat momentum minor" },
    { ratio: 0.382, name: "38.20% (Koreksi Normal)", desc: "Batas pengetesan tren normal" },
    { ratio: 0.500, name: "50.00% (Median)", desc: "Level psikologis tengah bursa harian" },
    { ratio: 0.618, name: "61.80% (Golden Pocket)", desc: "Titik balik mutlak institusional" },
    { ratio: 0.786, name: "78.60% (Deep Retracement)", desc: "Pertahanan likuiditas terakhir hulu" },
    { ratio: 1.0, name: "100.00% (Low Jenuh)", desc: "Support tren terbawah harian" },
  ];

  // Map absolute price values for each ratio
  // Standard Retracement from high to low or low to high (assuming standard bottom-up climb)
  const fibLevels = fibRatios.map((item) => {
    // Price = High - (Ratio * Range)
    const levelPrice = highPrice - item.ratio * priceRange;
    return {
      ...item,
      price: Number(levelPrice.toFixed(2)),
    };
  });

  const [hoveredLevelIdx, setHoveredLevelIdx] = useState<number | null>(null);

  // SVG parameters
  const svgWidth = 500;
  const svgHeight = 250;
  const padding = { top: 25, bottom: 25, left: 75, right: 90 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Function to convert price value to Y coordinate on the SVG
  const getYCoordinate = (priceVal: number) => {
    const fraction = (priceVal - lowPrice) / priceRange;
    // higher price is at top, so (1 - fraction)
    return padding.top + (1 - fraction) * graphHeight;
  };

  const entryY = getYCoordinate(entryPrice);

  return (
    <div id="interactive-fibonacci-chart" className="p-6 sm:p-8 rounded-2xl bg-[#040407] border border-amber-500/15 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.015] rounded-full blur-[60px]" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <span className="font-mono text-[9px] text-amber-500 tracking-widest uppercase block font-black">📊 IDEAL OPTION MODULE 3</span>
          <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-wider">Interactive Fibonacci & Liquidity Sweeps</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-normal font-sans">Visualisasi sebaran Golden Pocket ($0.618$) harian terhadap Pivot harga spot emas.</p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#07070a] border border-amber-500/20 text-slate-400 font-mono text-[9px] font-black tracking-wider uppercase select-none">
          <Layers className="w-3.5 h-3.5 text-amber-500" /> Live Mapping
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LHS Chart visualization scale */}
        <div className="lg:col-span-7 bg-black/60 rounded-xl p-3 border border-[#14141a] relative overflow-hidden flex justify-center">
          <div className="absolute top-2.5 left-2.5 font-mono text-[8px] text-slate-500 uppercase tracking-widest font-black select-none pointer-events-none">
            XAUUSD VIRTUAL FIB MAPPER
          </div>

          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-auto block select-none overflow-visible"
          >
            {/* Draw Horizontal Grid Lines representing Fibonacci levels */}
            {fibLevels.map((lvl, index) => {
              const y = getYCoordinate(lvl.price);
              const isHovered = hoveredLevelIdx === index;
              const isGoldenPocket = lvl.ratio === 0.618;
              
              let strokeColor = "rgba(212,175,55,0.18)";
              let strokeWidth = 1;
              if (isGoldenPocket) {
                strokeColor = "rgba(245,158,11,0.45)";
                strokeWidth = 1.5;
              }
              if (isHovered) {
                strokeColor = "#d4af37";
                strokeWidth = 2;
              }

              return (
                <g 
                  key={index} 
                  onMouseEnter={() => setHoveredLevelIdx(index)}
                  onMouseLeave={() => setHoveredLevelIdx(null)}
                  className="cursor-crosshair transition-all duration-200"
                >
                  {/* Invisible thick helper line to make hover easier */}
                  <line 
                    x1={padding.left} 
                    y1={y} 
                    x2={svgWidth - padding.right} 
                    y2={y} 
                    stroke="transparent" 
                    strokeWidth={12} 
                  />

                  {/* Visual dashed horizontal line */}
                  <line 
                    x1={padding.left} 
                    y1={y} 
                    x2={svgWidth - padding.right} 
                    y2={y} 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth}
                    strokeDasharray={isGoldenPocket && !isHovered ? "4,4" : undefined}
                    className="transition-colors duration-200"
                  />

                  {/* Level percentage tag */}
                  <text 
                    x={padding.left - 10} 
                    y={y + 3} 
                    fill={isHovered ? "#fff" : isGoldenPocket ? "#f59e0b" : "#4b5563"} 
                    className="font-mono text-[8.5px] font-black text-right transition-colors"
                    textAnchor="end"
                  >
                    {lvl.ratio === 0.0 ? "0.0%" : lvl.ratio === 0.5 ? "50.0%" : lvl.ratio === 1.0 ? "100%" : `${(lvl.ratio * 100).toFixed(1)}%`}
                  </text>

                  {/* Level exact price value tag */}
                  <text 
                    x={svgWidth - padding.right + 10} 
                    y={y + 3} 
                    fill={isHovered ? "#d4af37" : "#888"} 
                    className="font-mono text-[8.5px] font-bold text-left transition-colors"
                  >
                    ${lvl.price.toFixed(2)}
                  </text>

                  {/* Level descriptive hover background block */}
                  {isHovered && (
                    <circle 
                      cx={padding.left + graphWidth / 2} 
                      cy={y} 
                      r={4.5} 
                      fill="#d4af37" 
                      className="animate-ping" 
                    />
                  )}
                </g>
              );
            })}

            {/* Glowing Active Entry Price pointer flag */}
            <g className="pointer-events-none">
              <line 
                x1={padding.left} 
                y1={entryY} 
                x2={svgWidth - padding.right} 
                y2={entryY} 
                stroke="#00ff66" 
                strokeWidth={1.5}
                strokeDasharray="2,2"
              />
              <circle 
                cx={padding.left} 
                cy={entryY} 
                r={3.5} 
                fill="#00ff66" 
              />
              {/* Pulsing Entry level text */}
              <rect
                x={svgWidth - padding.right - 90}
                y={entryY - 8}
                width={85}
                height={16}
                rx={3}
                fill="rgba(0, 255, 102, 0.15)"
                stroke="#00ff66"
                strokeWidth={0.5}
              />
              <text
                x={svgWidth - padding.right - 47.5}
                y={entryY + 3.5}
                fill="#00ff66"
                className="font-mono text-[8px] font-black text-center"
                textAnchor="middle"
              >
                ● CORE ENTRY ZONE
              </text>
            </g>
          </svg>
        </div>

        {/* RHS Description box explaining interactive results */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-[#07070a]/90 border border-[#14141a] rounded-xl">
            {hoveredLevelIdx !== null ? (
              <div className="space-y-2 animate-in fade-in duration-200">
                <span className="text-[8.5px] font-mono text-amber-500 uppercase tracking-widest font-black block">Koefisien Terfokus:</span>
                <strong className="text-white text-sm font-display tracking-wide block uppercase">
                  {fibLevels[hoveredLevelIdx].name}
                </strong>
                <div className="flex justify-between items-center bg-black/60 p-2 rounded border border-amber-500/10 mb-1">
                  <span className="font-mono text-[10px] text-slate-500 font-bold">Harga Mapped</span>
                  <span className="font-mono text-xs font-black text-amber-400">
                    ${fibLevels[hoveredLevelIdx].price}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans font-light">
                  {fibLevels[hoveredLevelIdx].desc}. Membantu mitigasi area pembongkaran muatan pimpinan bursa.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-[10px] text-slate-500 font-sans leading-relaxed">
                👉 <strong className="text-slate-400 font-mono block mb-1">EKSPLORASI FIB INTERAKTIF</strong>
                Letakkan kursor Anda di atas garis atau koordinat level grafik untuk mendapatkan rincian tumpukan algoritma Fibonacci harian.
              </div>
            )}
          </div>

          <div className="p-3.5 bg-gradient-to-r from-[#120e03] to-black rounded-lg border border-amber-500/15 text-[10px] text-slate-300 leading-relaxed font-sans">
            🔥 <strong className="text-amber-400 uppercase text-[9px] font-mono tracking-wider block mb-1">Golden Pocket ($0.618 – $0.786$)</strong>
            Ini adalah batas penyerapan volume krusial di mana para pelaku institusi kerap menginisiasi stop-loss sweeps sebelum ledakan tren dimulai.
          </div>
        </div>
      </div>
    </div>
  );
}
