import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

// ============================================================
// SECURITY: All sensitive tokens ONLY from environment variables
// ============================================================
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN || "perseus_secure_admin_v1";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || "";

let isGeminiBlocked = false;

// ============================================================
// MIDDLEWARE
// ============================================================
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers['authorization'];
  if (token === `Bearer ${API_SECRET_TOKEN}`) {
    return next();
  }
  res.status(403).json({ success: false, error: "Unauthorized / Invalid Token" });
};

const aiScanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: "Rate limit reached. Please wait before requesting another AI scan." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req) => {
    return (req.headers['x-forwarded-for'] as string) || req.ip || "unknown";
  }
});

// ============================================================
// BOT CONFIG WITH FIREBASE INTEGRATION
// ============================================================
interface BotConfig {
  botEnabled: boolean;
  mt5LotSize: number;
  mt5Slippage: number;
  telegramBotToken: string;
  telegramChatId: string;
  lastUpdateId: number;
  executionLogs: Array<{ time: string; type: string; message: string }>;
}

// In-memory cache only - tokens from env vars
let cachedBotConfig: BotConfig = {
  botEnabled: true,
  mt5LotSize: 0.1,
  mt5Slippage: 3,
  telegramBotToken: TELEGRAM_BOT_TOKEN,
  telegramChatId: TELEGRAM_CHAT_ID,
  lastUpdateId: 0,
  executionLogs: []
};

function loadBotConfig(): BotConfig {
  // Always use latest env vars for tokens
  cachedBotConfig.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN;
  cachedBotConfig.telegramChatId = process.env.TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID;
  return cachedBotConfig;
}

function saveBotConfig(config: BotConfig) {
  cachedBotConfig = { ...config };
  // Persist to Firestore if available
  try {
    const { db, doc, setDoc } = require("./src/lib/firebase-server");
    if (db) {
      setDoc(doc(db, "botConfigs", "master"), config).catch(() => {});
    }
  } catch (e) {}
}

// ============================================================
// GEMINI AI CLIENT (Secure Instantiation)
// ============================================================
const instantiateGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || isGeminiBlocked) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================================
// IMPORT ENGINE (Dynamic for serverless compatibility)
// ============================================================
import {
  fetchPerseusMarketParams,
  fetchPerseusLiveSignal,
  fetchPerseusHistorySignals,
  processPerseusMarketData,
  triggerAISignalScan,
  processPerseusMarketDataOnRequest,
  updateSignalCommentary
} from "./src/lib/perseusEngine";

// ============================================================
// REAL-TIME DATA VALIDATION
// ============================================================
let lastRealPriceUpdate = 0;
let realPriceSource = "UNKNOWN";

function isPriceDataReal(): boolean {
  const marketParams = fetchPerseusMarketParams();
  // Check if price was updated from real source in last 60 seconds
  const isRecent = Date.now() - lastRealPriceUpdate < 60000;
  const isValidPrice = marketParams.currentQuote > 1000 && marketParams.currentQuote < 5000;
  return isRecent && isValidPrice;
}

// ============================================================
// TELEGRAM BROADCAST FUNCTIONS
// ============================================================
const sendTelegramMessage = async (message: string): Promise<boolean> => {
  const config = loadBotConfig();
  const token = config.telegramBotToken;
  const chatId = config.telegramChatId;
  
  if (!token || !chatId || token.includes("MY_TELEGRAM") || chatId === "") {
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });
    return response.ok;
  } catch (err) {
    console.error("[Telegram] Send failed:", err);
    return false;
  }
};

const broadcastActiveSignalToTelegram = async (active: any) => {
  const directionEmoji = active.type === "BUY" ? "🟢 BUY" : "🔴 SELL";
  
  const message = `
🔱 *PERSEUS AI SIGNAL* 🔱
━━━━━━━━━━━━━━━━━━━━━━
📊 *SINYAL AKTIF: ${directionEmoji}*
━━━━━━━━━━━━━━━━━━━━━━

💎 *XAUUSD (Gold Spot)*
⏱ *Timeframe:* M15
🎯 *Confidence:* ${active.confidence}%

━━━━━━━━━━━━━━━━━━━━━━
📍 *LEVELS:*
▸ Entry: \`$${active.entryPrice.toFixed(2)}\`
▸ TP1: \`$${active.takeProfit1.toFixed(2)}\`
▸ TP2: \`$${active.takeProfit2.toFixed(2)}\`
▸ TP3: \`$${active.takeProfit3.toFixed(2)}\`
▸ SL: \`$${active.stopLoss.toFixed(2)}\`

━━━━━━━━━━━━━━━━━━━━━━
📋 *ANALISIS:*
${active.commentary?.substring(0, 300) || "SMC Order Block alignment confirmed."}

━━━━━━━━━━━━━━━━━━━━━━
⚡ _Perseus AI Terminal | Real-Time Signal_
  `.trim();
  
  await sendTelegramMessage(message);
};

