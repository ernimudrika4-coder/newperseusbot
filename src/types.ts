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

export interface QuantParams {
  cvdValue: number;
  cvdBarData: number[];
  cvdDivergenceDetected: boolean;
  cvdDivergenceDirection: "BUY_REJECTED" | "SELL_REJECTED" | "NONE";
  ofiValue: number;
  ofiPercentile: number;
  ofiSignal: string;
  vpinValue: number;
  vpinStatus: "NORMAL" | "TOXIC" | "INFORMED";
  vpinBannedBuy: boolean;
  realizedKernelVol: number;
  noiseRatio: number;
  noiseFilterStatus: "CLEAN" | "LOW_QUALITY" | "NORMAL";
  twapValue: number;
  twapDeviationBps: number;
  twapPercentileState: "OVERBOUGHT" | "OVERSOLD" | "NORMAL";
  kalmanPrice: number;
  kalmanSlope: number;
  kalmanTrendState: "BULLISH" | "BEARISH" | "FLAT";
  hawkesAlpha: number;
  hawkesIntensity: number;
  hawkesRegime: "TRENDING" | "MEAN_REVERTING";
  crossAssetMatrix: {
    [source: string]: { [target: string]: number };
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
  lastUpdated?: string;
  quant?: QuantParams;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  previous: string;
  consensus: string;
  actual: string;
  goldSensitivity: string;
  rawDate?: string;
}

export interface CorrelationPair {
  symbol: string;
  name: string;
  price: string;
  change: string;
  correlation: string; // "STRONG INVERSE", "MODERATE INVERSE", etc.
  description: string;
  isPositive: boolean;
}

export interface PremiumTier {
  id: string;
  name: string;
  price: string;
  billing: string;
  popular: boolean;
  features: string[];
}
