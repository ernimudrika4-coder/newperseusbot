import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isPositive: boolean;
}

export default function TapesHeader({ currentXau }: { currentXau: number }) {
  const [tickers, setTickers] = useState<TickerData[]>([
    { symbol: "XAUUSD", name: "Gold Spot", price: 4417.30, change: 0.33, isPositive: true },
    { symbol: "EURUSD", name: "Euro / US Dollar", price: 1.0852, change: -0.12, isPositive: false },
    { symbol: "BTCUSD", name: "Bitcoin", price: 68420.00, change: 1.45, isPositive: true },
    { symbol: "DXY", name: "US Dollar Index", price: 103.95, change: -0.22, isPositive: false },
    { symbol: "US10Y", name: "US 10-Yr Bond Yield", price: 4.432, change: -0.85, isPositive: false },
    { symbol: "XAGUSD", name: "Silver Spot", price: 31.44, change: 1.98, isPositive: true },
    { symbol: "USOIL", name: "WTI Crude Oil", price: 79.12, change: 0.54, isPositive: true }
  ]);

  // Synchronize XAUUSD price with app's active spot gold price state
  useEffect(() => {
    setTickers(prev => prev.map(t => {
      if (t.symbol === "XAUUSD") {
        const percentChange = ((currentXau - 4410.00) / 4410.00) * 100;
        return {
          ...t,
          price: currentXau,
          change: Number(percentChange.toFixed(2)),
          isPositive: currentXau >= 4410.00
        };
      }
      return t;
    }));
  }, [currentXau]);

  return (
    <div className="w-full bg-[#0a0c10] border-b border-[#1f2633] text-xs font-mono text-gray-400 py-2 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0 text-amber-500 font-semibold uppercase text-[10px] tracking-wider border-r border-[#1f2633] pr-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Perseus Live Ticker
        </div>
        <div className="flex items-center gap-8 whitespace-nowrap">
          {tickers.map((ticker) => (
            <div key={ticker.symbol} className="flex items-center gap-2">
              <span className="font-semibold text-gray-300">{ticker.symbol}</span>
              <span className="text-gray-100 font-medium">
                {ticker.symbol === "EURUSD" || ticker.symbol === "US10Y" 
                  ? ticker.price.toFixed(4) 
                  : ticker.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center text-[10px] font-bold ${ticker.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                {ticker.isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {ticker.isPositive ? "+" : ""}
                {ticker.change}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
