import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateBollingerBands,
  calculateVWAP,
  calculateStochastic,
  Candle
} from "./technicalAnalytics";
import { generateQuantMetrics, QuantParams } from "./quantAnalytics";
import fs from "fs";
import path from "path";

export interface Signal {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  timeframe: string;
  time: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  status: "WIN" | "WIN_TP1" | "LOSS" | "INVALID" | "ACTIVE";
  pips: number;
  confidence: number;
  strategy: string;
  commentary: string;
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  poiEntry?: {
    type: string;
    price: number;
    probability: number;
    precision: number;
  };
}

export interface MarketParams {
  oscillatorState: string;
  rsi: number;
  ema20: number;
  ema50: number;
  ema200: number;
  spread: number;
  currentQuote: number;
  dailyHigh: number;
  dailyLow: number;
  openPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  lastUpdated: string;
  quant?: QuantParams;
  poiZones?: POIZone[];
  dataSource: "TWELVEDATA_API" | "TRADINGVIEW_WS" | "REST_API" | "STORED_CANDLES" | "NO_REAL_DATA";
}

export interface POIZone {
  type: "DEMAND" | "SUPPLY" | "ORDER_BLOCK" | "LIQUIDITY_VOID" | "FVG" | "BREAKER";
  priceLevel: number;
  probability: number;
  precision: number;
  strength: "HIGH" | "MEDIUM" | "LOW";
  timeFrame: string;
  description: string;
}

// ============================================================
// REAL MARKET DATA STORE - ZERO SYNTHETIC DATA
// ============================================================

let realTimePrice: number = 2650.00;
let lastRealPriceUpdate: number = 0;
let currentDataSource: MarketParams["dataSource"] = "NO_REAL_DATA";

// Real candlestick store
let realCandles: Candle[] = [];
let lastCandleUpdate: number = 0;

// Market parameters
let activeMarketParams: MarketParams = {
  oscillatorState: "WAITING_FOR_DATA",
  rsi: 50,
  ema20: 0,
  ema50: 0,
  ema200: 0,
  spread: 0.30,
  currentQuote: 0,
  dailyHigh: 0,
  dailyLow: 0,
  openPrice: 0,
  priceChange: 0,
  priceChangePercent: 0,
  volume: 0,
  lastUpdated: new Date().toISOString(),
  poiZones: [],
  dataSource: "NO_REAL_DATA"
};

let activeLiveSignal: Signal = {
  id: "sig-perseus-waiting",
  symbol: "XAUUSD",
  type: "BUY",
  timeframe: "M15",
  time: Date.now(),
  entryPrice: 0,
  stopLoss: 0,
  takeProfit1: 0,
  takeProfit2: 0,
  takeProfit3: 0,
  status: "INVALID",
  pips: 0,
  confidence: 0,
  strategy: "WAITING_FOR_REAL_DATA",
  commentary: "Menunggu data pasar real-time dari TradingView atau TwelveData API... Sistem tidak akan menghasilkan sinyal hingga data real tersedia.",
};

let activeHistorySignals: Signal[] = [];

// ============================================================
// DATABASE PERSISTENCE
// ============================================================

const getDbFilePathForEngine = () => {
  const tmpPath = path.join("/tmp", "signals-db.json");
  const localPath = path.resolve(process.cwd(), "signals-db.json");
  
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, tmpPath);
        }
      } catch (err) {
        console.warn("[Perseus DB] Could not seed DB to /tmp:", err);
      }
    }
    return tmpPath;
  }
  return localPath;
};

const getLockDirForEngine = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "signals-db.lock");
  }
  return path.resolve(process.cwd(), "signals-db.lock");
};

export async function acquireFileLockAsync(timeoutMs = 500): Promise<boolean> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return true;
  }
  const lockDir = getLockDirForEngine();
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      fs.mkdirSync(lockDir);
      return true;
    } catch (err: any) {
      if (err.code === "EEXIST") {
        try {
          const stats = fs.statSync(lockDir);
          if (Date.now() - stats.mtimeMs > 5000) {
            fs.rmdirSync(lockDir);
            continue;
          }
        } catch (e) {}
        await new Promise((resolve) => setTimeout(resolve, 50));
      } else {
        return false;
      }
    }
  }
  return false;
}

export function releaseFileLock() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return;
  const lockDir = getLockDirForEngine();
  try {
    if (fs.existsSync(lockDir)) {
      fs.rmdirSync(lockDir);
    }
  } catch (err) {}
}

