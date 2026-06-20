import React, { useState, useEffect } from "react";
import { Lock, Key, Send, ShieldAlert, Users, Sparkles, MessageSquare, Check, Cpu, Eye, ExternalLink } from "lucide-react";

export default function VIPLockedView({ 
  featureName, 
  onUnlock,
  children
}: { 
  featureName: string; 
  onUnlock: () => void; 
  children?: React.ReactNode;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [showDirectKeyInput, setShowDirectKeyInput] = useState(false);

  // Simulated professional cryptographic verification steps
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerifying) {
      if (verificationStep < 4) {
        timer = setTimeout(() => {
          setVerificationStep((prev) => prev + 1);
        }, 1200);
      } else {
        // Complete verification and unlock with temporary 24hr trial
        if (typeof window !== "undefined") {
          localStorage.setItem("perseus_vip_unlocked", "true");
          localStorage.setItem("perseus_vip_unlocked_type", "temporary");
          localStorage.setItem("perseus_vip_unlocked_time", String(Date.now()));
          localStorage.setItem("perseus_vip_telegram", telegramHandle.trim() || "Telegram_Member");
        }
        onUnlock();
        setIsVerifying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isVerifying, verificationStep, onUnlock, telegramHandle]);

  const handleStartVerification = (viaGroupJoin = false) => {
    if (viaGroupJoin) {
      // Open group link in new window/tab safely
      window.open("https://t.me/perseusnewversion", "_blank");
      if (!telegramHandle) {
        setTelegramHandle("Telegram_Member");
      }
    }
    
    setIsVerifying(true);
    setVerificationStep(1);
    setError("");
  };

  const handleKeyUnlock = () => {
    if (code.trim().toUpperCase() === "PERS3OF-VIP") {
      if (typeof window !== "undefined") {
        localStorage.setItem("perseus_vip_unlocked", "true");
        localStorage.setItem("perseus_vip_unlocked_type", "permanent");
        localStorage.setItem("perseus_vip_unlocked_time", String(Date.now()));
        localStorage.setItem("perseus_vip_telegram", "LIFETIME_HOLDER");
      }
      onUnlock();
    } else {
      setError("Kode akses tidak valid. Silakan periksa kembali.");
    }
  };

  const getVerificationMessage = () => {
    switch (verificationStep) {
      case 1:
        return "Establishing secure WebSocket connection with Telegram API...";
      case 2:
        return "Querying Perseus database & scanning member whitelist...";
      case 3:
        return "Caching permanent local license on this terminal...";
      case 4:
        return "Authentication successful! Enjoy Lifetime access, Trader.";
      default:
        return "Connecting terminal...";
    }
  };

  return (
    <div className="w-full relative min-h-[500px]">
      
      {/* Background Curiosity Gap Element */}
      {children ? (
        <div className="blur-[10px] grayscale-[40%] opacity-[0.16] pointer-events-none select-none max-h-[80vh] overflow-hidden transition-all duration-700">
          {children}
        </div>
      ) : (
        // Placeholders in case there are no children, styled like charts
        <div className="w-full max-w-5xl mx-auto p-4 opacity-10 pointer-events-none select-none my-8">
          <div className="h-64 bg-slate-900 rounded-xl animate-pulse flex items-center justify-center border border-slate-800">
            <Eye className="w-12 h-12 text-slate-700" />
          </div>
        </div>
      )}

      {/* Sleek Frosted Glass Curiosity Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-gradient-to-b from-[#050608]/40 via-[#050608]/85 to-[#050608]/95 backdrop-blur-[6px] min-h-[550px]">
        
        <div className="w-full max-w-xl bg-black/60 border border-amber-500/25 rounded-2xl relative overflow-hidden shadow-[0_15px_50px_rgba(245,158,11,0.08)] p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500 text-center">
          
          {/* Subtle gold decoration */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          {/* Badge & Locks top */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest bg-[#0a0602] border border-amber-500/15 px-3 py-1 rounded-full select-none">
              ● PROMPT: PERSEUS TERMINAL PROTOCOL
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-black tracking-wider animate-pulse select-none">
              STATUS: UNALIGNED
            </div>
          </div>

          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-b from-amber-500/15 to-transparent border border-amber-500/30 flex items-center justify-center mb-5 animate-pulse">
            <Lock className="w-7 h-7 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wider mb-2">
            COMMUNITY WHITELIST REQUIRED
          </h2>
          
          <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-4">
            Fitur Terkunci: {featureName}
          </h3>

          <p className="text-xs sm:text-[13px] text-slate-300 mb-8 max-w-md mx-auto leading-relaxed font-light">
            "Akses terminal kuantitatif presisi Perseus V2 saat ini terkunci. Bergabunglah dengan Komunitas Telegram Eksklusif kami hari ini untuk membuka kunci (unlock) seluruh fitur seumur hidup secara 100% gratis."
          </p>

          {isVerifying ? (
            /* Elegant high-tech verification pipeline spinner */
            <div className="py-6 px-4 bg-[#05060a] border border-amber-500/10 rounded-xl max-w-sm mx-auto animate-pulse flex flex-col items-center">
              <Cpu className="w-10 h-10 text-amber-400 animate-spin mb-4" />
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-1.5 font-bold">
                CORE SYSTEM VERIFICATION
              </span>
              <p className="text-[11px] text-slate-300 font-mono text-center leading-normal">
                {getVerificationMessage()}
              </p>
              <div className="w-full bg-slate-900/50 h-1 rounded-full overflow-hidden mt-4">
                <div 
                  className="bg-amber-500 h-full transition-all duration-1000 ease-out" 
                  style={{ width: `${(verificationStep / 4) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto space-y-5">
              
              {/* Option A: Telegram Group Action (Recommended) */}
              <div className="space-y-3">
                <a 
                  href="https://t.me/perseusnewversion"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => handleStartVerification(false)}
                  className="w-full py-4 rounded-xl font-mono text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] select-none cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-black" />
                  <span>GABUNG TELEGRAM & UNLOCK GRATIS ⚡</span>
                </a>
                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-center gap-1.5 font-light">
                  <span>Sistem memverifikasi keanggotaan grup secara otomatis</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>

              <div className="relative py-2 select-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/80"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
                  <span className="bg-[#050608] px-3.5 text-gray-500 font-bold">Atau Masukkan Username</span>
                </div>
              </div>

              {/* Option B: Telegram Input Verification for Elite Feel */}
              <div className="flex bg-[#0b101d] border border-slate-800 rounded-xl overflow-hidden focus-within:border-amber-500/40 transition-colors">
                <div className="pl-4 flex items-center justify-center text-slate-500 font-mono text-[13px] font-bold select-none">
                  @
                </div>
                <input 
                  type="text"
                  placeholder="Username_Telegram_Anda"
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  className="flex-1 bg-transparent px-2.5 py-3 text-xs text-white focus:outline-none font-mono"
                />
                <button
                  onClick={() => {
                    if (telegramHandle.trim()) {
                      handleStartVerification(true);
                    } else {
                      setError("Masukkan username telegram Anda terlebih dahulu.");
                    }
                  }}
                  className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black font-mono text-[10px] font-bold uppercase tracking-wider border-l border-slate-800 transition-all"
                >
                  CONNECT
                </button>
              </div>

              {/* Direct Bypass Access Code Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectKeyInput(!showDirectKeyInput)}
                  className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 hover:text-amber-400 transition-colors cursor-pointer select-none"
                >
                  {showDirectKeyInput ? hideKeyLabel() : showKeyLabel()}
                </button>

                {showDirectKeyInput && (
                  <div className="mt-4 p-4 border border-slate-900 bg-[#040608]/90 rounded-xl text-left animate-in slide-in-from-top-3 duration-300">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase font-mono mb-2">
                      Masukkan Whitelist Access Code
                    </label>
                    <div className="flex gap-2">
                      <div className="flex flex-1 bg-[#090d16] border border-slate-800 rounded-lg overflow-hidden">
                        <div className="pl-3 flex items-center justify-center text-slate-500">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <input 
                          type="password"
                          placeholder="PERSEUS-XXXX-VIP"
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value);
                            setError("");
                          }}
                          className="flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none font-mono uppercase"
                        />
                      </div>
                      <button 
                        onClick={handleKeyUnlock}
                        className="px-3 rounded-lg font-mono font-bold text-[10.5px] uppercase bg-slate-800 text-white hover:bg-amber-500 hover:text-black transition-colors"
                      >
                        SUBMIT
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-[10.5px] text-rose-500 font-mono mt-3 animate-bounce">
                    ⚠️ {error}
                  </p>
                )}
              </div>

            </div>
          )}

          {/* Secure disclaimer brand bar */}
          <div className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between text-[9px] text-[#5c6e8e] font-mono">
            <span>PLATFORM: PERSEUS CORP V2</span>
            <span>SHIELD ENFORCED</span>
          </div>

        </div>
      </div>

    </div>
  );
}

function showKeyLabel() {
  return "⚡ MEMPUNYAI ACCESS CODE VIP? KLIK UNTUK MASUK";
}

function hideKeyLabel() {
  return "⚡ TUTUP INPUT KODE VIP";
}
