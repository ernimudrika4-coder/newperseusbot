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

// ============================================================
// PRICE SOURCE CONFIGURATION — Adjust this to match your frontend
// ============================================================
// Twelve Data provides MID price by default.
// Set to "BID", "ASK", or "MID" based on what your frontend displays.
// - If using TradingView chart widget: usually "BID"
// - If using Twelve Data widget: usually "MID"
// - XAUUSD spread is typically 0.20-0.50 on standard accounts
// ============================================================
type DisplayPriceMode = "BID" | "ASK" | "MID";

function getDisplayPriceMode(): DisplayPriceMode {
  const mode = String(process.env.XAUUSD_DISPLAY_PRICE_MODE || "MID").toUpperCase();
  return mode === "BID" || mode === "ASK" || mode === "MID" ? mode : "MID";
}

function getPositiveNumberEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DISPLAY_PRICE_MODE = getDisplayPriceMode();
const DEFAULT_SPREAD = getPositiveNumberEnv("XAUUSD_DEFAULT_SPREAD", 0.35);
const PRICE_DRIFT_TOLERANCE_USD = getPositiveNumberEnv("XAUUSD_PRICE_TOLERANCE_USD", 0.75);
const LIVE_WS_MAX_AGE_MS = getPositiveNumberEnv("XAUUSD_WS_MAX_AGE_MS", 2500);
const LIVE_PRICE_MAX_AGE_MS = getPositiveNumberEnv("XAUUSD_LIVE_PRICE_MAX_AGE_MS", 5000);
const REST_VALIDATION_MAX_AGE_MS = getPositiveNumberEnv("XAUUSD_REST_VALIDATION_MAX_AGE_MS", 90000);

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
}

export interface PriceValidationInfo {
  ok: boolean;
  checkedAt: string;
  toleranceUsd: number;
  activeDisplayPrice?: number;
  referenceDisplayPrice?: number;
  diffUsd?: number;
  refreshed: boolean;
  reason: string;
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
  priceSource?: string;
  priceTimestamp?: string;
  priceAgeMs?: number;
  feedHealth?: "LIVE" | "STALE" | "FALLBACK" | "UNINITIALIZED";
  validation?: PriceValidationInfo;
  rawMidPrice?: number;      // Original Twelve Data MID price before spread adjustment
  isFallbackPrice?: boolean;  // TRUE if this price is a fallback (not live)
  quant?: QuantParams;
}

interface PriceSnapshot {
  midPrice: number;
  spread: number;
  source: string;
  fetchedAt: number;
  providerTimestamp?: string;
  validation?: PriceValidationInfo;
}

// ============================================================
// PRICE VALIDATION CONSTANTS
// ============================================================
const MIN_VALID_GOLD_PRICE = 1000;   // Below this = definitely invalid
const MAX_VALID_GOLD_PRICE = 10000;  // Above this = definitely invalid
const MAX_PRICE_JUMP_PERCENT = 0.5;  // Max 0.5% change per tick (reject flash spikes)
const STALE_PRICE_MAX_AGE_MS = 30000; // 30 seconds = stale, mark as fallback

// ============================================================
// STATE — SINGLE SOURCE OF TRUTH
// ============================================================
let activeMarketParams: MarketParams = {
  oscillatorState: "INITIALIZING",
  rsi: 50,
  ema20: 0,
  ema50: 0,
  ema200: 0,
  spread: DEFAULT_SPREAD,
  currentQuote: 0,
  dailyHigh: 0,
  dailyLow: 0,
  openPrice: 0,
  priceChange: 0,
  priceChangePercent: 0,
  volume: 0,
  lastUpdated: new Date().toISOString(),
  priceSource: "UNINITIALIZED",
  priceTimestamp: new Date().toISOString(),
  priceAgeMs: 0,
  feedHealth: "UNINITIALIZED",
  validation: {
    ok: false,
    checkedAt: new Date().toISOString(),
    toleranceUsd: PRICE_DRIFT_TOLERANCE_USD,
    refreshed: false,
    reason: "Price feed has not produced a live XAUUSD tick yet."
  },
  rawMidPrice: 0,
  isFallbackPrice: true
};

let activeLiveSignal: Signal = {
  id: "sig-perseus-initial",
  symbol: "XAUUSD",
  type: "BUY",
  timeframe: "M15",
  time: Date.now(),
  entryPrice: 0, // Will be set on first valid price
  stopLoss: 0,
  takeProfit1: 0,
  takeProfit2: 0,
  takeProfit3: 0,
  status: "ACTIVE",
  pips: 0,
  confidence: 90,
  strategy: "Perseus SMC Order Block & Liquidity Wick Grab",
  commentary: "Sistem menginisiasi integrasi umpan data real-time..."
};

let activeHistorySignals: Signal[] = [];

// ============================================================
// PRICE HISTORY FOR VALIDATION (ring buffer)
// ============================================================
const priceHistory: Array<{ price: number; timestamp: number; source: string }> = [];
const MAX_PRICE_HISTORY = 20;

function addPriceToHistory(price: number, source: string): void {
  priceHistory.push({ price, timestamp: Date.now(), source });
  if (priceHistory.length > MAX_PRICE_HISTORY) {
    priceHistory.shift();
  }
}

// ============================================================
// SPREAD ADJUSTMENT — Convert MID → BID or ASK
// ============================================================
let currentSpread = DEFAULT_SPREAD;

export function updateSpread(newSpread: number): void {
  if (newSpread > 0 && newSpread < 10) {
    currentSpread = newSpread;
    console.log(`[Spread] Updated spread to $${currentSpread.toFixed(2)}`);
  }
}

function adjustMidPriceForDisplay(midPrice: number, spread: number): number {
  switch (DISPLAY_PRICE_MODE) {
    case "BID":
      return Number((midPrice - spread / 2).toFixed(2));
    case "ASK":
      return Number((midPrice + spread / 2).toFixed(2));
    case "MID":
    default:
      return Number(midPrice.toFixed(2));
  }
}

function adjustPriceForDisplay(midPrice: number): number {
  return adjustMidPriceForDisplay(midPrice, currentSpread);
}

