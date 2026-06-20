import React, { useState, useEffect } from "react";
import { ShieldCheck, Save, Server, Loader2, Key } from "lucide-react";

export default function AdminView({ currentUser }: { currentUser: any }) {
  const [config, setConfig] = useState<any>(null);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bot-config", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setMessage("Config loaded.");
      } else {
        setMessage("Unauthorized. Check API Secret Token.");
      }
    } catch (e: any) {
      setMessage(e.message);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/bot-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          botEnabled: config.botEnabled,
          mt5LotSize: Number(config.mt5LotSize),
          mt5Slippage: Number(config.mt5Slippage),
          telegramBotToken: config.telegramBotToken,
          telegramChatId: config.telegramChatId
        })
      });
      if (response.ok) {
        setMessage("Config saved securely to Firestore via VPS backend!");
      } else {
        setMessage("Unauthorized to save.");
      }
    } catch (e: any) {
      setMessage(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="w-full text-slate-100 max-w-3xl mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col mb-8 p-6 bg-[#04060b] border border-red-500/30 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] pointer-events-none" />
        <h1 className="text-2xl font-display font-black text-rose-400 uppercase tracking-tight mb-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" /> ROOT ADMIN CONSOLE
        </h1>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          Terminal master-control eksklusif VPS Node.js Backend. Akses ini dikunci secara hierarkis.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          <label className="text-xs font-bold text-slate-300 font-mono uppercase">API Secret Token (Bearer)</label>
          <div className="flex gap-2">
            <input 
              type="password"
              placeholder="Enter server API_SECRET_TOKEN..."
              className="flex-1 bg-[#0b101d] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-colors font-mono"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button 
              onClick={fetchConfig}
              className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              Connect
            </button>
          </div>
          {message && <div className="text-xs text-amber-500 font-mono mt-2">{message}</div>}
        </div>

        {config && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Telegram Bot Token</label>
                <input 
                  type="text"
                  className="bg-[#0b101d] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50"
                  value={config.telegramBotToken}
                  onChange={(e) => setConfig({...config, telegramBotToken: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Telegram Chat ID</label>
                <input 
                  type="text"
                  className="bg-[#0b101d] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig({...config, telegramChatId: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">MT5 Default Lot Size</label>
                <input 
                  type="number" step="0.01"
                  className="bg-[#0b101d] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50"
                  value={config.mt5LotSize}
                  onChange={(e) => setConfig({...config, mt5LotSize: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">MT5 Max Slippage</label>
                <input 
                  type="number"
                  className="bg-[#0b101d] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50"
                  value={config.mt5Slippage}
                  onChange={(e) => setConfig({...config, mt5Slippage: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 p-4 border border-slate-800 rounded-xl bg-slate-900/50">
              <input 
                type="checkbox" 
                id="botEnabled"
                checked={config.botEnabled}
                onChange={(e) => setConfig({...config, botEnabled: e.target.checked})}
                className="w-5 h-5 accent-rose-500"
              />
              <label htmlFor="botEnabled" className="text-sm font-bold text-slate-300">Global Auto-Trade & Broadcast Enabled</label>
            </div>

            <button 
              onClick={saveConfig}
              className="w-full mt-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-400 transition-colors shadow-[0_0_20px_rgba(243,24,66,0.2)] flex justify-center items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              PUSH CONFIG TO FIRESTORE DB
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