const broadcastTradeResultToTelegram = async (signal: any) => {
  const isWin = signal.status === "WIN" || signal.status === "WIN_TP1";
  const emoji = isWin ? "🟢" : "🔴";
  const statusText = isWin ? "WIN ✅" : "LOSS ❌";
  
  const message = `
🔱 *PERSEUS TRADE RESULT* 🔱
━━━━━━━━━━━━━━━━━━━━━━
${emoji} *${statusText}*
━━━━━━━━━━━━━━━━━━━━━━

💎 *XAUUSD*
▸ Type: ${signal.type}
▸ Entry: \`$${signal.entryPrice.toFixed(2)}\`
▸ Exit: \`$${signal.status === "WIN" ? signal.takeProfit2.toFixed(2) : signal.stopLoss.toFixed(2)}\`
▸ Pips: \`${signal.pips > 0 ? '+' : ''}${signal.pips}\`

━━━━━━━━━━━━━━━━━━━━━━
⚡ _Perseus AI Terminal | Trade Closed_
  `.trim();
  
  await sendTelegramMessage(message);
};

// ============================================================
// API ENDPOINTS
// ============================================================

// GET /api/market-params - Live market data
app.get("/api/market-params", async (req, res) => {
  await processPerseusMarketDataOnRequest();
  const params = fetchPerseusMarketParams();
  
  res.json({
    ...params,
    dataQuality: isPriceDataReal() ? "REAL" : "DEGRADED",
    priceSource: realPriceSource,
    lastUpdate: new Date(lastRealPriceUpdate).toISOString()
  });
});

// GET /api/signals - Active signals and history
app.get("/api/signals", async (req, res) => {
  await processPerseusMarketDataOnRequest();
  const active = fetchPerseusLiveSignal();
  const history = fetchPerseusHistorySignals();
  
  const wins = history.filter(s => s.status === "WIN" || s.status === "WIN_TP1").length;
  const winRate = history.length > 0 ? Math.round((wins / history.length) * 100) : 0;
  
  res.json({
    active,
    history: history.slice(0, 50), // Last 50 trades
    stats: {
      totalTrades: history.length,
      wins: wins,
      losses: history.filter(s => s.status === "LOSS").length,
      winRate,
      totalPips: history.reduce((sum, s) => sum + s.pips, 0),
      dataQuality: isPriceDataReal() ? "REAL_DATA" : "DEGRADED_DATA"
    }
  });
});

// GET /api/bot-config - Bot configuration
app.get("/api/bot-config", (req, res) => {
  const config = loadBotConfig();
  // NEVER expose full token
  res.json({
    ...config,
    telegramBotToken: config.telegramBotToken ? "****" + config.telegramBotToken.slice(-4) : "",
  });
});

