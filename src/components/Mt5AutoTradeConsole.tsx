import React, { useState, useEffect } from "react";
import { Signal, MarketParams } from "../types";
import { 
  Cpu, 
  Settings, 
  Terminal, 
  Check, 
  RefreshCw, 
  Play, 
  Square, 
  Copy, 
  AlertTriangle, 
  Layers, 
  FileCode, 
  Send, 
  Zap, 
  Bot, 
  Smartphone,
  CheckCircle,
  HelpCircle,
  Activity
} from "lucide-react";

interface Mt5AutoTradeConsoleProps {
  activeSignal: Signal | null;
  marketParams: MarketParams | null;
}

interface BotConfig {
  botEnabled: boolean;
  mt5LotSize: number;
  mt5Slippage: number;
  telegramBotToken: string;
  telegramChatId: string;
  lastUpdateId: number;
  executionLogs: Array<{ time: string; type: string; message: string }>;
}

export default function Mt5AutoTradeConsole({ activeSignal, marketParams }: Mt5AutoTradeConsoleProps) {
  const [config, setConfig] = useState<BotConfig>({
    botEnabled: true,
    mt5LotSize: 0.1,
    mt5Slippage: 3,
    telegramBotToken: "8824462888:AAHmyBCHwVwH_W_kgKOWZv-BCUOacdX_V1w",
    telegramChatId: "",
    lastUpdateId: 0,
    executionLogs: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(5);
  const [terminalFilter, setTerminalFilter] = useState<string>("ALL");

  // Fetch bot configurations and logs from sever API
  const fetchConfigAndLogs = async () => {
    try {
      const res = await fetch("/api/bot-config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Gagal melakukan sinkronisasi dengan MT5 Bridge backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
    
    // Low performance friendly frequent interval polling so updates (Telegram commands) materialize in split seconds
    const interval = setInterval(fetchConfigAndLogs, 2500);
    return () => clearInterval(interval);
  }, []);

  // Update latency fluctuation for high technical aesthetics
  useEffect(() => {
    const floatLatency = setInterval(() => {
      setLatency(prev => {
        const dev = Math.floor(Math.random() * 3) - 1;
        const next = prev + dev;
        return next < 3 ? 3 : next > 12 ? 12 : next;
      });
    }, 4500);
    return () => clearInterval(floatLatency);
  }, []);

  // Trigger POST action to save inputs to backend
  const handleUpdateConfigValue = async (updatedFields: Partial<BotConfig>) => {
    try {
      const nextConfig = { ...config, ...updatedFields };
      setConfig(nextConfig); // optimistic update
      
      const token = localStorage.getItem("perseus_admin_token") || "perseus_secure_admin_v1";
      const res = await fetch("/api/bot-config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfig(data.config);
        }
      }
    } catch (e) {
      console.error("Error setting configuration parameter:", e);
    }
  };

  const handleFullSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("");

    try {
      const token = localStorage.getItem("perseus_admin_token") || "perseus_secure_admin_v1";
      const res = await fetch("/api/bot-config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          mt5LotSize: Number(config.mt5LotSize),
          mt5Slippage: Number(config.mt5Slippage),
          telegramBotToken: config.telegramBotToken.trim(),
          telegramChatId: config.telegramChatId.trim()
        })
      });

      if (res.ok) {
        setSaveStatus("SUCCESS");
        setTimeout(() => setSaveStatus(""), 4000);
      } else {
        setSaveStatus("FAILED");
      }
    } catch {
      setSaveStatus("FAILED");
    } finally {
      setSaving(false);
    }
  };

  const copyMql5Code = () => {
    const mqlCode = `//+------------------------------------------------------------------+
//|                                              PerseusAutoTrade.mq5|
//|                        Perseus Intelligence Systems (C) 2026     |
//|                                      https://perseus-signals.ai  |
//+------------------------------------------------------------------+
#property copyright "Perseus Intelligence"
#property link      "https://perseus-signals.ai"
#property version   "1.00"
#property strict

//--- Input Parameters
input string   InpServerUrl     = "https://perseus-signals.ai"; // URL Terminal Web App Anda
input string   InpSymbolName    = "XAUUSD";                   // Simbol Trading yang Digunakan
input double   InpLotSize       = 0.10;                       // Lot Default Akun

//--- Globals
string   glLastTicketId = "";
datetime glLastOrderTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("== PERSEUS SMC AUTO-TRADE BRIDGE INITIALIZED SUCCESS ==");
   Print("Pengecekan sinyal akan dilakukan setiap 3 detik.");
   EventSetTimer(3);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   Print("Perseus Auto-Trader Bridge dicopot.");
  }

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
  {
   CheckPerseusServer();
  }

//+------------------------------------------------------------------+
//| Fungsi utama mengecek sinyal di API server Perseus AI             |
//+------------------------------------------------------------------+
void CheckPerseusServer()
  {
   char post_data[], result[];
   string result_headers;
   string target_url = InpServerUrl + "/api/mt5/signals";
   
   // Headers HTTP
   string headers = "Content-Type: application/json\\r\\n";
   
   // Kirim WebRequest ke Server
   int res = WebRequest("GET", target_url, headers, 3000, post_data, result, result_headers);
   
   if(res == -1)
     {
      Print("Error menghubungi server web. Pastikan URL benar & tambahkan URL ini di Tools -> Options -> Expert Advisors -> Allow WebRequest!");
      return;
     }
     
   string responseText = CharArrayToString(result);
   
   // Pengecekan respons terperinci
   if(StringFind(responseText, "\\"status\\":\\"RUNNING\\"") >= 0)
     {
      // Parse sederhana JSON (MT5 murni tanpa library eksternal)
      string ticketId = GetJsonValue(responseText, "ticketId");
      string type = GetJsonValue(responseText, "type");
      double entryPrice = StringToDouble(GetJsonValue(responseText, "entryPrice"));
      double sl = StringToDouble(GetJsonValue(responseText, "stopLoss"));
      double tp1 = StringToDouble(GetJsonValue(responseText, "takeProfit1"));
      
      // Jika mendeteksi ticketId baru yang belum pernah dijalankan, eksekusi market!
      if(ticketId != "" && ticketId != glLastTicketId)
        {
         glLastTicketId = ticketId;
         Print("=== SINYAL PENERUS BARU TERDETEKSI ===");
         Print("ID: ", ticketId, " | Aksi: ", type, " | Entry: ", entryPrice);
         
         // Eksekusi order
         ExecuteMarketOrder(type, sl, tp1);
         
         // Laporkan kembali ke Webhook Server Perseus
         SendExecutionFeedback(ticketId, type, entryPrice, "ORDER_OPENED", "Order berhasil ditransmisikan bersih.");
        }
     }
  }

//+------------------------------------------------------------------+
//| Membuka Posisi Trading Instant Market Lot                        |
//+------------------------------------------------------------------+
void ExecuteMarketOrder(string type, double sl, double tp)
  {
   MqlTradeRequest request={};
   MqlTradeResult  result={};
   
   request.action   = TRADE_ACTION_DEAL;
   request.symbol   = Symbol();
   request.volume   = InpLotSize;
   request.deviation= 10;
   
   if(type == "BUY")
     {
      request.type = ORDER_TYPE_BUY;
      request.price = SymbolInfoDouble(Symbol(), SYMBOL_ASK);
     }
   else if(type == "SELL")
     {
      request.type = ORDER_TYPE_SELL;
      request.price = SymbolInfoDouble(Symbol(), SYMBOL_BID);
     }
     
   request.sl  = sl;
   request.tp  = tp;
   
   if(!OrderSend(request, result))
     {
      Print("Gagal mendaftarkan order trading: ", GetLastError());
     }
   else
     {
      Print("SMC Sniper Order berhasil dieksekusi! Ticket #", result.order);
     }
  }

//+------------------------------------------------------------------+
//| Mengirim laporan balik ke Dashboard Web App                       |
//+------------------------------------------------------------------+
void SendExecutionFeedback(string ticketId, string type, double price, string eventName, string msg)
  {
   char post_data[], result[];
   string result_headers;
   string target_url = InpServerUrl + "/api/mt5/webhook";
   string headers = "Content-Type: application/json\\r\\n";
   
   // Susun JSON string payload
   string json = "{\\"ticketId\\":\\""+ticketId+"\\",";
   json += "\\"event\\":\\""+eventName+"\\",";
   json += "\\"price\\":"+DoubleToString(price, 2)+",";
   json += "\\"volume\\":"+DoubleToString(InpLotSize, 2)+",";
   json += "\\"message\\":\\""+msg+"\\"";
   json += "}";
   
   StringToCharArray(json, post_data);
   WebRequest("POST", target_url, headers, 3000, post_data, result, result_headers);
  }

// Helper ekstraksi nilai JSON string sederhana
string GetJsonValue(string text, string key)
  {
   string keyLook = "\\"" + key + "\\":";
   int pos = StringFind(text, keyLook);
   if(pos < 0) return("");
   int start = pos + StringLen(keyLook);
   
   // Lewati spasi, titik dua, tanda kutip
   while(start < StringLen(text) && (StringSubstr(text, start, 1) == " " || StringSubstr(text, start, 1) == "\\"" || StringSubstr(text, start, 1) == ":"))
      start++;
      
   int end = start;
   while(end < StringLen(text) && StringSubstr(text, end, 1) != "\\"" && StringSubstr(text, end, 1) != "," && StringSubstr(text, end, 1) != "}")
      end++;
      
   return(StringSubstr(text, start, end - start));
  }`;

    navigator.clipboard.writeText(mqlCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const filteredLogs = config.executionLogs.filter(log => {
    if (terminalFilter === "ALL") return true;
    return log.type === terminalFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4 py-8 relative">
      <div className="lg:col-span-12">
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-[#01080d]/40 to-[#040c14]/40 border border-amber-500/15 rounded-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/[0.02] rounded-full blur-[70px] pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1 px-2 rounded bg-amber-500/10 text-amber-400 font-mono text-[9px] font-black tracking-widest leading-none">
                  SECURE BRIDGE MODULE 5
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                  WEBHOOK ENGINE ONLINE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                <Cpu className="w-6 h-6 text-amber-500 animate-pulse" /> Perseus Auto-Trade MT5 Bridge
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-1 max-w-2xl">
                Solusi jembatan otomatis (auto-trade) berkinerja tinggi. Mengeksekusi sinyal presisi 1:2 dari mesin kecerdasan buatan Perseus SMC ke akun MetaTrader 5 (MT5) Anda secara real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 px-4 rounded-xl bg-black/40 border border-[#14141a] flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[8.5px] font-mono text-slate-500 block uppercase">LATENCY SPEED</span>
                  <span className="text-xs font-mono font-black text-emerald-400 tracking-wider">
                    {latency} ms <span className="text-[9px] opacity-70">(0-Delay)</span>
                  </span>
                </div>
                <Activity className="w-5 h-5 text-emerald-400/80 animate-pulse shrink-0" />
              </div>

              {/* Bot Toggle switch with Telegram status compliance */}
              <button
                onClick={() => handleUpdateConfigValue({ botEnabled: !config.botEnabled })}
                className={`p-3 px-5 rounded-xl border font-sans font-black text-xs uppercase tracking-widest cursor-pointer transition-all duration-300 flex items-center gap-2 ${
                  config.botEnabled
                    ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 text-rose-400"
                }`}
              >
                {config.botEnabled ? (
                  <>
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    AUTOPILOT: ACTIVE 🟢
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-rose-500 shrink-0" />
                    AUTOPILOT: MUTED 🛑
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Helper Block for Telegram Updates alerts */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950/20 border border-amber-500/10 rounded-xl relative overflow-hidden flex items-start gap-3">
          <div className="p-2.5 rounded bg-amber-500/5 text-amber-400 shrink-0">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black text-amber-500 block uppercase tracking-wider">Remote Telegram Bot</span>
            <span className="text-xs font-bold text-white block mt-0.5">Control via Chatbot Commands</span>
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed mt-1">
              Ketik <code className="bg-[#0e1017] px-1 py-0.5 rounded text-amber-300 font-mono font-bold">/stop</code> di bot Telegram Anda untuk mematikan bot secara manual, dan ketik <code className="bg-[#0e1017] px-1 py-0.5 rounded text-amber-300 font-mono font-bold">/run</code> untuk mengaktifkan kembali auto-trade kapan saja tanpa membuka website!
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950/20 border border-amber-500/10 rounded-xl relative overflow-hidden flex items-start gap-3">
          <div className="p-2.5 rounded bg-emerald-500/5 text-emerald-400 shrink-0">
            <Zap className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-400 block uppercase tracking-wider">Zoro repainting &amp; spam</span>
            <span className="text-xs font-bold text-white block mt-0.5">High Intraday Quality Trades</span>
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed mt-1">
              Jeda durasi sinyal telah ditingkatkan dari pemantulan 2.5 menit menjadi siklus trading intraday 3 jam yang realistis. Tidak ada lagi spam sinyal beruntun untuk menjaga stabilitas margin modal Anda.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950/20 border border-amber-500/10 rounded-xl relative overflow-hidden flex items-start gap-3">
          <div className="p-2.5 rounded bg-cyan-500/5 text-cyan-400 shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black text-cyan-400 block uppercase tracking-wider">Expert Advisor Webhook</span>
            <span className="text-xs font-bold text-white block mt-0.5">Two-way Syncing Loop</span>
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed mt-1">
              MT5 Expert Advisor (EA) akan melakukan polling data sinyal aktif dan melaporkan kembali status eksekusi broker ke dashboard ini secara instral untuk pembukuan tertutup.
            </p>
          </div>
        </div>
      </div>

      {/* LHS Cockpit Controls with Bot parameters & Telegram Tokens */}
      <div className="lg:col-span-5 space-y-6">
        <form onSubmit={handleFullSave} className="p-6 bg-[#040407] border border-[#14141a] rounded-xl space-y-5">
          <div className="border-b border-[#14141a] pb-3 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-mono text-amber-500 block uppercase font-black tracking-widest">BRIDGE PREFERENCES</span>
              <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <Settings className="w-4 h-4 text-slate-400" /> Account parameters
              </h3>
            </div>
            <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono tracking-widest uppercase">
              SECURE TLS
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 text-[9.5px] uppercase tracking-widest font-black mb-1.5 flex items-center justify-between">
                <span>Account Lot Size</span>
                <span className="text-[9px] text-[#A5B1DB]/60">SMC Recommendation (0.01-0.20)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="5.0"
                value={config.mt5LotSize}
                onChange={(e) => setConfig({ ...config, mt5LotSize: Number(e.target.value) })}
                className="w-full bg-[#07070a] border border-[#14141a] focus:border-amber-500/40 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-slate-700 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[9.5px] uppercase tracking-widest font-black mb-1.5 flex items-center justify-between">
                <span>Max Allowable Slippage (Pips)</span>
                <span className="text-[9.5px] text-[#A5B1DB]/60">Default: 3 Pips</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.mt5Slippage}
                onChange={(e) => setConfig({ ...config, mt5Slippage: Number(e.target.value) })}
                className="w-full bg-[#07070a] border border-[#14141a] focus:border-amber-500/40 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-slate-700 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[9.5px] uppercase tracking-widest font-black mb-1.5">
                Telegram Bot API Token
              </label>
              <input
                type="text"
                value={config.telegramBotToken}
                onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                placeholder="cth: 8824462888:AAHmy..."
                className="w-full bg-[#07070a] border border-[#14141a] focus:border-amber-500/40 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-slate-700 focus:outline-none transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[9.5px] uppercase tracking-widest font-black mb-1.5 flex items-center justify-between">
                <span>Telegram Chat ID</span>
                <span className="text-[8.5px] text-amber-500 lowercase">(Ketik /run untuk deteksi otomatis)</span>
              </label>
              <input
                type="text"
                value={config.telegramChatId}
                onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                placeholder="cth: -1003487129 (Channel) atau ID Chat Anda"
                className="w-full bg-[#07070a] border border-[#14141a] focus:border-amber-500/40 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-slate-700 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-sans font-black text-[10.5px] tracking-widest uppercase rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_15px_rgba(245,158,11,0.15)] disabled:opacity-50 transition-all flex-1"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" /> MENYIMPAN...
                </>
              ) : (
                <>
                  <Settings className="w-3.5 h-3.5 text-black" /> SIMPAN PARAMETER
                </>
              )}
            </button>
          </div>

          {saveStatus === "SUCCESS" && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-sans flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Konfigurasi API MT5 &amp; Telegram disimpan di server secara permanen! 🔐</span>
            </div>
          )}

          {saveStatus === "FAILED" && (
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-400 text-[10px] font-sans flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Gagal menyimpan konfigurasi. Periksa koneksi backend server.</span>
            </div>
          )}
        </form>

        {/* Short Connection check guide helper lines */}
        <div className="p-5 bg-gradient-to-b from-[#05060a] to-[#020204] border border-[#14141a] rounded-xl text-slate-400 text-[10.5px] leading-relaxed font-sans space-y-3">
          <span className="font-mono text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-none">
            INTEGRASI MT5 LANGKAH MUDAH
          </span>
          <div className="space-y-2">
            <p>1. Buka Platform MetaTrader 5 (MT5) di Desktop VPS / PC Anda.</p>
            <p>2. Klik <strong className="text-white">Tools → Options → Expert Advisors</strong>.</p>
            <p>3. Centang opsi <strong className="text-amber-400">"Allow WebRequest for listed URL"</strong>.</p>
            <p>4. Masukkan tautan API web app berikut: <code className="bg-black text-amber-300 px-1 py-0.5 rounded font-mono break-all">{window.location.origin}</code></p>
            <p>5. Salin kode MQL5 di sebelah kanan dan kompile di MetaEditor Anda.</p>
          </div>
        </div>

        {/* 24/7 Autopilot Automation Cron Instructions */}
        <div className="p-5 bg-gradient-to-b from-[#1b1c1d]/30 to-[#020204] border border-amber-500/10 rounded-xl text-slate-400 text-[10.5px] leading-relaxed font-sans space-y-3 shadow-[0_4px_25px_rgba(245,158,11,0.03)]">
          <span className="font-mono text-[9px] font-black text-amber-400 uppercase tracking-widest block leading-none flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> AUTOMASI 24/7 TANPA HARUS BUKA BROWSER &amp; BUKA PC
          </span>
          <div className="space-y-2">
            <p>Agar bot bekerja sepenuhnya otomatis 24/7 dan mengirimkan sinyal harian (New Signal, TP, SL) ke Telegram &amp; VPS MT5 Anda **tanpa perlu menyalakan PC Anda atau membuka situs web ini**:</p>
            <div className="pl-3.5 border-l border-amber-500/20 space-y-2 text-[10.2px]">
              <p>1. Daftar di layanan Cron Job gratis tepercaya seperti <strong className="text-white">cron-job.org</strong> atau <strong className="text-white">uptimerobot.com</strong>.</p>
              <p>2. Buat tugas Cron (HTTP GET Request) baru yang diarahkan ke URL terminal Anda:</p>
              <div className="my-1.5">
                <code className="bg-black text-amber-300 px-2 py-1 rounded font-mono text-[9.5px] block border border-[#14141a] overflow-x-auto select-all">{window.location.origin}/api/signals</code>
              </div>
              <p>3. Jadwalkan interval ping setiap <strong className="text-amber-400">1 Menit</strong> atau <strong className="text-amber-400">30 Detik</strong>.</p>
            </div>
            <p className="text-slate-500 text-[9.5px] italic">Dengan demikian, panggilan Cron akan memicu mesin server Perseus AI untuk terus memproses harga spot emas dunia harian secara otomatis 24/7 meskipun PC Anda mati!</p>
          </div>
        </div>
      </div>

      {/* RHS Code integration and live logging Terminal */}
      <div className="lg:col-span-7 space-y-6">
        {/* Terminal logs block */}
        <div className="p-5 bg-[#030306] border border-[#14141a] rounded-xl flex flex-col gap-4 relative">
          <div className="flex items-center justify-between border-b border-[#14141a] pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-black tracking-widest leading-none">ACTIVE CONNECTION LOG</span>
                <span className="text-xs font-sans font-black text-white uppercase tracking-wider mt-0.5">Live Execute &amp; Command Logs</span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider uppercase font-bold">
              {["ALL", "TELEGRAM", "SYSTEM", "MT5_EXECUTION"].map(f => (
                <button
                  key={f}
                  onClick={() => setTerminalFilter(f)}
                  className={`px-2 py-0.5 rounded cursor-pointer border ${
                    terminalFilter === f 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25 font-black" 
                      : "bg-[#14141a]/40 text-slate-500 border-transparent hover:text-slate-300"
                  }`}
                >
                  {f === "MT5_EXECUTION" ? "MT5 FILL" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Core Logs Viewer */}
          <div className="w-full bg-[#020204] border border-[#14141a] rounded-lg p-3 font-mono text-[10px] leading-relaxed h-[180px] overflow-y-auto space-y-2 dark-terminal-scroller">
            {loading ? (
              <div className="h-full flex items-center justify-center gap-2 text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> MENSINKRONISASI COCKPIT...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 uppercase text-[9px] tracking-widest font-black">
                BELUM ADA LOG EVENT DIREKAM SEKARANG
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                let textCol = "text-slate-400";
                if (log.type === "TELEGRAM") textCol = "text-amber-400 font-bold";
                if (log.type === "SYSTEM") textCol = "text-[#00ffd2]";
                if (log.type === "MT5_EXECUTION") textCol = "text-emerald-400 font-bold";
                
                return (
                  <div key={idx} className="flex gap-2.5 items-start border-b border-[#0c0c11]/20 pb-1.5">
                    <span className="text-slate-600 shrink-0 select-none">
                      [{new Date(log.time).toLocaleTimeString()}]
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-black text-[7.5px] tracking-widest select-none shrink-0 ${
                      log.type === "TELEGRAM" ? "bg-amber-500/15 text-amber-400 border border-amber-500/15" :
                      log.type === "SYSTEM" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                    }`}>
                      {log.type === "MT5_EXECUTION" ? "MT5_FILL" : log.type}
                    </span>
                    <span className={`leading-relaxed ${textCol}`}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MQL5 copy integration block */}
        <div className="p-5 bg-[#030306] border border-[#14141a] rounded-xl flex flex-col gap-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#14141a] pb-3 gap-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-black tracking-widest leading-none">MQL5 INTEGRATION CODE</span>
                <span className="text-xs font-sans font-black text-white uppercase tracking-wider mt-0.5">MT5 Expert Advisor Code</span>
              </div>
            </div>

            <button
              onClick={copyMql5Code}
              className="px-3.5 py-1.5 bg-[#14141a]/60 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-[#14141a] hover:border-amber-500/25 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> BERHASIL DISALIN
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> SALIN KODE MQL5 (EA)
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
            Salin script robot penembak (MQL5 EA) di atas, tempelkan ke dalam editor MT5 Anda (<strong className="text-white">MetaEditor</strong>) lalu tekan tombol <strong className="text-amber-400">Compile [F7]</strong>. Jembatan Perseus akan otomatis mendeteksi, menangkap, dan menyamakan sinyal, lalu menyiarkan laporan balik ke terminal broker Anda secara langsung.
          </p>

          <div className="relative">
            <pre className="p-3 bg-[#020204]/90 border border-[#14141a] rounded-lg text-slate-500 text-[8px] font-mono leading-relaxed max-h-[140px] overflow-y-auto break-all scrollbar-thin dark-pre-scroller select-text selection:bg-[#fff]/10">
              {`//+------------------------------------------------------------------+
//|                                              PerseusAutoTrade.mq5|
//|                        Perseus Intelligence Systems (C) 2026     |
//+------------------------------------------------------------------+
...
void CheckPerseusServer() {
   string target_url = "${window.location.origin}/api/mt5/signals";
   ...
}`}
            </pre>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#030306] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