// ============================================================
// PRICE VALIDATION
// ============================================================
function isValidPrice(price: number, source: string): boolean {
  // Check for NaN, Infinity, negative, zero
  if (isNaN(price) || !isFinite(price) || price <= 0) {
    console.warn(`[Validation] REJECTED: Invalid number (${price}) from ${source}`);
    return false;
  }

  // Check reasonable gold price range
  if (price < MIN_VALID_GOLD_PRICE || price > MAX_VALID_GOLD_PRICE) {
    console.warn(`[Validation] REJECTED: Out of range (${price}) from ${source}`);
    return false;
  }

  // Check for flash spike (>0.5% jump in 1 second)
  if (priceHistory.length > 0) {
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const lastTimestamp = priceHistory[priceHistory.length - 1].timestamp;
    const timeDiffMs = Date.now() - lastTimestamp;

    if (timeDiffMs < 2000) { // Only check if within 2 seconds
      const pctChange = Math.abs((price - lastPrice) / lastPrice) * 100;
      if (pctChange > MAX_PRICE_JUMP_PERCENT) {
        console.warn(`[Validation] REJECTED: Spike ${pctChange.toFixed(3)}% (${lastPrice} → ${price}) from ${source}`);
        return false;
      }
    }
  }

  return true;
}

function isPriceStale(timestamp: string): boolean {
  const age = Date.now() - new Date(timestamp).getTime();
  return age > STALE_PRICE_MAX_AGE_MS;
}

function snapshotAgeMs(snapshot: PriceSnapshot): number {
  return Math.max(0, Date.now() - snapshot.fetchedAt);
}

function isSnapshotFresh(snapshot: PriceSnapshot, maxAgeMs = LIVE_PRICE_MAX_AGE_MS): boolean {
  return snapshotAgeMs(snapshot) <= maxAgeMs;
}

function parseProviderTimestamp(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }

  const text = String(value).trim();
  const numeric = Number(text);
  if (Number.isFinite(numeric) && text !== "") {
    const millis = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    return new Date(millis).toISOString();
  }

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

function normalizeSpread(rawSpread: unknown, bid?: number, ask?: number): number {
  if (Number.isFinite(bid) && Number.isFinite(ask) && ask! > bid!) {
    return Number((ask! - bid!).toFixed(2));
  }

  const spreadValue = Number(rawSpread);
  if (!Number.isFinite(spreadValue) || spreadValue <= 0) {
    return currentSpread;
  }

  if (spreadValue > 10) {
    return Number((spreadValue / 100).toFixed(2));
  }

  return Number(spreadValue.toFixed(2));
}

function buildValidationInfo(
  reason: string,
  ok: boolean,
  refreshed: boolean,
  activeDisplayPrice?: number,
  referenceDisplayPrice?: number
): PriceValidationInfo {
  const diffUsd = activeDisplayPrice !== undefined && referenceDisplayPrice !== undefined
    ? Number(Math.abs(activeDisplayPrice - referenceDisplayPrice).toFixed(2))
    : undefined;

  return {
    ok,
    checkedAt: new Date().toISOString(),
    toleranceUsd: PRICE_DRIFT_TOLERANCE_USD,
    activeDisplayPrice,
    referenceDisplayPrice,
    diffUsd,
    refreshed,
    reason
  };
}

// ============================================================
// TWELVE DATA REST API — FETCH REAL CANDLE HISTORY
// ============================================================
async function fetchTwelveDataCandles(
  interval: string = "1min",
  outputSize: number = 150
): Promise<Candle[] | null> {
  const apiKey = process.env.TWELVEDATA_API_KEY || "94cccf19822141cbb8e8323fbbfd0591";
  const fetchTs = new Date().toISOString();

  try {
    const url = `https://api.twelvedata.com/time_series?apikey=${apiKey}&interval=${interval}&symbol=XAU/USD&outputsize=${outputSize}&format=JSON`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json", "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      console.warn(`[Candles] HTTP ${res.status} from Twelve Data at ${fetchTs}`);
      return null;
    }

    const data = await res.json();

    if (data && data.values && Array.isArray(data.values) && data.values.length > 0) {
      const candles: Candle[] = data.values
        .map((v: any) => ({
          time: new Date(v.datetime).getTime(),
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: parseInt(v.volume || "0")
        }))
        .filter((c: Candle) =>
          isValidPrice(c.open, "TwelveData-Candles") &&
          isValidPrice(c.high, "TwelveData-Candles") &&
          isValidPrice(c.low, "TwelveData-Candles") &&
          isValidPrice(c.close, "TwelveData-Candles")
        )
        .sort((a: Candle, b: Candle) => a.time - b.time); // Oldest first

      if (candles.length > 0) {
        console.log(`[Candles] Fetched ${candles.length} real candles from Twelve Data at ${fetchTs}`);
        return candles;
      }
    }
  } catch (e: any) {
    console.warn(`[Candles] Fetch error: ${e.message} at ${fetchTs}`);
  }

  return null;
}