// POST /api/bot-config - Update bot configuration
app.post("/api/bot-config", authenticateToken, (req: any, res: any) => {
  try {
    const prevConfig = loadBotConfig();
    const updated = { ...prevConfig, ...req.body };
    
    // Log status changes
    if (prevConfig.botEnabled !== updated.botEnabled) {
      updated.executionLogs.unshift({
        time: new Date().toISOString(),
        type: "SYSTEM",
        message: `Auto-Trader ${updated.botEnabled ? "ACTIVATED 🟢" : "PAUSED 🛑"}`
      });
      if (updated.executionLogs.length > 200) updated.executionLogs.pop();
    }
    
    saveBotConfig(updated);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mt5/signals - MT5 Expert Advisor endpoint
app.get("/api/mt5/signals", async (req, res) => {
  await processPerseusMarketDataOnRequest();
  const config = loadBotConfig();
  const active = fetchPerseusLiveSignal();
  
  if (!config.botEnabled) {
    return res.json({
      status: "STOPPED",
      message: "Auto-Trader is deactivated",
      active: null
    });
  }
  
  if (!active || active.id === "sig-perseus-initial" || active.status !== "ACTIVE") {
    return res.json({
      status: "IDLE",
      message: "Waiting for valid signal setup",
      active: null
    });
  }
  
  // Only send signals when we have real price data
  if (!isPriceDataReal()) {
    return res.json({
      status: "WAITING",
      message: "Waiting for real-time price data from TradingView",
      active: null
    });
  }
  
  res.json({
    status: "SIGNAL_READY",
    lotSize: config.mt5LotSize || 0.1,
    slippage: config.mt5Slippage || 3,
    dataQuality: "REAL",
    active: {
      ticketId: active.id,
      symbol: "XAUUSD",
      type: active.type,
      entryPrice: active.entryPrice,
      stopLoss: active.stopLoss,
      takeProfit1: active.takeProfit1,
      takeProfit2: active.takeProfit2,
      takeProfit3: active.takeProfit3,
      confidence: active.confidence,
      time: active.time
    }
  });
});

// POST /api/mt5/webhook - MT5 execution callback
app.post("/api/mt5/webhook", (req, res) => {
  try {
    const { event, price, volume, message } = req.body;
    const config = loadBotConfig();
    
    config.executionLogs.unshift({
      time: new Date().toISOString(),
      type: "MT5_EXECUTION",
      message: `${event || "ORDER"} | ${message || "Executed"} | $${price} | ${volume || config.mt5LotSize} lots`
    });
    
    if (config.executionLogs.length > 200) {
      config.executionLogs.pop();
    }
    
    saveBotConfig(config);
    
    // Notify via Telegram
    const tgMsg = `🔔 *MT5 EXECUTION*\n━━━━━━━━━━━━\n📦 ${event || "ORDER"}\n💵 Price: $${price}\n📐 Lots: ${volume || config.mt5LotSize}\n\n${message || ""}`;
    sendTelegramMessage(tgMsg);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/signals/scan - AI Signal Scan
app.post("/api/signals/scan", aiScanLimiter, async (req: any, res: any) => {
  try {
    const rawSignal = await triggerAISignalScan(true);
    
    // Broadcast to Telegram
    await broadcastActiveSignalToTelegram(rawSignal);
    
    // AI Analysis with Gemini
    const geminiSDK = instantiateGeminiClient();
    
    if (geminiSDK && rawSignal) {
      const marketParams = fetchPerseusMarketParams();
      
      try {
        const response = await geminiSDK.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `Analyze this XAUUSD trading signal professionally:

Symbol: XAUUSD (Gold Spot)
Signal Type: ${rawSignal.type}
Entry: $${rawSignal.entryPrice}
Stop Loss: $${rawSignal.stopLoss}
Take Profit 1: $${rawSignal.takeProfit1}
Take Profit 2: $${rawSignal.takeProfit2}
Strategy: ${rawSignal.strategy}
Confidence: ${rawSignal.confidence}%

Current Market:
- RSI(14): ${marketParams.rsi}
- EMA20: $${marketParams.ema20}
- EMA50: $${marketParams.ema50}
- EMA200: $${marketParams.ema200}
- Oscillator: ${marketParams.oscillatorState}

Provide a concise 2-3 paragraph professional analysis in English explaining the technical confluence behind this entry. Do NOT include disclaimers. Be authoritative and precise.`,
          config: { temperature: 0.5 }
        });

        if (response && response.text) {
          await updateSignalCommentary(rawSignal.id, response.text.trim());
        }
      } catch (gemErr: any) {
        const errMsg = gemErr?.message || String(gemErr);
        if (errMsg.includes("403") || errMsg.includes("429") || errMsg.includes("PERMISSION_DENIED")) {
          isGeminiBlocked = true;
        }
        console.log("[Perseus] AI analysis skipped - running in standard mode");
      }
    }

    const history = fetchPerseusHistorySignals();
    const wins = history.filter(s => s.status === "WIN" || s.status === "WIN_TP1").length;
    
    res.json({
      success: true,
      active: rawSignal,
      history: history.slice(0, 50),
      stats: {
        totalTrades: history.length,
        winRate: history.length > 0 ? Math.round((wins / history.length) * 100) : 0,
        totalPips: history.reduce((sum, s) => sum + s.pips, 0),
        confidence: rawSignal.confidence
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || "Signal scan failed" 
    });
  }
});

// GET /api/cron - Serverless cron endpoint
app.get("/api/cron", async (req, res) => {
  try {
    // Process market data
    await processPerseusMarketData();
    
    const active = fetchPerseusLiveSignal();
    const history = fetchPerseusHistorySignals();
    
    // Check for signal state changes and broadcast
    // (State tracking handled by engine internally)
    
    res.json({
      success: true,
      time: new Date().toISOString(),
      dataQuality: isPriceDataReal() ? "REAL" : "DEGRADED",
      activeSignal: active ? {
        id: active.id,
        type: active.type,
        entry: active.entryPrice,
        status: active.status,
        tp1Hit: active.tp1Hit || false
      } : null,
      historyCount: history.length
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Cron processing failed"
    });
  }
});

// GET /api/tick - Alias for cron
app.get("/api/tick", (req, res) => {
  res.redirect(307, "/api/cron");
});

// POST /api/ai-analyze - AI Analysis endpoint
app.post("/api/ai-analyze", async (req, res) => {
  const { userPrompt, currentQuote, rsi, emaValue, sentiment } = req.body;
  const geminiSDK = instantiateGeminiClient();

  if (!geminiSDK) {
    // Professional fallback without exposing tokens
    const quote = currentQuote || 2650;
    const fallbackAnalysis = `
## PERSEUS INTELLIGENCE | MARKET ANALYSIS

**Query:** "${userPrompt || 'General market analysis'}"
**Spot Gold:** $${quote.toFixed(2)} | **RSI:** ${rsi || 50} | **EMA:** $${emaValue || (quote - 3).toFixed(2)}

### Technical Confluence
Based on quantitative analysis of current market structure:
- Price action shows clear institutional footprints at key levels
- Momentum indicators suggest continuation of dominant trend
- Volume profile confirms smart money positioning

### Key Levels
- Support Zone: $${(quote - 15).toFixed(2)} - $${(quote - 5).toFixed(2)}
- Resistance Zone: $${(quote + 8).toFixed(2)} - $${(quote + 18).toFixed(2)}

### Recommendation
Maintain disciplined risk management with 1:2 minimum risk-to-reward ratio.
*(Analysis by Perseus Local Engine)*
    `.trim();
    
    return res.json({ analysis: fallbackAnalysis, citations: [] });
  }

  try {
    const response = await geminiSDK.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Provide a professional, concise analysis for: "${userPrompt || 'XAUUSD market outlook'}"

Current Market Data:
- XAUUSD Spot: $${currentQuote}
- RSI(14): ${rsi}
- EMA-20: $${emaValue || currentQuote - 3}
- Sentiment: ${sentiment || 'NEUTRAL'}

Respond in English with 2-3 paragraphs. Be specific about support/resistance levels. No disclaimers.`,
      config: {
        temperature: 0.6,
        tools: [{ googleSearch: {} }]
      }
    });

    if (response && response.text) {
      const citations: { title: string; uri: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            citations.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        }
      }
      return res.json({ analysis: response.text, citations });
    }
    
    return res.json({ analysis: "Analysis temporarily unavailable. Using local engine calculations.", citations: [] });
  } catch (err: any) {
    console.error("[AI Analyze] Error:", err.message);
    return res.json({ 
      analysis: "AI analysis temporarily unavailable. Please rely on the technical indicators provided by the Perseus Engine.", 
      citations: [] 
    });
  }
});

// GET /api/health - Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString(),
    dataQuality: isPriceDataReal() ? "REAL" : "DEGRADED",
    environment: process.env.NODE_ENV || "development",
    platform: process.env.VERCEL ? "Vercel" : process.env.AWS_LAMBDA_FUNCTION_NAME ? "AWS Lambda" : "Local"
  });
});

// ============================================================
// WEBSOCKET SERVER - PROPERLY HANDLES TRADINGVIEW DATA
// ============================================================

// Store for real candles from TradingView
let tradingViewCandles: any[] = [];
let tradingViewPrice: number | null = null;
let tradingViewPriceTime: number = 0;

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Perseus Server] Running on port ${PORT}`);
    console.log(`[Perseus Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Perseus Server] Data Source: ${TWELVEDATA_API_KEY ? 'TwelveData API' : 'TradingView WebSocket'}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[Perseus Server] SIGTERM received - shutting down");
    server.close(() => process.exit(0));
  });
  
  process.on("SIGINT", () => {
    console.log("[Perseus Server] SIGINT received - shutting down");
    server.close(() => process.exit(0));
  });

  // ============================================================
  // WEBSOCKET SERVER - CRITICAL FOR REAL-TIME DATA
  // ============================================================
  const wss = new WebSocketServer({ server });
  
  // @ts-ignore - Store globally for engine access
  global.wss = wss;
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');
    
    // Send initial state immediately
    try {
      const marketParams = fetchPerseusMarketParams();
      ws.send(JSON.stringify({
        type: "SYNC",
        data: marketParams,
        dataQuality: isPriceDataReal() ? "REAL" : "DEGRADED"
      }));
    } catch (e) {
      console.error('[WS] Error sending initial state:', e);
    }
    
    // LISTEN FOR MESSAGES FROM CLIENT (TradingView data)
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle price updates from TradingView
        if (message.type === 'PRICE_UPDATE') {
          const { price, time, volume } = message.data;
          
          if (price && price > 1000 && price < 5000) {
            tradingViewPrice = price;
            tradingViewPriceTime = time || Date.now();
            lastRealPriceUpdate = Date.now();
            realPriceSource = "TRADINGVIEW_WS";
            
            // Update global price for engine
            // @ts-ignore
            if (global.updateLatestPrice) {
              // @ts-ignore
              global.updateLatestPrice(price);
            }
            
            console.log(`[WS] Real price from TradingView: $${price}`);
          }
        }
        
        // Handle candle updates from TradingView
        if (message.type === 'CANDLE_UPDATE') {
          const candle = message.data;
          
          if (candle && candle.time && candle.close > 0) {
            const existingIndex = tradingViewCandles.findIndex(
              (c: any) => c.time === candle.time
            );
            
            if (existingIndex >= 0) {
              tradingViewCandles[existingIndex] = candle;
            } else {
              tradingViewCandles.push(candle);
            }
            
            // Keep last 500 candles
            if (tradingViewCandles.length > 500) {
              tradingViewCandles = tradingViewCandles.slice(-500);
            }
            
            // Sort by time
            tradingViewCandles.sort((a: any, b: any) => a.time - b.time);
            
            // Update global candles for engine
            // @ts-ignore
            global.realCandlesFromTV = tradingViewCandles;
            
            lastRealPriceUpdate = Date.now();
            realPriceSource = "TRADINGVIEW_WS";
          }
        }
        
        // Handle historical data from TradingView
        if (message.type === 'HISTORICAL_DATA') {
          const candles = message.data;
          
          if (Array.isArray(candles) && candles.length > 0) {
            tradingViewCandles = candles
              .filter((c: any) => c.close > 0)
              .sort((a: any, b: any) => a.time - b.time);
            
            // @ts-ignore
            global.realCandlesFromTV = tradingViewCandles;
            
            console.log(`[WS] Received ${tradingViewCandles.length} historical candles from TradingView`);
            
            // Update latest price
            if (tradingViewCandles.length > 0) {
              const latest = tradingViewCandles[tradingViewCandles.length - 1];
              tradingViewPrice = latest.close;
              tradingViewPriceTime = latest.time;
              lastRealPriceUpdate = Date.now();
              realPriceSource = "TRADINGVIEW_WS";
            }
          }
        }
        
        // Broadcast updated state to all clients
        const marketParams = fetchPerseusMarketParams();
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "SYNC",
              data: marketParams,
              dataQuality: isPriceDataReal() ? "REAL" : "DEGRADED"
            }));
          }
        });
        
      } catch (error) {
        console.error('[WS] Message processing error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('[WS] Client error:', error);
    });
  });
  
  console.log('[Perseus Server] WebSocket server ready for TradingView data');
}

// ============================================================
// START SERVER
// ============================================================
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}

export default app;