export function saveSignalsToDB(active: Signal, history: Signal[]) {
  const dbFile = getDbFilePathForEngine();
  try {
    const tempFile = dbFile + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify({ activeLiveSignal: active, activeHistorySignals: history }, null, 2), "utf-8");
    fs.renameSync(tempFile, dbFile);
  } catch (err) {
    console.error("[Perseus DB] Error writing database:", err);
  }
}

export function loadSignalsFromDB(): { active: Signal | null; history: Signal[] | null } {
  const dbFile = getDbFilePathForEngine();
  try {
    if (fs.existsSync(dbFile)) {
      const raw = fs.readFileSync(dbFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.activeLiveSignal && Array.isArray(parsed.activeHistorySignals)) {
        return { active: parsed.activeLiveSignal, history: parsed.activeHistorySignals };
      }
    }
  } catch (err) {
    console.error("[Perseus DB] Error reading database:", err);
  }
  return { active: null, history: null };
}

export function syncSignalsFromDB(): void {
  try {
    const dbState = loadSignalsFromDB();
    if (dbState.active && dbState.history) {
      activeLiveSignal = dbState.active;
      activeHistorySignals = dbState.history;
    }
  } catch (err) {
    console.error("[Perseus DB] Failed to sync:", err);
  }
}

// Restore from DB on startup
const dbState = loadSignalsFromDB();
if (dbState.active && dbState.history) {
  activeLiveSignal = dbState.active;
  activeHistorySignals = dbState.history;
  console.log(`[Perseus Core] Restored signals from DB. Active: ${activeLiveSignal.id}`);
} else {
  saveSignalsToDB(activeLiveSignal, activeHistorySignals);
}

// ============================================================
// ASYNC LOCK
// ============================================================

class AsyncLock {
  private promise: Promise<void> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void = () => {};
    const nextPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentPromise = this.promise;
    this.promise = nextPromise;
    await currentPromise;
    return release;
  }
}

const engineLock = new AsyncLock();
let engineCalculationInProgress = false;

// ============================================================
// CHECK IF REAL DATA IS AVAILABLE
// ============================================================

function hasRealData(): boolean {
  // Check if we have candles from TradingView WebSocket (most reliable)
  // @ts-ignore
  if (global.realCandlesFromTV && global.realCandlesFromTV.length >= 20) {
    return true;
  }
  
  // Check if we have stored real candles
  if (realCandles.length >= 20 && (Date.now() - lastCandleUpdate) < 3600000) {
    return true;
  }
  
  // Check if price is valid
  if (realTimePrice > 1000 && realTimePrice < 5000 && (Date.now() - lastRealPriceUpdate) < 300000) {
    return true;
  }
  
  return false;
}

// ============================================================
// REAL MARKET DATA FETCHING
// ============================================================

