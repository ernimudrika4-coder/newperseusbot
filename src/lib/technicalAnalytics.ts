export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(prices[i]); // Padding helper default
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  let prevEma = prices[0];
  ema.push(prevEma);
  for (let i = 1; i < prices.length; i++) {
    const nextEma = prices[i] * k + prevEma * (1 - k);
    ema.push(nextEma);
    prevEma = nextEma;
  }
  return ema;
}

export function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (prices.length < period) return new Array(prices.length).fill(50);
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = 0; i < period; i++) {
    rsi.push(50); // Initial padding
  }
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

export function calculateMACD(prices: number[]): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  const signalLine = calculateEMA(macdLine, 9);
  const histogram: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }
  return { macdLine, signalLine, histogram };
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const tr: number[] = [];
  if (closes.length === 0) return [];
  tr.push(highs[0] - lows[0]);
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hcp = Math.abs(highs[i] - closes[i - 1]);
    const lcp = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hcp, lcp));
  }
  
  const atr: number[] = [];
  if (tr.length < period) return new Array(closes.length).fill(1.5);
  
  let sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let avg = sum / period;
  for (let i = 0; i < period; i++) {
    atr.push(avg);
  }
  for (let i = period; i < tr.length; i++) {
    avg = (avg * (period - 1) + tr[i]) / period;
    atr.push(avg);
  }
  return atr;
}

export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2): { middle: number[]; upper: number[]; lower: number[] } {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(prices[i]);
      lower.push(prices[i]);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + multiplier * stdDev);
      lower.push(mean - multiplier * stdDev);
    }
  }
  return { middle, upper, lower };
}

export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTPV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    vwap.push(cumulativeTPV / cumulativeVolume);
  }
  return vwap;
}

export function calculateStochastic(highs: number[], lows: number[], closes: number[], period = 14, smoothK = 3, smoothD = 3): { k: number[], d: number[] } {
  const fastK: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      fastK.push(50);
    } else {
      const sliceHighs = highs.slice(i - period + 1, i + 1);
      const sliceLows = lows.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...sliceHighs);
      const lowestLow = Math.min(...sliceLows);
      
      if (highestHigh === lowestLow) {
        fastK.push(50);
      } else {
        const currentK = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        fastK.push(currentK);
      }
    }
  }
  
  const k = calculateSMA(fastK, smoothK);
  const d = calculateSMA(k, smoothD);
  return { k, d };
}

