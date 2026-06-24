import React, { useState, useRef, useEffect } from "react";
import { Check, Send, Award, Users, CheckCircle, ShieldCheck, Terminal, Compass, Flame, ShieldAlert, Key, Globe, Radio, LogIn } from "lucide-react";
import { motion } from "motion/react";

export default function VIPView() {
  const [formData, setFormData] = useState({
    name: "Trader",
    email: "",
    plan: "pro-ai",
    telegram: ""
  });

  const [submitted, setSubmitted] = useState<boolean>(false);

  // 3D Card Hover States
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (-15deg to 15deg)
    const rotateX = ((centerY - y) / centerY) * 14;
    const rotateY = ((x - centerX) / centerX) * 14;
    
    // Calculate glare position in percentage
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const mockLiveLogs = [
    { trader: "Beni_XAU", plan: "PRO AI", time: "2 menit lalu", flag: "🇮🇩" },
    { trader: "Alex_Sg", plan: "VIP ELITE", time: "8 menit lalu", flag: "🇸🇬" },
    { trader: "Hadi_FX", plan: "STARTER", time: "15 menit lalu", flag: "🇮🇩" },
    { trader: "Zul_KL", plan: "PRO AI", time: "28 menit lalu", flag: "🇲🇾" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.telegram.trim()) return;
    
    const uid = localStorage.getItem("perseus_uid") || "usr-" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("perseus_uid", uid);
    if (formData.email) {
      localStorage.setItem("perseus_email", formData.email);
    }
    
    fetch("/api/vip/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        name: formData.name,
        email: formData.email || `${uid}@perseus.app`,
        telegram: formData.telegram,
        plan: formData.plan
      })
    })
    .then((res) => res.json())
    .then((data) => {
      console.log("[VIP Registration] Successfully registered via PostgreSQL database API:", data);
      setSubmitted(true);
    })
    .catch((err) => {
      console.error("[VIP Registration] API registration failed, falling back gracefully to local client state:", err);
      setSubmitted(true);
    });
  };

  const plansMeta = {
    "starter": {
      name: "STARTER DECK",
      serial: "PR-609-STRT",
      tagline: "Standard Confluence Account",
      color: "from-blue-600 to-indigo-900 border-indigo-500/30",
      accent: "text-indigo-400",
      glowBg: "rgba(99, 102, 241, 0.15)",
      pipsTarget: "+150 pips/week",
      features: [
        "Sinyal standar XAUUSD",
        "Akurasi harian hancur 74%-78%",
        "Support Telegram Publik",
        "Manual risk input guide"
      ]
    },
    "pro-ai": {
      name: "PRO AI PASS",
      serial: "PR-350-XAU",
      tagline: "Neural Signal Engine Access",
      color: "from-amber-600 via-[#ff6a00] to-yellow-900 border-orange-500/55",
      accent: "text-amber-400",
      glowBg: "rgba(249, 115, 22, 0.25)",
      pipsTarget: "+450-600 pips/week",
      features: [
        "Sinyal dengan neural network models",
        "Akurasi terverifikasi 86%+",
        "Konsultasi prompt bot kustom",
        "Instant sound alarm notification",
        "Akses 15 indikator confluence"
      ]
    },
    "vip-elite": {
      name: "VIP ELITE BLACK",
      serial: "PR-001-ELITE",
      tagline: "Institutional Private Core",
      color: "from-slate-900 via-zinc-950 to-neutral-900 border-yellow-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      accent: "text-yellow-400",
      glowBg: "rgba(234, 179, 8, 0.2)",
      pipsTarget: "+900+ pips/week",
      features: [
        "Akses bot elite eksklusif (no delay)",
        "Akurasi super premium harian",
        "Akademi bimbingan mentor institusi",
        "Swap-free account whitelist",
        "Akses 1-on-1 dengan Perseus Core Team"
      ]
    }
  };

  const currentPlan = plansMeta[formData.plan as keyof typeof plansMeta] || plansMeta["pro-ai"];

  return (
    <div className="w-full text-slate-200 animated-matrix-grid relative overflow-hidden bg-[#020204]">
      
      {/* Space Ambient Dust Graphics */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-5 w-48 h-48 rounded-full bg-orange-500/5 blur-[90px] animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-[120px] animate-float-slow"></div>
        <div className="absolute bottom-16 left-1/4 w-32 h-32 rounded-full bg-amber-400/5 blur-[70px] animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10 font-sans">
        
        {/* Portal Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/20 border border-orange-500/30 text-orange-400 font-mono text-[9px] uppercase font-black tracking-widest mb-3 select-none">
            <Award className="w-4 h-4 text-orange-500 animate-spin-slow" /> VIP MEMBERSHIP PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider leading-none mb-3">
            PERSEUS ELITE <span className="text-orange-400 hologram-gold-glow">WHITELIST</span> PORTAL
          </h1>
          <p className="text-xs sm:text-sm text-[#BFC7E6]/75 font-normal leading-relaxed">
            Dapatkan status keanggotaan institusi harian, aktifkan instan server trading emas swap-free 0.3ms latency, dan nikmati sinyal akurasi 86%+ tanpa batas.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 font-mono text-[10px] font-black uppercase">
            <Flame className="w-3.5 h-3.5 animate-bounce" /> SLOT WHITELIST HARI INI: <span className="text-white underline font-extrabold bg-rose-500 px-1 py-0.2 rounded">3 SLOT SISA</span>
          </div>
        </div>

        {/* Master Portal Console layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Left panel: Whitelist Application Form */}
          <div className="lg:col-span-7 p-8 rounded-2xl bg-[#07070c] border border-gray-900/60 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
            
            <div>
              <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider mb-6 pb-4 border-b border-[#14141a] flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-orange-500 animate-pulse" /> WHITELIST SECURE UPLOAD GATE
              </h3>

              {submitted ? (
                <div className="p-8 text-center bg-orange-500/5 border border-orange-500/20 rounded-xl animate-in fade-in zoom-in duration-300">
                  <CheckCircle className="w-16 h-16 text-[#00ff66] mx-auto mb-4 hologram-counter-glow animate-pulse" />
                  <h4 className="font-display font-black text-[#f8fafc] text-base mb-2 uppercase tracking-wide">PERMOHONAN WHITELIST TERKONTROL!</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">
                    Username Telegram Anda <span className="text-orange-400 font-bold">{formData.telegram}</span> dan email <span className="text-white font-semibold">{formData.email}</span> telah dimasukkan antrean VIP prioritas. Tim verifikasi kami akan meneliti akun Anda secara real-time.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "Trader", email: "guest@perseus.app", plan: "pro-ai", telegram: "" });
                    }}
                    className="px-6 py-3 rounded bg-gradient-to-r from-[#0c0c10] to-[#14141a] border border-[#1c1c24] hover:border-orange-500/40 text-xs text-orange-400 font-display font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    DAFTARKAN FORMULIR BARU
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                  
                  {/* Interactive Plan Select Grid (Replaces old style input with visual premium cards!) */}
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider mb-2.5">
                      PILIH LEVEL KEAUNGGOTAAN VIP (KLIK UNTUK MEMILIH):
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {Object.keys(plansMeta).map((key) => {
                        const meta = plansMeta[key as keyof typeof plansMeta];
                        const isSelected = formData.plan === key;
                        return (
                          <div
                            key={key}
                            onClick={() => setFormData({ ...formData, plan: key })}
                            className={`p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer flex flex-col justify-between h-24 ${
                              isSelected 
                                ? "bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(255,106,0,0.15)]" 
                                : "bg-black/40 border-gray-900/60 hover:border-gray-800"
                            }`}
                          >
                            <span className="font-mono text-[8.5px] text-gray-500 block uppercase font-bold">PACKAGE Plan</span>
                            <span className={`font-display text-[9px] font-black block tracking-wide ${isSelected ? "text-orange-400" : "text-white"}`}>
                              {meta.name.split(" ")[0]}
                            </span>
                            <span className="font-mono text-[9px] text-emerald-400 font-bold block">{meta.pipsTarget.split(" ")[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider mb-2">Nama Lengkap Anda</label>
                      <input
                        id="whitelist-input-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Contoh: Guest User"
                        className="w-full p-3.5 bg-[#030305] border border-gray-900 focus:border-orange-500 focus:outline-none text-white text-xs font-mono rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider mb-2">Alamat Email Terdaftar</label>
                      <input
                        id="whitelist-input-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="guest@perseus.app"
                        className="w-full p-3.5 bg-[#030305] border border-gray-900 focus:border-orange-500 focus:outline-none text-white text-xs font-mono rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider mb-2">Username Telegram</label>
                    <input
                      id="whitelist-input-telegram"
                      type="text"
                      required
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      placeholder="Contoh: @erni_fx"
                      className="w-full p-3.5 bg-[#030305] border border-gray-900 focus:border-orange-500 focus:outline-none text-white text-xs font-mono rounded-lg"
                    />
                  </div>

                  <button
                    id="btn-whitelist-submit"
                    type="submit"
                    className="shine-button w-full py-4 text-xs font-display font-black uppercase tracking-widest text-black bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl border border-orange-400 hover:from-orange-400 hover:to-amber-500 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-4 shadow-[0_0_20px_rgba(255,106,0,0.15)]"
                  >
                    <Send className="w-4 h-4" /> SECURE TRANSMIT WHITELIST DATA
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-[10.5px] sm:text-xs text-slate-400 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-[#00ff66] shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[#00ff66] font-black uppercase block tracking-wider mb-0.5">GARANSI ENKRIPSI PLATFORM:</span>
                Semua data diproteksi SSL SHA-256 tingkat perbankan internasional. Perseus Group tidak terafiliasi dengan broker ritel manipulatif mana pun.
              </div>
            </div>
          </div>

          {/* Right panel: Member status, 3D CARD, metrics & client join list */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
            
            {/* 3D TACTILE GLOSS KEYCARD PREVIEW CARD */}
            <div className="p-6 bg-[#07070a]/90 border border-gray-900/60 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/2 rounded-full blur-xl" />
              <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Key className="w-4 h-4 text-orange-400" /> TACTILE 3D CHIP CARD PREVIEW</span>
                <span className="text-[8px] text-emerald-400 font-mono tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE STATUS</span>
              </h3>

              {/* Physical Card Container with relative tracking */}
              <div 
                className="w-full flex justify-center py-4 select-none cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  ref={cardRef}
                  style={{
                    transform: isHovered 
                      ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.03)` 
                      : 'perspective(1000px) rotateX(4deg) rotateY(-8deg) scale(1)',
                    transformStyle: 'preserve-3d',
                    transition: isHovered ? 'none' : 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                  className={`w-full max-w-[340px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br p-5 relative overflow-hidden flex flex-col justify-between shadow-3d-card border ${currentPlan.color}`}
                >
                  {/* Dynamic Gloss / Glare overlay tracking mouse pointer */}
                  {isHovered && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 opacity-35 mix-blend-color-dodge transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle 180px at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.7), transparent)`
                      }}
                    />
                  )}

                  {/* Top edge card network details */}
                  <div className="flex items-start justify-between relative" style={{ transform: 'translateZ(30px)' }}>
                    <div>
                      <span className="block font-display text-[10px] font-black text-white leading-none tracking-widest">PERSEUS DIGITAL LINK</span>
                      <span className="font-mono text-[7px] text-slate-400 tracking-wider">SECURED QUANTUM CHANNEL</span>
                    </div>
                    <Radio className="w-4 h-4 text-[#00ff66] animate-pulse" />
                  </div>

                  {/* Golden Microchip Graphics render */}
                  <div className="w-8 h-6 rounded bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-300/40 relative flex items-center justify-center overflow-hidden" style={{ transform: 'translateZ(20px)' }}>
                    <div className="absolute inset-0 border-r border-b border-black/25 grid grid-cols-3 grid-rows-3 opacity-60">
                      <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
                    </div>
                    <div className="w-2.5 h-2 rounded-sm bg-black/5" />
                  </div>

                  {/* Card Number & Holder info */}
                  <div className="mt-4 relative" style={{ transform: 'translateZ(25px)' }}>
                    <div className="font-mono text-[11px] font-bold text-white tracking-[2.5px] flex justify-between">
                      <span>4417</span>
                      <span>8596</span>
                      <span>5012</span>
                      <span className="text-orange-400">{currentPlan.serial.split("-")[1]}</span>
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <span className="block font-mono text-[6px] text-slate-500 uppercase leading-none font-bold">MEMBER DECK</span>
                        <span className="font-display text-[9.5px] font-black text-white block uppercase tracking-wide">
                          {formData.name || "ERNI MUDRIKA"}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="block font-mono text-[6px] text-slate-500 uppercase leading-none font-bold">PLAN KEY</span>
                        <span className="font-mono text-[8px] text-orange-400 font-black block">
                          {currentPlan.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Displaying Plan perks below the 3D card */}
              <div className="mt-4 space-y-3 bg-black/40 border border-gray-900/60 p-4 rounded-xl">
                <span className="text-[8px] font-mono text-gray-500 block uppercase font-bold tracking-widest">TARGET PROFIT POTENSIAL &amp; FITUR:</span>
                <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                  <span className="text-xs font-mono text-gray-400">Target Mingguan</span>
                  <span className="text-xs font-mono font-black text-emerald-400">{currentPlan.pipsTarget}</span>
                </div>
                <ul className="space-y-1.5 text-[10.5px] text-gray-400 list-inside">
                  {currentPlan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 leading-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Live Subs Logs Ticker */}
            <div className="p-6 bg-[#07070a] border border-[#14141a] rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/2 rounded-full blur-xl animate-pulse" />
              <h3 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400 animate-pulse" /> LIVE SUBSCRIPTION JOURNAL
              </h3>
              
              <div className="space-y-3">
                {mockLiveLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-[#030305] border border-gray-900/40 rounded-xl font-mono text-[11px] hover:border-orange-500/20 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">{log.flag}</span>
                      <span className="text-white font-black">{log.trader}</span>
                      <span className="text-slate-500">joined</span>
                      <span className="text-orange-400 font-bold">{log.plan}</span>
                    </div>
                    <span className="text-[10px] text-slate-650 shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Whitelisted Perks items */}
            <div className="p-6 bg-[#07070a] border border-[#14141a] rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-emerald-500/2 rounded-full blur-xl" />
              <h4 className="font-display font-black text-xs text-[#f8fafc] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" /> PERK BENEFIT ANGGOTA VIP
              </h4>
              
              <ul className="space-y-3.5 text-xs text-slate-400 font-normal leading-relaxed">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#00ff66]" />
                  </div>
                  <span>Sinyal instan dipancarkan langsung ke bot privat Telegram instan (delay 0 ms).</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#00ff66]" />
                  </div>
                  <span>Konsultasi pola teknikal emas harian dipandu langsung analis senior pasar emas spot.</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#00ff66]" />
                  </div>
                  <span>Akses server berlatensi super ketat 0.3ms bebas repainting data lilin.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