async function fetchRealXAUUSDPrice(): Promise<{ price: number; source: string }> {
  // PRIORITY 1: Check TradingView WebSocket price (from server.ts)
  // @ts-ignore
  if (global.latestTradingViewPrice && global.latestTradingViewPrice > 1000) {
    // @ts-ignore
    const tvPrice = global.latestTradingViewPrice;
    if (tvPrice > 1000 && tvPrice < 5000) {
      console.log(`[Perseus Price] Using TradingView WebSocket price: $${tvPrice}`);
      return { price: tvPrice, source: "TRADINGVIEW_WS" };
    }
  }
  
  // PRIORITY 2: Check TwelveData WebSocket price
  if (latestWsPrice && latestWsPrice > 1000 && latestWsPrice < 5000) {
    console.log(`[Perseus Price] Using TwelveData WebSocket price: $${latestWsPrice}`);
    return { price: latestWsPrice, source: "TWELVEDATA_WS" };
  }
  
  // PRIORITY 3: Fetch from REST APIs
  const sources = [
    {
      name: "Gold-API",
      fetch: async () => {
        const res = await fetch("https://api.gold-api.com/price/XAU", {
          headers: { "Accept": "application/json", "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.price) return Number(data.price);
        }
        return null;
      }
    },
    {
      name: "MetalPriceAPI",
      fetch: async () => {
        const apiKey = process.env.METAL_PRICE_API_KEY;
        if (!apiKey) return null;
        const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`);
        if (res.ok) {
          const data = await res.json();
          if (data?.rates?.XAU) return 1 / Number(data.rates.XAU);
        }
        return null;
      }
    },
    {
      name: "ExchangeRate-API",
      fetch: async () => {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (res.ok) {
          const data = await res.json();
          if (data?.rates?.XAU) return 1 / Number(data.rates.XAU);
        }
        return null;
      }
    }
  ];

  for (const source of sources) {
    try {
      const price = await source.fetch();
      if (price && price > 1000 && price < 5000) {
        console.log(`[Perseus Price] Fetched from ${source.name}: $${price}`);
        return { price, source: "REST_API" };
      }
    } catch (e) {
      // Try next source
    }
  }

  // NO REAL DATA AVAILABLE - Return 0 to signal no data
  console.warn("[Perseus Price] NO REAL DATA AVAILABLE from any source!");
  return { price: 0, source: "NO_REAL_DATA" };
}

async function fetchRealCandles(): Promise<{ candles: Candle[]; source: string }> {
  // PRIORITY 1: TradingView WebSocket candles (from server.ts)
  // @ts-ignore
  if (global.realCandlesFromTV && global.realCandlesFromTV.length >= 20) {
    // @ts-ignore
    const tvCandles = global.realCandlesFromTV;
    console.log(`[Perseus Candles] Using ${tvCandles.length} candles from TradingView WebSocket`);
    return { candles: tvCandles, source: "TRADINGVIEW_WS" };
  }
  
  // PRIORITY 2: Stored real candles (if recent)
  if (realCandles.length >= 20 && (Date.now() - lastCandleUpdate) < 3600000) {
    console.log(`[Perseus Candles] Using ${realCandles.length} stored candles (age: ${Math.round((Date.now() - lastCandleUpdate)/60000)}min)`);
    return { candles: [...realCandles], source: "STORED_CANDLES" };
  }
  
  // PRIORITY 3: TwelveData API
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (apiKey) {
    try {
      const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=15min&outputsize=150&apikey=${apiKey}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        if (data?.values && Array.isArray(data.values) && data.values.length >= 20) {
          const candles: Candle[] = data.values
            .map((item: any) => ({
              time: new Date(item.datetime).getTime(),
              open: parseFloat(item.open),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              close: parseFloat(item.close),
              volume: parseInt(item.volume || "0")
            }))
            .filter((c: Candle) => c.open > 0 && c.close > 0 && c.high >= c.low)
            .reverse();
          
          if (candles.length >= 20) {
            console.log(`[Perseus Candles] Fetched ${candles.length} candles from TwelveData API`);
            realCandles = candles;
            lastCandleUpdate = Date.now();
            return { candles, source: "TWELVEDATA_API" };
          }
        }
      }
    } catch (e) {
      console.warn("[Perseus Candles] TwelveData API failed:", e);
    }
  }
  
  // NO REAL DATA - Return empty array (DO NOT GENERATE FAKE DATA!)
  console.warn("[Perseus Candles] NO REAL CANDLES AVAILABLE! Signal generation will be disabled.");
  return { candles: [], source: "NO_REAL_DATA" };
}

// ============================================================
// POI DETECTION (Deterministic - only runs on real data)
// ============================================================

function detectHighProbabilityPOIs(candles: Candle[], currentPrice: number): POIZone[] {
  if (candles.length < 10) return [];
  
  const poiZones: POIZone[] = [];
  const recentCandles = candles.slice(-50);
  
  // Order Block Detection
  for (let i = recentCandles.length - 5; i >= 2; i--) {
    const candle = recentCandles[i];
    const nextCandle = recentCandles[i + 1];
    
    if (candle.close < candle.open && nextCandle.close > nextCandle.open && 
        nextCandle.close > candle.open && Math.abs(candle.open - currentPrice) / currentPrice < 0.003) {
      poiZones.push({
        type: "ORDER_BLOCK",
        priceLevel: candle.open,
        probability: 90,
        precision: 92,
        strength: "HIGH",
        timeFrame: "M15",
        description: `Bullish Order Block at $${candle.open.toFixed(2)}`
      });
    }
    
    if (candle.close > candle.open && nextCandle.close < nextCandle.open && 
        nextCandle.close < candle.open && Math.abs(candle.open - currentPrice) / currentPrice < 0.003) {
      poiZones.push({
        type: "ORDER_BLOCK",
        priceLevel: candle.open,
        probability: 90,
        precision: 92,
        strength: "HIGH",
        timeFrame: "M15",
        description: `Bearish Order Block at $${candle.open.toFixed(2)}`
      });
    }
  }
  
  // Liquidity Sweep Detection
  const recentLows = recentCandles.slice(-20).map(c => c.low);
  const recentHighs = recentCandles.slice(-20).map(c => c.high);
  const minLow = Math.min(...recentLows);
  const maxHigh = Math.max(...recentHighs);
  
  if (currentPrice < minLow * 1.001 && currentPrice > minLow * 0.998) {
    poiZones.push({
      type: "LIQUIDITY_VOID",
      priceLevel: minLow,
      probability: 93,
      precision: 95,
      strength: "HIGH",
      timeFrame: "M15",
      description: `Liquidity sweep below $${minLow.toFixed(2)}`
    });
  }
  
  if (currentPrice > maxHigh * 0.999 && currentPrice < maxHigh * 1.002) {
    poiZones.push({
      type: "LIQUIDITY_VOID",
      priceLevel: maxHigh,
      probability: 93,
      precision: 95,
      strength: "HIGH",
      timeFrame: "M15",
      description: `Liquidity sweep above $${maxHigh.toFixed(2)}`
    });
  }
  
  return poiZones.sort((a, b) => (b.probability * b.precision) - (a.probability * a.precision));
}

// ============================================================
// SIGNAL GENERATION (Only with real data)
// ============================================================

function createNewLiveSignal(price: number, candles: Candle[]): Signal {
  // Safety check - never generate signals without real data
  if (candles.length < 10 || price <= 0) {
    return {
      id: `sig-waiting-${Date.now()}`,
      symbol: "XAUUSD",
      type: "BUY",
      timeframe: "M15",
      time: Date.now(),
      entryPrice: 0,
      stopLoss: 0,
      takeProfit1: 0,
      takeProfit2: 0,
      takeProfit3: 0,
      status: "INVALID",
      pips: 0,
      confidence: 0,
      strategy: "NO_REAL_DATA",
      commentary: "Menunggu data pasar real-time. Sinyal akan muncul otomatis saat data tersedia.",
    };
  }

  const closePoints = candles.map(b => b.close);
  const highPoints = candles.map(b => b.high);
  const lowPoints = candles.map(b => b.low);
  
  const rsiArr = calculateRSI(closePoints, 14);
  const ema50Arr = calculateEMA(closePoints, 50);
  const ema200Arr = calculateEMA(closePoints, 200);
  const bb = calculateBollingerBands(closePoints, 20, 2);
  const vwapArr = calculateVWAP(candles);
  const stoch = calculateStochastic(highPoints, lowPoints, closePoints, 14, 3, 3);
  
  const rsi = rsiArr.length > 0 ? rsiArr[rsiArr.length - 1] : 50;
  const ema50 = ema50Arr.length > 0 ? ema50Arr[ema50Arr.length - 1] : price;
  const ema200 = ema200Arr.length > 0 ? ema200Arr[ema200Arr.length - 1] : price;
  const currentVWAP = vwapArr.length > 0 ? vwapArr[vwapArr.length - 1] : price;
  const bbUpper = bb.upper.length > 0 ? bb.upper[bb.upper.length - 1] : price;
  const bbLower = bb.lower.length > 0 ? bb.lower[bb.lower.length - 1] : price;
  const kLine = stoch.k.length > 0 ? stoch.k[stoch.k.length - 1] : 50;
  const prevKLine = stoch.k.length > 1 ? stoch.k[stoch.k.length - 2] : 50;
  const dLine = stoch.d.length > 0 ? stoch.d[stoch.d.length - 1] : 50;

  const poiZones = detectHighProbabilityPOIs(candles, price);
  const bestPOI = poiZones.length > 0 ? poiZones[0] : undefined;

  let directionBias: "BUY" | "SELL" = "BUY";
  let strategy = "";
  let commentary = "";
  let confidence = 80;

  const currentCandle = candles[candles.length - 1];
  const isGreenCandle = currentCandle ? currentCandle.close >= currentCandle.open : true;
  const isRedCandle = currentCandle ? currentCandle.close < currentCandle.open : false;

  // VWAP Analysis
  const vwapDistance = Math.abs(price - currentVWAP) / currentVWAP;
  const isVwapBuy = price > currentVWAP && vwapDistance < 0.0015 && isGreenCandle;
  const isVwapSell = price < currentVWAP && vwapDistance < 0.0015 && isRedCandle;

  // Fibonacci Levels
  const recentCandles = candles.slice(-40);
  const swingHigh = Math.max(...recentCandles.map(c => c.high));
  const swingLow = Math.min(...recentCandles.map(c => c.low));
  const range = swingHigh - swingLow;

  const isTrendBullish = ema50 > ema200;
  const isTrendBearish = ema50 < ema200;
  const isFibBuyZone = price <= swingHigh - range * 0.5 && price >= swingHigh - range * 0.618;
  const isFibSellZone = price >= swingLow + range * 0.5 && price <= swingLow + range * 0.618;

  const isBBBuy = price <= bbLower && rsi > 30 && rsi < 45;
  const isBBSell = price >= bbUpper && rsi > 55 && rsi < 70;

  const sweptLow = price > swingLow && price < swingLow + range * 0.05 && isGreenCandle;
  const sweptHigh = price < swingHigh && price > swingHigh - range * 0.05 && isRedCandle;

  const stochBuy = dLine > 40 && kLine < 30 && kLine > prevKLine;
  const stochSell = dLine < 60 && kLine > 70 && kLine < prevKLine;

  // Strategy Selection
  if (sweptLow) {
    directionBias = "BUY";
    strategy = "Liquidity Sweep + MSS (BUY)";
    confidence = 95;
    commentary = `Institutional liquidity sweep detected. Stop losses below $${swingLow.toFixed(2)} cleared.`;
  } else if (sweptHigh) {
    directionBias = "SELL";
    strategy = "Liquidity Sweep + MSS (SELL)";
    confidence = 95;
    commentary = `Institutional liquidity sweep detected. Buy stops above $${swingHigh.toFixed(2)} cleared.`;
  } else if (isVwapBuy) {
    directionBias = "BUY";
    strategy = "VWAP Rejection (BUY)";
    confidence = 92;
    commentary = `Price rejected below VWAP at $${currentVWAP.toFixed(2)}.`;
  } else if (isVwapSell) {
    directionBias = "SELL";
    strategy = "VWAP Rejection (SELL)";
    confidence = 92;
    commentary = `Price rejected above VWAP at $${currentVWAP.toFixed(2)}.`;
  } else if (isTrendBullish && isFibBuyZone) {
    directionBias = "BUY";
    strategy = "Fibonacci Golden Zone (BUY)";
    confidence = 90;
    commentary = `Price in Fibonacci demand zone. EMA50 > EMA200 confirms bullish trend.`;
  } else if (isTrendBearish && isFibSellZone) {
    directionBias = "SELL";
    strategy = "Fibonacci Golden Zone (SELL)";
    confidence = 90;
    commentary = `Price in Fibonacci supply zone. EMA50 < EMA200 confirms bearish trend.`;
  } else if (isBBBuy) {
    directionBias = "BUY";
    strategy = "Bollinger Extreme Reversal (BUY)";
    confidence = 88;
    commentary = `Price at lower Bollinger Band with RSI showing early momentum.`;
  } else if (isBBSell) {
    directionBias = "SELL";
    strategy = "Bollinger Extreme Reversal (SELL)";
    confidence = 88;
    commentary = `Price at upper Bollinger Band with RSI showing exhaustion.`;
  } else if (stochBuy) {
    directionBias = "BUY";
    strategy = "Stochastic Momentum (BUY)";
    confidence = 85;
    commentary = `Stochastic oversold reversal with bullish momentum.`;
  } else if (stochSell) {
    directionBias = "SELL";
    strategy = "Stochastic Momentum (SELL)";
    confidence = 85;
    commentary = `Stochastic overbought reversal with bearish momentum.`;
  } else {
    directionBias = isGreenCandle ? "BUY" : "SELL";
    strategy = "Momentum Continuation";
    confidence = 78;
    commentary = `Following candle momentum with tight risk management.`;
  }

  // Calculate Stop Loss using ATR
  const atrArr = calculateATR(highPoints, lowPoints, closePoints, 14);
  const currentATR = atrArr.length > 0 ? atrArr[atrArr.length - 1] : price * 0.002;
  const stopDistance = Math.max(currentATR * 1.2, price * 0.001);
  
  const stopLoss = directionBias === "BUY" 
    ? Number((price - stopDistance).toFixed(2))
    : Number((price + stopDistance).toFixed(2));

  const minProfit = Math.abs(price - stopLoss);
  const tp1 = directionBias === "BUY" 
    ? Number((price + minProfit * 1.5).toFixed(2))
    : Number((price - minProfit * 1.5).toFixed(2));
  const tp2 = directionBias === "BUY"
    ? Number((price + minProfit * 3.0).toFixed(2))
    : Number((price - minProfit * 3.0).toFixed(2));
  const tp3 = directionBias === "BUY"
    ? Number((price + minProfit * 4.5).toFixed(2))
    : Number((price - minProfit * 4.5).toFixed(2));

  const poiEntry = bestPOI ? {
    type: bestPOI.type,
    price: bestPOI.priceLevel,
    probability: bestPOI.probability,
    precision: bestPOI.precision
  } : undefined;

  return {
    id: `sig-perseus-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    symbol: "XAUUSD",
    type: directionBias,
    timeframe: "M15",
    time: Date.now(),
    entryPrice: Number(price.toFixed(2)),
    stopLoss,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    status: "ACTIVE",
    pips: 0,
    confidence,
    strategy,
    commentary: `${directionBias === "BUY" ? "🟢 BUY" : "🔴 SELL"} Signal (${confidence}%)\n\nStrategy: ${strategy}\n${commentary}\n\n📊 Risk:\n• SL: $${stopLoss}\n• TP1: $${tp1}\n• TP2: $${tp2}\n• TP3: $${tp3}`,
    poiEntry
  };
}

// ============================================================
// MARKET DATA PROCESSING ENGINE
// ============================================================

async function processPerseusMarketDataInternal(): Promise<void> {
  syncSignalsFromDB();
  
  try {
    // STEP 1: Get real price from best available source
    const priceResult = await fetchRealXAUUSDPrice();
    
    // STEP 2: Get real candles from best available source
    const candleResult = await fetchRealCandles();
    
    // STEP 3: Validate we have real data
    if (priceResult.price <= 0 || candleResult.candles.length < 10) {
      console.warn("[Perseus] INSUFFICIENT REAL DATA - Skipping signal generation");
      activeMarketParams = {
        ...activeMarketParams,
        dataSource: "NO_REAL_DATA",
        lastUpdated: new Date().toISOString(),
        oscillatorState: "WAITING_FOR_DATA"
      };
      return;
    }
    
    // STEP 4: Update global state with REAL data
    realTimePrice = priceResult.price;
    lastRealPriceUpdate = Date.now();
    realCandles = candleResult.candles;
    lastCandleUpdate = Date.now();
    currentDataSource = candleResult.source as MarketParams["dataSource"];
    
    const candles = candleResult.candles;
    const price = priceResult.price;

    // STEP 5: Calculate indicators from REAL data
    const closePoints = candles.map(c => c.close);
    const highPoints = candles.map(c => c.high);
    const lowPoints = candles.map(c => c.low);

    const rsiArr = calculateRSI(closePoints, 14);
    const ema20Arr = calculateEMA(closePoints, 20);
    const ema50Arr = calculateEMA(closePoints, 50);
    const ema200Arr = calculateEMA(closePoints, 200);
    const atrArr = calculateATR(highPoints, lowPoints, closePoints, 14);

    const finalRsi = rsiArr[rsiArr.length - 1] || 50;
    const finalEma20 = ema20Arr[ema20Arr.length - 1] || price;
    const finalEma50 = ema50Arr[ema50Arr.length - 1] || price;
    const finalEma200 = ema200Arr[ema200Arr.length - 1] || price;

    // Daily metrics from real candles
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const dayCandles = candles.filter(c => c.time > dayAgo);
    const dailyOpen = dayCandles.length > 0 ? dayCandles[0].open : price;
    const dailyHigh = dayCandles.length > 0 ? Math.max(...dayCandles.map(c => c.high)) : price * 1.005;
    const dailyLow = dayCandles.length > 0 ? Math.min(...dayCandles.map(c => c.low)) : price * 0.995;

    // Oscillator state
    let oscillatorState = "NEUTRAL";
    if (finalRsi > 68) oscillatorState = "OVERBOUGHT";
    else if (finalRsi < 32) oscillatorState = "OVERSOLD";
    else if (price > finalEma50) oscillatorState = "BULLISH";
    else oscillatorState = "BEARISH";

    // Generate quant metrics & POIs from REAL data
    const quantMetrics = generateQuantMetrics(candles, price);
    const poiZones = detectHighProbabilityPOIs(candles, price);

    // Update market params
    activeMarketParams = {
      oscillatorState,
      rsi: Number(finalRsi.toFixed(1)),
      ema20: Number(finalEma20.toFixed(2)),
      ema50: Number(finalEma50.toFixed(2)),
      ema200: Number(finalEma200.toFixed(2)),
      spread: 0.25,
      currentQuote: price,
      dailyHigh: Number(dailyHigh.toFixed(2)),
      dailyLow: Number(dailyLow.toFixed(2)),
      openPrice: Number(dailyOpen.toFixed(2)),
      priceChange: Number((price - dailyOpen).toFixed(2)),
      priceChangePercent: Number((((price - dailyOpen) / dailyOpen) * 100).toFixed(2)),
      volume: candles[candles.length - 1]?.volume || 0,
      lastUpdated: new Date().toISOString(),
      quant: quantMetrics,
      poiZones,
      dataSource: currentDataSource
    };

    // STEP 6: Signal management (only with real data)
    if (activeLiveSignal.id === "sig-perseus-waiting" || activeLiveSignal.id === "sig-perseus-initial" || activeLiveSignal.status !== "ACTIVE") {
      // Generate new signal from REAL data
      activeLiveSignal = createNewLiveSignal(price, candles);
      saveSignalsToDB(activeLiveSignal, activeHistorySignals);
      console.log(`[Perseus] New REAL signal: ${activeLiveSignal.type} @ $${activeLiveSignal.entryPrice} | Source: ${currentDataSource}`);
    } else {
      // Monitor active signal with REAL price
      let isClosed = false;
      let closeStatus: "WIN" | "WIN_TP1" | "LOSS" = "LOSS";
      let profitPips = 0;

      if (activeLiveSignal.type === "BUY") {
        if (price >= activeLiveSignal.takeProfit1 && !activeLiveSignal.tp1Hit) {
          activeLiveSignal.tp1Hit = true;
          activeLiveSignal.stopLoss = activeLiveSignal.entryPrice;
          saveSignalsToDB(activeLiveSignal, activeHistorySignals);
          console.log(`[Perseus] TP1 HIT! SL → Breakeven`);
        }
        
        if (price <= activeLiveSignal.stopLoss) {
          isClosed = true;
          closeStatus = activeLiveSignal.tp1Hit ? "WIN_TP1" : "LOSS";
          profitPips = activeLiveSignal.tp1Hit ? 10 : -Math.round(Math.abs(activeLiveSignal.entryPrice - activeLiveSignal.stopLoss) * 10);
        } else if (price >= activeLiveSignal.takeProfit2) {
          isClosed = true;
          closeStatus = "WIN";
          profitPips = Math.round(Math.abs(activeLiveSignal.takeProfit2 - activeLiveSignal.entryPrice) * 10);
        }
      } else {
        if (price <= activeLiveSignal.takeProfit1 && !activeLiveSignal.tp1Hit) {
          activeLiveSignal.tp1Hit = true;
          activeLiveSignal.stopLoss = activeLiveSignal.entryPrice;
          saveSignalsToDB(activeLiveSignal, activeHistorySignals);
          console.log(`[Perseus] TP1 HIT! SL → Breakeven`);
        }
        
        if (price >= activeLiveSignal.stopLoss) {
          isClosed = true;
          closeStatus = activeLiveSignal.tp1Hit ? "WIN_TP1" : "LOSS";
          profitPips = activeLiveSignal.tp1Hit ? 10 : -Math.round(Math.abs(activeLiveSignal.stopLoss - activeLiveSignal.entryPrice) * 10);
        } else if (price <= activeLiveSignal.takeProfit2) {
          isClosed = true;
          closeStatus = "WIN";
          profitPips = Math.round(Math.abs(activeLiveSignal.entryPrice - activeLiveSignal.takeProfit2) * 10);
        }
      }

      if (isClosed) {
        activeLiveSignal.status = closeStatus;
        activeLiveSignal.pips = profitPips;
        activeLiveSignal.time = Date.now();
        
        const emoji = closeStatus === "WIN" ? "🟢" : closeStatus === "WIN_TP1" ? "🟡" : "🔴";
        activeLiveSignal.commentary = `${emoji} Trade Closed: ${closeStatus} (${profitPips > 0 ? '+' : ''}${profitPips} pips)\n\n${activeLiveSignal.commentary}`;
        
        activeHistorySignals.unshift({ ...activeLiveSignal });
        console.log(`[Perseus] Trade CLOSED: ${closeStatus} | ${profitPips} pips`);
        
        // Generate next signal from REAL data
        activeLiveSignal = createNewLiveSignal(price, candles);
        saveSignalsToDB(activeLiveSignal, activeHistorySignals);
        console.log(`[Perseus] New signal: ${activeLiveSignal.type} @ $${activeLiveSignal.entryPrice}`);
      }
    }
  } catch (error) {
    console.error("[Perseus] Processing error:", error);
  }
}

export async function processPerseusMarketData(): Promise<void> {
  if (engineCalculationInProgress) return;
  
  engineCalculationInProgress = true;
  const release = await engineLock.acquire();
  const fileLockAcquired = await acquireFileLockAsync();
  
  try {
    syncSignalsFromDB();
    await processPerseusMarketDataInternal();
  } finally {
    if (fileLockAcquired) releaseFileLock();
    release();
    engineCalculationInProgress = false;
  }
}

// ============================================================
// WEBSOCKET FOR REAL-TIME PRICE
// ============================================================

import { WebSocket as WsClient } from "ws";

let wsClient: WsClient | null = null;
export let latestWsPrice: number | null = null;

export function initTwelveDataWebSocket() {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  
  if (!apiKey || apiKey === "") {
    console.log("[Perseus WS] No TwelveData API key. Will rely on TradingView WebSocket or REST API.");
    return;
  }
  
  try {
    wsClient = new WsClient(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);
    
    wsClient.on('open', () => {
      console.log("[Perseus WS] Connected to TwelveData");
      wsClient!.send(JSON.stringify({
        action: "subscribe",
        params: { symbols: "XAU/USD" }
      }));
    });
    
    wsClient.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.event === "price" && parsed.price) {
          latestWsPrice = parseFloat(parsed.price);
          _triggerWssBroadcast();
        }
      } catch (err) {}
    });

    wsClient.on('close', () => {
      console.log("[Perseus WS] Disconnected. Reconnecting in 10s...");
      setTimeout(initTwelveDataWebSocket, 10000);
    });
    
    wsClient.on('error', () => {});
  } catch (err) {
    console.error("[Perseus WS] Init failed");
  }
}

