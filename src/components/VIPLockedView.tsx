import React, { useState } from "react";
import { Lock, Key, Send, ShieldAlert } from "lucide-react";

export default function VIPLockedView({ 
  featureName, 
  onUnlock 
}: { 
  featureName: string; 
  onUnlock: () => void; 
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    // Simple VIP code validation
    if (code.trim().toUpperCase() === "PERS3OF-VIP") {
      onUnlock();
    } else {
      setError("Kode akses tidak valid. Silakan hubungi admin.");
    }
  };

  return (
    <div className="w-full text-slate-100 max-w-2xl mx-auto px-4 py-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center justify-center p-8 bg-[#04060b]/80 border border-amber-500/30 rounded-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] pointer-events-none" />
        
        <Lock className="w-16 h-16 text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        
        <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-2">
          FITUR TERKUNCI: {featureName}
        </h2>
        
        <p className="text-sm text-slate-400 mb-8 max-w-md leading-relaxed font-light">
          Akses ke fitur berkinerja tinggi ini dibatasi khusus untuk member VIP demi menjaga stabilitas engine dan kualitas sinyal.
        </p>

        <div className="w-full max-w-sm space-y-4">
          <div className="flex flex-col gap-2 text-left">
            <label className="text-xs font-bold text-slate-400 uppercase font-mono">Masukkan Kode Akses VIP</label>
            <div className="flex bg-[#0b101d] border border-slate-700/60 rounded-xl overflow-hidden focus-within:border-amber-500/50 transition-colors">
              <div className="pl-4 flex items-center justify-center text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input 
                type="password"
                placeholder="Masukkan Kode..."
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white focus:outline-none font-mono uppercase"
              />
            </div>
            {error && <span className="text-xs text-rose-500 font-mono">{error}</span>}
          </div>

          <button 
            onClick={handleUnlock}
            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            Verifikasi Kode
          </button>
        </div>

        <div className="mt-10 p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex items-start gap-4 text-left">
          <ShieldAlert className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Belum Terdaftar di VIP?</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-3">
              Dapatkan VIP Access Code dengan menghubungi admin official kami di Telegram sekarang.
            </p>
            <a 
              href="https://t.me/pers3oF" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-bold uppercase transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Hubungi @pers3oF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