// ============================================================
// TWELVE DATA REST API — FETCH LATEST PRICE ONLY
// ============================================================
async function fetchTwelveDataRESTPrice(): Promise<PriceSnapshot | null> {
  const apiKey = process.env.TWELVEDATA_API_KEY || "94cccf19822141cbb8e8323fbbfd0591";
  const fetchTs = new Date().toISOString();
  const cacheBust = Date.now();

  try {
    // Try to get both price and spread
    const url = `https://api.twelvedata.com/quote?apikey=${apiKey}&symbol=XAU/USD&format=JSON&_=${cacheBust}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json", "Cache-Control": "no-cache", "Pragma": "no-cache" },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      console.warn(`[Price] HTTP ${res.status} from Twelve Data REST at ${fetchTs}`);
      return null;
    }

    const data = await res.json();

    if (data) {
      const bid = data.bid !== undefined ? parseFloat(data.bid) : undefined;
      const ask = data.ask !== undefined ? parseFloat(data.ask) : undefined;
      const midCandidate = data.mid ?? data.price ?? data.close ??
        (Number.isFinite(bid) && Number.isFinite(ask) ? ((bid! + ask!) / 2) : undefined);
      const midPrice = parseFloat(String(midCandidate));
      const spread = normalizeSpread(data.spread, bid, ask);

      if (isValidPrice(midPrice, "TwelveData-REST")) {
        console.log(`[Price] Twelve Data REST: MID=${midPrice.toFixed(2)}, Spread=${spread.toFixed(2)} at ${fetchTs}`);
        return {
          midPrice,
          spread: spread > 0 ? spread : currentSpread,
          source: "TwelveData-REST",
          fetchedAt: Date.now(),
          providerTimestamp: parseProviderTimestamp(data.timestamp ?? data.datetime ?? data.date)
        };
      }
    }

    // Fallback: try time_series endpoint
    const tsUrl = `https://api.twelvedata.com/time_series?apikey=${apiKey}&interval=1min&symbol=XAU/USD&outputsize=1&format=JSON&_=${cacheBust}`;
    const tsRes = await fetch(tsUrl, {
      method: "GET",
      headers: { "Accept": "application/json", "Cache-Control": "no-cache", "Pragma": "no-cache" },
      signal: AbortSignal.timeout(5000)
    });

    if (tsRes.ok) {
      const tsData = await tsRes.json();
      if (tsData && tsData.values && tsData.values.length > 0) {
        const midPrice = parseFloat(tsData.values[0].close);
        if (isValidPrice(midPrice, "TwelveData-REST-time_series")) {
          console.log(`[Price] Twelve Data REST (time_series): MID=${midPrice.toFixed(2)} at ${fetchTs}`);
          return {
            midPrice,
            spread: currentSpread,
            source: "TwelveData-REST-time_series",
            fetchedAt: Date.now(),
            providerTimestamp: parseProviderTimestamp(tsData.values[0].datetime)
          };
        }
      }
    }
  } catch (e: any) {
    console.warn(`[Price] REST fetch error: ${e.message} at ${fetchTs}`);
  }

  return null;
}

// ============================================================
// CANDLE CACHE — Real candles from Twelve Data
// ============================================================
let cachedRealCandles: Candle[] | null = null;
let cachedCandlesTimestamp = 0;
const CANDLE_CACHE_MAX_AGE_MS = getPositiveNumberEnv("XAUUSD_CANDLE_CACHE_MS", 10000);

async function getRealCandles(forceRefresh = false): Promise<Candle[] | null> {
  const now = Date.now();

  // Use cache if fresh
  if (!forceRefresh && cachedRealCandles && (now - cachedCandlesTimestamp) < CANDLE_CACHE_MAX_AGE_MS) {
    return cachedRealCandles;
  }

  // Fetch fresh candles
  const candles = await fetchTwelveDataCandles("1min", 150);
  if (candles && candles.length > 0) {
    cachedRealCandles = candles;
    cachedCandlesTimestamp = now;
    return candles;
  }

  // Return stale cache if available
  if (cachedRealCandles) {
    console.warn("[Candles] Using stale cached candles");
    return cachedRealCandles;
  }

  return null;
}

// ============================================================
// DATABASE PERSISTENCE (unchanged from original)
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
        console.warn("Could not seed signals-db.json to /tmp:", err);
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
        } catch (e) { }
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
  } catch (err) {
    // Already deleted
  }
}

export function saveSignalsToDB(active: Signal, history: Signal[]) {
  const dbFile = getDbFilePathForEngine();
  try {
    const tempFile = dbFile + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify({ activeLiveSignal: active, activeHistorySignals: history }, null, 2), "utf-8");
    fs.renameSync(tempFile, dbFile);
  } catch (err) {
    console.error("[Perseus DB] Error writing signals database:", err);
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
    console.error("[Perseus DB] Error reading signals database:", err);
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
    console.error("[Perseus DB] Failed to sync signals memory state from DB:", err);
  }
}

export async function updateSignalCommentary(signalId: string, commentary: string) {
  const lockAcquired = await acquireFileLockAsync();
  try {
    syncSignalsFromDB();
    if (activeLiveSignal && activeLiveSignal.id === signalId) {
      activeLiveSignal.commentary = commentary;
    } else {
      const histItem = activeHistorySignals.find(s => s.id === signalId);
      if (histItem) {
        histItem.commentary = commentary;
      }
    }
    saveSignalsToDB(activeLiveSignal, activeHistorySignals);
  } catch (err) {
    console.error("[Perseus Engine] Failed to update signal commentary:", err);
  } finally {
    if (lockAcquired) releaseFileLock();
  }
}

// Restore from DB on startup
const dbState = loadSignalsFromDB();
if (dbState.active && dbState.history) {
  activeLiveSignal = dbState.active;
  activeHistorySignals = dbState.history;
  console.log(`[Perseus Core] Loaded signal state from DB: Active=${activeLiveSignal.id}, History=${activeHistorySignals.length}`);
}