let lastEngineProcTime = 0;

function _triggerWssBroadcast() {
  const now = Date.now();
  if (now - lastEngineProcTime >= 2000) {
    lastEngineProcTime = now;
    processPerseusMarketData().then(() => {
      // @ts-ignore
      if (global.wss) {
        // @ts-ignore
        global.wss.clients.forEach((client: any) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "SYNC",
              data: activeMarketParams
            }));
          }
        });
      }
    }).catch(() => {});
  }
}

// ============================================================
// STARTUP
// ============================================================

const isBuildProcess = process.argv.some(arg => 
  arg.endsWith('vite') && process.argv.includes('build')
) || process.argv.includes('esbuild');

if (!isBuildProcess) {
  processPerseusMarketData();
  
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    setTimeout(initTwelveDataWebSocket, 3000);
  }
}

// ============================================================
// PUBLIC API
// ============================================================

export async function triggerAISignalScan(forceRetry = false): Promise<Signal> {
  const release = await engineLock.acquire();
  const fileLockAcquired = await acquireFileLockAsync();
  
  try {
    syncSignalsFromDB();
    
    if (activeLiveSignal && activeLiveSignal.status === "ACTIVE" && !forceRetry) {
      return activeLiveSignal;
    }
    
    await processPerseusMarketDataInternal();
    return activeLiveSignal;
  } finally {
    if (fileLockAcquired) releaseFileLock();
    release();
  }
}

export function fetchPerseusMarketParams(): MarketParams {
  return activeMarketParams;
}

export function fetchPerseusLiveSignal(): Signal {
  syncSignalsFromDB();
  return activeLiveSignal;
}

export function fetchPerseusHistorySignals(): Signal[] {
  syncSignalsFromDB();
  return activeHistorySignals;
}

export async function updateSignalCommentary(signalId: string, commentary: string) {
  const lockAcquired = await acquireFileLockAsync();
  try {
    syncSignalsFromDB();
    if (activeLiveSignal.id === signalId) {
      activeLiveSignal.commentary = commentary;
    } else {
      const histItem = activeHistorySignals.find(s => s.id === signalId);
      if (histItem) histItem.commentary = commentary;
    }
    saveSignalsToDB(activeLiveSignal, activeHistorySignals);
  } finally {
    if (lockAcquired) releaseFileLock();
  }
}

let lastRequestTickTime = 0;

export async function processPerseusMarketDataOnRequest(): Promise<void> {
  const now = Date.now();
  if (now - lastRequestTickTime >= 5000) {
    lastRequestTickTime = now;
    await processPerseusMarketData();
  }
}