// ============================================================
// ASYNC LOCK FOR ENGINE
// ============================================================
class AsyncLock {
  private promise: Promise<void> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void = () => { };
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
let activeEngineRun: Promise<boolean> | null = null;

// ============================================================
// FALLBACK MARKET PARAMS — Only when ALL sources fail
// NOW INCLUDES isFallbackPrice FLAG
// ============================================================
function generateFallbackParams(lastValidParams: MarketParams, reason = "Live price feed unavailable"): MarketParams {
  const previousTimestamp = lastValidParams.priceTimestamp || lastValidParams.lastUpdated || new Date(0).toISOString();
  const previousAgeMs = Date.now() - new Date(previousTimestamp).getTime();

  console.warn("[Fallback] Generating fallback params from last valid state — isFallbackPrice: true");

  return {
    ...lastValidParams,
    lastUpdated: new Date().toISOString(),
    priceSource: lastValidParams.priceSource ? `${lastValidParams.priceSource}-STALE` : "FALLBACK",
    priceTimestamp: previousTimestamp,
    priceAgeMs: Number.isFinite(previousAgeMs) ? Math.max(0, previousAgeMs) : LIVE_PRICE_MAX_AGE_MS + 1,
    feedHealth: lastValidParams.currentQuote > 0 ? "STALE" : "FALLBACK",
    validation: buildValidationInfo(reason, false, false, lastValidParams.currentQuote || undefined),
    isFallbackPrice: true,
    oscillatorState: lastValidParams.oscillatorState || "NEUTRAL (FALLBACK)",
    spread: currentSpread
  };
}

// ============================================================
// SIGNAL CREATION — Uses REAL candles from Twelve Data
// ============================================================
function createNewLiveSignal(price: number, candles: Candle[]): Signal {
  const activeCandles = candles && candles.length > 0 ? candles : [];
  const currentClose = price;

  const closePointsList = activeCandles.map(b => b.close);
  const highPointsList = activeCandles.map(b => b.high);
  const lowPointsList = activeCandles.map(b => b.low);

  const fullRsi = calculateRSI(closePointsList, 14);
  const fullEma50 = calculateEMA(closePointsList, 50);
  const fullEma200 = calculateEMA(closePointsList, 200);
  const bb = calculateBollingerBands(closePointsList, 20, 2);
  const vwap = calculateVWAP(activeCandles);
  const stoch = calculateStochastic(highPointsList, lowPointsList, closePointsList, 14, 3, 3);

  const rsi = fullRsi.length > 0 ? fullRsi[fullRsi.length - 1] : 50;
  const ema50 = fullEma50.length > 0 ? fullEma50[fullEma50.length - 1] : currentClose;
  const ema200 = fullEma200.length > 0 ? fullEma200[fullEma200.length - 1] : currentClose;
  const currentVWAP = vwap.length > 0 ? vwap[vwap.length - 1] : currentClose;
  const bbUpper = bb.upper.length > 0 ? bb.upper[bb.upper.length - 1] : currentClose;
  const bbLower = bb.lower.length > 0 ? bb.lower[bb.lower.length - 1] : currentClose;
  const kLine = stoch.k.length > 0 ? stoch.k[stoch.k.length - 1] : 50;
  const prevKLine = stoch.k.length > 1 ? stoch.k[stoch.k.length - 2] : 50;
  const dLine = stoch.d.length > 0 ? stoch.d[stoch.d.length - 1] : 50;

  let directionBias: "BUY" | "SELL" = "BUY";
  let strategy = "";
  let commentary = "";
  let confidence = 85;

  const currentOpen = activeCandles.length > 0 ? activeCandles[activeCandles.length - 1].open : currentClose;
  const isGreenCandle = currentClose >= currentOpen;
  const isRedCandle = currentClose < currentOpen;

  const touchVwapDist = Math.abs(currentClose - currentVWAP) / currentVWAP;
  const isVwapRejectionBuy = currentClose > currentVWAP && touchVwapDist < 0.0015 && isGreenCandle;
  const isVwapRejectionSell = currentClose < currentVWAP && touchVwapDist < 0.0015 && isRedCandle;

  const recent30 = activeCandles.slice(Math.max(activeCandles.length - 40, 0));
  const swingHigh = recent30.length > 0 ? Math.max(...recent30.map(c => c.high)) : currentClose + 10;
  const swingLow = recent30.length > 0 ? Math.min(...recent30.map(c => c.low)) : currentClose - 10;
  const fibo050 = swingHigh - (swingHigh - swingLow) * 0.500;
  const fibo0618 = swingHigh - (swingHigh - swingLow) * 0.618;
  const fibo0786_Buy = swingHigh - (swingHigh - swingLow) * 0.786;
  const fibo0786_Sell = swingLow + (swingHigh - swingLow) * 0.786;

  const isTrendBullish = ema50 > ema200;
  const isTrendBearish = ema50 < ema200;
  const inFiboBuyZone = currentClose <= fibo050 && currentClose >= fibo0618;
  const isFiboGoldenBuy = isTrendBullish && inFiboBuyZone;
  const inFiboSellZone = currentClose >= fibo050 && currentClose <= fibo0618;
  const isFiboGoldenSell = isTrendBearish && inFiboSellZone;

  const isBBExtremeBuy = currentClose <= bbLower && rsi > 30 && rsi < 45;
  const isBBExtremeSell = currentClose >= bbUpper && rsi < 70 && rsi > 55;

  const sweptLows = currentClose > swingLow && currentClose < swingLow + 2.0 && isGreenCandle;
  const sweptHighs = currentClose < swingHigh && currentClose > swingHigh - 2.0 && isRedCandle;

  const isStochMomentumBuy = dLine > 40 && kLine < 30 && kLine > prevKLine;
  const isStochMomentumSell = dLine < 60 && kLine > 70 && kLine < prevKLine;

  // Strategy hierarchy (unchanged logic)
  if (isVwapRejectionBuy) {
    directionBias = "BUY";
    strategy = "VWAP Rejection + Momentum (BUY)";
    confidence = 94;
    commentary = `Harga mensweep area support intraday Institusi VWAP ($${currentVWAP.toFixed(2)}) dan menolak turun. Volume akumulasi terdeteksi ditarik ke atas memvalidasi tren.`;
  } else if (isVwapRejectionSell) {
    directionBias = "SELL";
    strategy = "VWAP Rejection + Momentum (SELL)";
    confidence = 94;
    commentary = `Harga gagal menembus resistensi rata-rata VWAP ($${currentVWAP.toFixed(2)}). Smart money bereaksi keras melindungi zona premium mereka.`;
  } else if (isFiboGoldenBuy) {
    directionBias = "BUY";
    strategy = "Fibonacci Golden Zone Crossover (BUY)";
    confidence = 96;
    commentary = `Koreksi mendarat tepat pada Golden Ratio Fibonacci 0.618-0.500 ($${fibo0618.toFixed(2)}). EMA50 di atas EMA200 mengonfirmasi tren naik.`;
  } else if (isFiboGoldenSell) {
    directionBias = "SELL";
    strategy = "Fibonacci Golden Zone Crossover (SELL)";
    confidence = 96;
    commentary = `Rebound minor mendarat di Golden Ratio Fibo (0.500-0.618). Bear dominan di EMA50 menekan harga lebih jauh.`;
  } else if (isBBExtremeBuy) {
    directionBias = "BUY";
    strategy = "Bollinger Extremes + RSI Divergence (BUY)";
    confidence = 92;
    commentary = `Candle menembus lower Bollinger Band ($${bbLower.toFixed(2)}) dengan RSI perlahan menanjak dari dasar.`;
  } else if (isBBExtremeSell) {
    directionBias = "SELL";
    strategy = "Bollinger Extremes + RSI Divergence (SELL)";
    confidence = 92;
    commentary = `Over-extension melampaui upper Bollinger Band ($${bbUpper.toFixed(2)}) diiringi jenuhnya daya beli.`;
  } else if (sweptLows) {
    directionBias = "BUY";
    strategy = "Liquidity Sweep SMC + MSS (BUY)";
    confidence = 97;
    commentary = `Likuiditas ritel di batas Low ($${swingLow.toFixed(2)}) telah disapu institusi. Market Structure Shift Bullish tervalidasi.`;
  } else if (sweptHighs) {
    directionBias = "SELL";
    strategy = "Liquidity Sweep SMC + MSS (SELL)";
    confidence = 97;
    commentary = `Institusi menelan Stop Loss pembeli melampaui Swing High ($${swingHigh.toFixed(2)}), membanting arah (MSS Bear).`;
  } else if (isStochMomentumBuy) {
    directionBias = "BUY";
    strategy = "Multi-Timeframe Stochastic Momentum (BUY)";
    confidence = 90;
    commentary = `Koreksi lokal (oversold stochastic menelikung ke atas) memberi diskon searah momentum utama.`;
  } else if (isStochMomentumSell) {
    directionBias = "SELL";
    strategy = "Multi-Timeframe Stochastic Momentum (SELL)";
    confidence = 90;
    commentary = `Ayunan naik terhambat di zona Overbought Stoch saat tren utama memandu ke bawah.`;
  } else {
    if (kLine > 78 && currentClose < ema50) {
      directionBias = "SELL";
      strategy = "Stochastic Premium Scalping Rejection (SELL)";
      confidence = 85;
      commentary = `Overbought (${kLine.toFixed(0)}) di kala tren melandai. Risiko rasio cuan/loss terjaga istimewa.`;
    } else if (kLine < 22 && currentClose > ema50) {
      directionBias = "BUY";
      strategy = "Stochastic Discount Scalping Bounce (BUY)";
      confidence = 85;
      commentary = `Oversold (${kLine.toFixed(0)}) selagi ombak kuat menahan naik. Buy kilat.`;
    } else {
      directionBias = isGreenCandle ? "SELL" : "BUY";
      strategy = "Consolidation Rejection (Mean Reversion)";
      confidence = 82;
      commentary = `Ranging Flat Momentum (RSI netral ${rsi.toFixed(1)}). Scalping ekstrem kilat ping-pong.`;
    }
  }

  const minStopLoss = 3.0;
  let slLimit = 0;

  if (strategy.includes("Fibonacci") && directionBias === "BUY") {
    slLimit = fibo0786_Buy - 1.2;
  } else if (strategy.includes("Fibonacci") && directionBias === "SELL") {
    slLimit = fibo0786_Sell + 1.2;
  } else {
    const slDistance = Math.max(minStopLoss, currentClose * 0.001);
    slLimit = directionBias === "BUY" ? currentClose - slDistance : currentClose + slDistance;
  }

  const pureDiff = Math.max(2.5, Math.abs(currentClose - slLimit));
  const tp1Distance = Math.max(pureDiff * 1.5, 4.0);
  const tp2Distance = Math.max(pureDiff * 2.8, 7.5);
  const tp3Distance = Math.max(pureDiff * 4.5, 12.0);

  const tpTarget1 = directionBias === "BUY" ? currentClose + tp1Distance : currentClose - tp1Distance;
  const tpTarget2 = directionBias === "BUY" ? currentClose + tp2Distance : currentClose - tp2Distance;
  const tpTarget3 = directionBias === "BUY" ? currentClose + tp3Distance : currentClose - tp3Distance;

  return {
    id: `sig-perseus-live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    symbol: "XAUUSD",
    type: directionBias,
    timeframe: "M15",
    time: Date.now(),
    entryPrice: Number(currentClose.toFixed(2)),
    stopLoss: Number(slLimit.toFixed(2)),
    takeProfit1: Number(tpTarget1.toFixed(2)),
    takeProfit2: Number(tpTarget2.toFixed(2)),
    takeProfit3: Number(tpTarget3.toFixed(2)),
    status: "ACTIVE",
    pips: 0,
    confidence: confidence,
    strategy: strategy,
    commentary: `Arahan Eksekusi Scalping: ${directionBias === "BUY" ? "🟢 ENTRY BUY" : "🔴 ENTRY SELL"} (Akurasi: ${confidence}%)\n\n🛠 Analisa Teknikal:\n${commentary}\n\n🛡 Manajemen Risiko:\n- 🛑 SL: $${slLimit.toFixed(2)}\n- 🎯 TP1: $${tpTarget1.toFixed(2)}\n- 🎯 TP2: $${tpTarget2.toFixed(2)}\nRR Asimetris. Hindari FOMO!`
  };
}

// ============================================================
// CORE MARKET DATA PROCESSOR — NOW USING REAL CANDLES
// ============================================================
interface ResolvePriceOptions {
  validateAgainstRest?: boolean;
  requireFresh?: boolean;
}

function getFreshWsSnapshot(): PriceSnapshot | null {
  if (!latestWsSnapshot || !isSnapshotFresh(latestWsSnapshot, LIVE_WS_MAX_AGE_MS)) {
    if (latestWsSnapshot) {
      console.warn(`[Price] Ignoring stale WS tick (${snapshotAgeMs(latestWsSnapshot)}ms old)`);
    }
    return null;
  }

  if (!isValidPrice(latestWsSnapshot.midPrice, "TwelveData-WS")) {
    return null;
  }

  return latestWsSnapshot;
}

async function resolveLivePriceSnapshot(options: ResolvePriceOptions = {}): Promise<PriceSnapshot | null> {
  let candidate = getFreshWsSnapshot();
  let validation = buildValidationInfo(
    candidate ? "Fresh WebSocket tick accepted." : "No fresh WebSocket tick available.",
    !!candidate,
    false,
    candidate ? adjustMidPriceForDisplay(candidate.midPrice, candidate.spread) : undefined
  );

  if (!candidate || options.validateAgainstRest) {
    const restSnapshot = await fetchTwelveDataRESTPrice();

    if (restSnapshot) {
      const restDisplay = adjustMidPriceForDisplay(restSnapshot.midPrice, restSnapshot.spread);

      if (!candidate) {
        candidate = restSnapshot;
        validation = buildValidationInfo(
          "Fresh REST quote accepted because WebSocket was unavailable or stale.",
          true,
          true,
          restDisplay,
          restDisplay
        );
      } else {
        const candidateDisplay = adjustMidPriceForDisplay(candidate.midPrice, candidate.spread);
        const diff = Math.abs(candidateDisplay - restDisplay);

        if (diff > PRICE_DRIFT_TOLERANCE_USD) {
          await new Promise(resolve => setTimeout(resolve, 750));
          const retryRest = await fetchTwelveDataRESTPrice();
          const refreshedRest = retryRest || restSnapshot;
          const refreshedWs = getFreshWsSnapshot();
          const refreshedCandidate = refreshedWs || refreshedRest;
          const refreshedDisplay = adjustMidPriceForDisplay(refreshedCandidate.midPrice, refreshedCandidate.spread);
          const refreshedRestDisplay = adjustMidPriceForDisplay(refreshedRest.midPrice, refreshedRest.spread);
          const refreshedDiff = Math.abs(refreshedDisplay - refreshedRestDisplay);

          candidate = refreshedDiff <= PRICE_DRIFT_TOLERANCE_USD ? refreshedCandidate : refreshedRest;
          validation = buildValidationInfo(
            refreshedDiff <= PRICE_DRIFT_TOLERANCE_USD
              ? "Price drift exceeded tolerance; feed refreshed and reconciled before continuing."
              : "Price drift exceeded tolerance after refresh; using newest REST quote and marking validation warning.",
            refreshedDiff <= PRICE_DRIFT_TOLERANCE_USD,
            true,
            adjustMidPriceForDisplay(candidate.midPrice, candidate.spread),
            refreshedRestDisplay
          );
        } else {
          validation = buildValidationInfo(
            "WebSocket quote validated against fresh REST quote.",
            true,
            false,
            candidateDisplay,
            restDisplay
          );
        }
      }
    } else if (options.requireFresh) {
      validation = buildValidationInfo(
        candidate ? "REST validation unavailable; using fresh WebSocket tick." : "REST validation unavailable and no live price tick exists.",
        !!candidate,
        false,
        candidate ? adjustMidPriceForDisplay(candidate.midPrice, candidate.spread) : undefined
      );
    }
  }

  if (!candidate) {
    activeMarketParams = generateFallbackParams(activeMarketParams, validation.reason);
    return null;
  }

  if (options.requireFresh && !isSnapshotFresh(candidate, LIVE_PRICE_MAX_AGE_MS)) {
    activeMarketParams = generateFallbackParams(activeMarketParams, "Resolved price snapshot is stale.");
    return null;
  }

  candidate.validation = validation;
  return candidate;
}

async function _processPerseusMarketDataInternal(options: { forceFresh?: boolean; validateAgainstRest?: boolean; forceCandles?: boolean } = {}): Promise<boolean> {
  syncSignalsFromDB();

  const snapshot = await resolveLivePriceSnapshot({
    validateAgainstRest: options.validateAgainstRest || options.forceFresh,
    requireFresh: options.forceFresh
  });

  if (!snapshot) {
    console.error("[Price] CRITICAL: No live XAUUSD price available. Trading state machine skipped.");
    return false;
  }

  let midPrice: number | null = snapshot.midPrice;
  let priceSource = snapshot.source;
  let spread = snapshot.spread;

  // STEP 1: Try WebSocket (primary)
  if (false && latestWsPrice !== null && isValidPrice(latestWsPrice, "TwelveData-WS")) {
    midPrice = latestWsPrice;
    priceSource = "TwelveData-WS";
  }

  // STEP 2: Try REST API (fallback)
  if (midPrice === null) {
    const restResult = await fetchTwelveDataRESTPrice();
    if (restResult && isValidPrice(restResult.midPrice, "TwelveData-REST")) {
      midPrice = restResult.midPrice;
      priceSource = "TwelveData-REST";
      spread = restResult.spread;
    }
  }

  // STEP 3: Retry REST once more after 1 second delay
  if (midPrice === null) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const retryResult = await fetchTwelveDataRESTPrice();
    if (retryResult && isValidPrice(retryResult.midPrice, "TwelveData-REST-Retry")) {
      midPrice = retryResult.midPrice;
      priceSource = "TwelveData-REST-Retry";
      spread = retryResult.spread;
    }
  }

  // STEP 4: Use last valid MID price if available
  if (midPrice === null && activeMarketParams.rawMidPrice && activeMarketParams.rawMidPrice > 0) {
    midPrice = activeMarketParams.rawMidPrice;
    priceSource = "TwelveData-CACHED";
    console.warn(`[Price] Using cached MID price: ${midPrice.toFixed(2)}`);
  }

  // STEP 5: NO PRICE AVAILABLE — exit gracefully
  if (midPrice === null) {
    console.error(`[Price] CRITICAL: No price available. Skipping tick.`);
    return false;
  }

  // Update spread if we got a new one
  if (spread > 0 && spread < 10 && spread !== currentSpread) {
    currentSpread = spread;
  }

  // Add to price history for validation
  addPriceToHistory(midPrice, priceSource);

  // Convert MID to display price
  const displayPrice = adjustPriceForDisplay(midPrice);

  console.log(`[Price] Source: ${priceSource} | MID: ${midPrice.toFixed(2)} | Display (${DISPLAY_PRICE_MODE}): ${displayPrice.toFixed(2)} | Spread: ${currentSpread.toFixed(2)}`);

  // STEP 6: Get REAL candles from Twelve Data
  const realCandles = await getRealCandles(options.forceCandles || options.forceFresh);

  if (!realCandles || realCandles.length < 20) {
    console.error("[Candles] Insufficient real candles for technical analysis. Using fallback params.");
    activeMarketParams = generateFallbackParams(activeMarketParams, "Insufficient fresh candle history for technical analysis.");
    return false;
  }

  // STEP 7: Calculate technical indicators from REAL candles
  const closePointsList = realCandles.map(b => b.close);
  const highPointsList = realCandles.map(b => b.high);
  const lowPointsList = realCandles.map(b => b.low);

  const fullRsi = calculateRSI(closePointsList, 14);
  const fullEma20 = calculateEMA(closePointsList, 20);
  const fullEma50 = calculateEMA(closePointsList, 50);
  const fullEma200 = calculateEMA(closePointsList, 200);
  const fullAtr = calculateATR(highPointsList, lowPointsList, closePointsList, 14);
  const fullBb = calculateBollingerBands(closePointsList, 20, 2);

  const finalRsi = Number(fullRsi[fullRsi.length - 1].toFixed(1));
  const finalEma20 = Number(fullEma20[fullEma20.length - 1].toFixed(2));
  const finalEma50 = Number(fullEma50[fullEma50.length - 1].toFixed(2));
  const finalEma200 = Number(fullEma200[fullEma200.length - 1].toFixed(2));
  const finalAtr = Number(fullAtr[fullAtr.length - 1].toFixed(2));

  // Daily calculations from real candles
  const epochNow = Date.now();
  const millisInDay = 24 * 60 * 60 * 1000;
  const pastDayTicks = realCandles.filter(bar => epochNow - bar.time <= millisInDay);
  const dailyOpenVal = pastDayTicks.length > 0 ? pastDayTicks[0].open : realCandles[0].open;
  const dailyHighVal = pastDayTicks.length > 0 ? Math.max(...pastDayTicks.map(b => b.high)) : displayPrice * 1.005;
  const dailyLowVal = pastDayTicks.length > 0 ? Math.min(...pastDayTicks.map(b => b.low)) : displayPrice * 0.995;

  const absoluteDiff = Number((displayPrice - dailyOpenVal).toFixed(2));
  const changePercentage = Number(((absoluteDiff / dailyOpenVal) * 100).toFixed(2));

  let oscillatorStatus = "NEUTRAL";
  if (finalRsi > 68) oscillatorStatus = "NEUTRAL / OVERBOUGHT";
  else if (finalRsi < 32) oscillatorStatus = "OVERSOLD";
  else if (displayPrice > finalEma50) oscillatorStatus = "BULLISH STRENGTH";
  else oscillatorStatus = "BEARISH REJECTION";

  const computedQuant = generateQuantMetrics(realCandles, displayPrice);
  const updateTs = new Date().toISOString();
  const priceTimestamp = snapshot.providerTimestamp || new Date(snapshot.fetchedAt).toISOString();
  const priceAgeMs = snapshotAgeMs(snapshot);

  activeMarketParams = {
    oscillatorState: oscillatorStatus,
    rsi: finalRsi,
    ema20: finalEma20,
    ema50: finalEma50,
    ema200: finalEma200,
    spread: currentSpread,
    currentQuote: displayPrice,
    dailyHigh: Number(dailyHighVal.toFixed(2)),
    dailyLow: Number(dailyLowVal.toFixed(2)),
    openPrice: Number(dailyOpenVal.toFixed(2)),
    priceChange: absoluteDiff,
    priceChangePercent: changePercentage,
    volume: realCandles[realCandles.length - 1]?.volume || 148500,
    lastUpdated: updateTs,
    priceSource: priceSource,
    priceTimestamp,
    priceAgeMs,
    feedHealth: priceAgeMs <= LIVE_PRICE_MAX_AGE_MS ? "LIVE" : "STALE",
    validation: snapshot.validation || buildValidationInfo("Live price accepted.", true, false, displayPrice),
    rawMidPrice: midPrice,
    isFallbackPrice: false,
    quant: computedQuant
  };

  // STEP 8: Signal State Machine (unchanged logic)
  if (activeLiveSignal.id === "sig-perseus-initial" || activeLiveSignal.status !== "ACTIVE") {
    activeLiveSignal = createNewLiveSignal(displayPrice, realCandles);
    saveSignalsToDB(activeLiveSignal, activeHistorySignals);
    console.log(`[Signal] New signal: ${activeLiveSignal.type} @ ${activeLiveSignal.entryPrice}`);
  } else {
    let isClosed = false;
    let closeStatus: "WIN" | "WIN_TP1" | "LOSS" | "INVALID" = "LOSS";
    let executionPrice = displayPrice;
    let profitPips = 0;

    if (activeLiveSignal.type === "BUY") {
      if (displayPrice >= activeLiveSignal.takeProfit1 && !activeLiveSignal.tp1Hit) {
        activeLiveSignal.tp1Hit = true;
        activeLiveSignal.stopLoss = activeLiveSignal.entryPrice;
        saveSignalsToDB(activeLiveSignal, activeHistorySignals);
        console.log(`[Signal] TP1 Hit — SL moved to Breakeven: ${activeLiveSignal.entryPrice}`);
      }
      if (displayPrice <= activeLiveSignal.stopLoss) {
        isClosed = true;
        if (activeLiveSignal.tp1Hit) {
          closeStatus = "WIN_TP1";
          executionPrice = activeLiveSignal.stopLoss;
          profitPips = 10;
        } else {
          closeStatus = "LOSS";
          executionPrice = activeLiveSignal.stopLoss;
          profitPips = -Math.round(Math.abs(activeLiveSignal.entryPrice - activeLiveSignal.stopLoss) * 10);
        }
      } else if (displayPrice >= activeLiveSignal.takeProfit2) {
        isClosed = true;
        closeStatus = "WIN";
        executionPrice = activeLiveSignal.takeProfit2;
        profitPips = Math.round(Math.abs(activeLiveSignal.takeProfit2 - activeLiveSignal.entryPrice) * 10);
      }
    } else {
      if (displayPrice <= activeLiveSignal.takeProfit1 && !activeLiveSignal.tp1Hit) {
        activeLiveSignal.tp1Hit = true;
        activeLiveSignal.stopLoss = activeLiveSignal.entryPrice;
        saveSignalsToDB(activeLiveSignal, activeHistorySignals);
        console.log(`[Signal] TP1 Hit (SELL) — SL moved to Breakeven: ${activeLiveSignal.entryPrice}`);
      }
      if (displayPrice >= activeLiveSignal.stopLoss) {
        isClosed = true;
        if (activeLiveSignal.tp1Hit) {
          closeStatus = "WIN_TP1";
          executionPrice = activeLiveSignal.stopLoss;
          profitPips = 10;
        } else {
          closeStatus = "LOSS";
          executionPrice = activeLiveSignal.stopLoss;
          profitPips = -Math.round(Math.abs(activeLiveSignal.stopLoss - activeLiveSignal.entryPrice) * 10);
        }
      } else if (displayPrice <= activeLiveSignal.takeProfit2) {
        isClosed = true;
        closeStatus = "WIN";
        executionPrice = activeLiveSignal.takeProfit2;
        profitPips = Math.round(Math.abs(activeLiveSignal.entryPrice - activeLiveSignal.takeProfit2) * 10);
      }
    }

    if (isClosed) {
      activeLiveSignal.status = closeStatus;
      activeLiveSignal.pips = profitPips;
      activeLiveSignal.time = Date.now();

      if (closeStatus === "WIN") {
        activeLiveSignal.commentary = `🟢 TP2 TERCAPAI PENUH ($${executionPrice.toFixed(2)}) — Profit: +${profitPips} pips.`;
      } else if (closeStatus === "WIN_TP1") {
        activeLiveSignal.commentary = `🟢 TP1 TERCAPAI / BREAKEVEN ($${executionPrice.toFixed(2)}) — Profit: +${profitPips} pips.`;
      } else {
        activeLiveSignal.commentary = `🔴 STOP LOSS ($${executionPrice.toFixed(2)}) — Loss: ${profitPips} pips.`;
      }

      activeHistorySignals.unshift({ ...activeLiveSignal });
      console.log(`[Signal] Closed: ${closeStatus}, Pips: ${profitPips}`);

      activeLiveSignal = createNewLiveSignal(displayPrice, realCandles);
      saveSignalsToDB(activeLiveSignal, activeHistorySignals);
    }
  }

  return true;
}

// ============================================================
// PUBLIC API — Thread-safe processing
// ============================================================
export async function processPerseusMarketData(options: { forceFresh?: boolean; validateAgainstRest?: boolean; forceCandles?: boolean } = {}): Promise<boolean> {
  if (activeEngineRun && !options.forceFresh && !options.validateAgainstRest && !options.forceCandles) {
    return activeEngineRun;
  }

  activeEngineRun = (async () => {
    engineCalculationInProgress = true;
    const release = await engineLock.acquire();
    const fileLockAcquired = await acquireFileLockAsync();
    try {
      syncSignalsFromDB();
      return await _processPerseusMarketDataInternal(options);
    } finally {
      if (fileLockAcquired) releaseFileLock();
      release();
      engineCalculationInProgress = false;
    }
  })();

  try {
    return await activeEngineRun;
  } finally {
    activeEngineRun = null;
  }
}

// ============================================================
// WEBSOCKET CLIENT
// ============================================================
import { WebSocket as WsClient } from "ws";

let wsClient: WsClient | null = null;
export let latestWsPrice: number | null = null;
let latestWsSnapshot: PriceSnapshot | null = null;

export function initTwelveDataWebSocket() {
  const apiKey = process.env.TWELVEDATA_API_KEY || "94cccf19822141cbb8e8323fbbfd0591";

  if (!apiKey || apiKey.trim() === "") {
    console.error("[TwelveData WS] No API Key configured. Will rely on REST polling.");
    return;
  }

  try {
    wsClient = new WsClient(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);

    wsClient.on('open', () => {
      console.log("[TwelveData WS] Connected — Subscribing to XAU/USD");
      wsClient!.send(JSON.stringify({
        action: "subscribe",
        params: { symbols: "XAU/USD" }
      }));
    });

    wsClient.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.event === "price" && parsed.price) {
          const newPrice = parseFloat(parsed.price);
          if (isValidPrice(newPrice, "TwelveData-WS")) {
            latestWsPrice = newPrice;
            _triggerWssBroadcast();
          }
        }
      } catch (err) {
        // Ignore parse errors
      }
    });

    wsClient.on('close', () => {
      console.log("[TwelveData WS] Disconnected — Reconnecting in 5s...");
      latestWsPrice = null;
      setTimeout(initTwelveDataWebSocket, 5000);
    });

    wsClient.on('error', (err) => {
      console.error("[TwelveData WS] Error:", err.message);
      latestWsPrice = null;
    });
  } catch (err) {
    console.error("[TwelveData WS] Init failed:", err);
    latestWsPrice = null;
  }
}

let lastEngineProcTime = 0;
function _triggerWssBroadcast() {
  const now = Date.now();
  if (now - lastEngineProcTime >= 950) {
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
    });
  }
}

// ============================================================
// AI SCAN TRIGGER
// ============================================================
async function _triggerAISignalScanInternal(forceRetry = false): Promise<Signal> {
  await _processPerseusMarketDataInternal();

  if (activeLiveSignal && activeLiveSignal.id !== "sig-perseus-initial" && activeLiveSignal.status === "ACTIVE") {
    if (!forceRetry) {
      console.log(`[Scan] Reusing active signal: ${activeLiveSignal.id}`);
      return activeLiveSignal;
    } else {
      console.log(`[Scan] Force rescan — closing: ${activeLiveSignal.id}`);
      activeLiveSignal.status = "INVALID";
      activeLiveSignal.commentary = "⚠️ SYSTEM RESYNC: Posisi dianulir melalui audit pemindaian ulang.";
      activeLiveSignal.time = Date.now();
      activeHistorySignals.unshift({ ...activeLiveSignal });
    }
  }

  const realCandles = await getRealCandles();
  const candles = realCandles || [];
  const price = activeMarketParams.currentQuote;

  const newSignal = createNewLiveSignal(price, candles);
  activeLiveSignal = newSignal;
  saveSignalsToDB(activeLiveSignal, activeHistorySignals);
  console.log(`[Scan] New signal: ${activeLiveSignal.type} @ ${activeLiveSignal.entryPrice}`);
  return activeLiveSignal;
}

export async function triggerAISignalScan(forceRetry = false): Promise<Signal> {
  const release = await engineLock.acquire();
  const fileLockAcquired = await acquireFileLockAsync();
  try {
    syncSignalsFromDB();
    return await _triggerAISignalScanInternal(forceRetry);
  } finally {
    if (fileLockAcquired) releaseFileLock();
    release();
  }
}

// ============================================================
// FETCHERS
// ============================================================
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

let lastRequestTickTime = 0;

export async function processPerseusMarketDataOnRequest(): Promise<void> {
  const now = Date.now();
  if (now - lastRequestTickTime >= 4800) {
    lastRequestTickTime = now;
    await processPerseusMarketData();
  }
}

// ============================================================
// STARTUP
// ============================================================
const isBuildProcess = process.argv.some(arg => arg.endsWith('vite') && process.argv.includes('build')) || process.argv.includes('esbuild');

if (!isBuildProcess) {
  processPerseusMarketData();
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    setTimeout(initTwelveDataWebSocket, 2000);
  }
}
