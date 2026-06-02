import React, { useState } from "react";
import { X, Bell, Trash2, Plus, AlertCircle, BellOff, ArrowUpRight, ArrowDownRight, History } from "lucide-react";

export interface PriceAlert {
  id: string;
  targetPrice: number;
  condition: "above" | "below";
  createdAt: number;
  triggeredAt?: number;
  isTriggered: boolean;
  triggeredValue?: number;
}

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  alerts: PriceAlert[];
  onAddAlert: (targetPrice: number, condition: "above" | "below") => void;
  onDeleteAlert: (id: string) => void;
  onClearHistory: () => void;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  currentPrice,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onClearHistory
}: PriceAlertModalProps) {
  const [targetPriceInput, setTargetPriceInput] = useState<string>(currentPrice.toFixed(2));
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPriceInput);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Silakan masukkan harga emas yang valid (angka positif).");
      return;
    }
    
    // Prevent adding identical duplicates
    const duplicate = alerts.find(a => !a.isTriggered && a.targetPrice === priceNum && a.condition === condition);
    if (duplicate) {
      setErrorMessage("Notifikasi serupa sudah aktif untuk tingkat harga ini!");
      return;
    }

    onAddAlert(priceNum, condition);
    setErrorMessage("");
    // Reset inputs
    setTargetPriceInput(currentPrice.toFixed(2));
  };

  const activeAlerts = alerts.filter((a) => !a.isTriggered);
  const triggeredAlerts = alerts.filter((a) => a.isTriggered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-[#080a11] border border-[#212b3e] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        id="price-alert-modal-container"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0c0f17] border-b border-[#1b2332] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-black text-white tracking-tight uppercase">Sinyal Alarm Perseus</h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Setel Notifikasi Harga XAUUSD</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1b2332] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Panel (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          
          {/* Current Live Price display card */}
          <div className="p-4 bg-[#0b0e14] border border-[#1b2435] rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Live Spot Gold</span>
              <span className="text-xl font-mono font-bold text-white tracking-tight">
                XAUUSD
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider block bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 mb-1">
                Active Live Rate
              </span>
              <span className="text-xl font-mono font-black text-amber-400">
                ${currentPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Alert Setter Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-[11px] font-mono uppercase text-amber-500 font-bold tracking-wider">
              ✦ Buat Alarm Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Alert Condition Selector */}
              <div>
                <label className="block text-[10px] text-gray-400 font-mono uppercase tracking-wider mb-1.5">
                  Kriteria Pemicu
                </label>
                <div className="flex rounded-md border border-[#1d273a] overflow-hidden bg-[#0a0d14]">
                  <button
                    type="button"
                    onClick={() => setCondition("above")}
                    className={`flex-1 py-2 text-xs font-sans font-bold flex items-center justify-center gap-1 transition-colors ${
                      condition === "above"
                        ? "bg-amber-500 text-black"
                        : "text-gray-400 hover:text-white hover:bg-[#121822]"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Bila Menembus Keatas (&ge;)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition("below")}
                    className={`flex-1 py-2 text-xs font-sans font-bold flex items-center justify-center gap-1 transition-colors ${
                      condition === "below"
                        ? "bg-amber-500 text-black"
                        : "text-gray-400 hover:text-white hover:bg-[#121822]"
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Bila Menembus Kebawah (&le;)
                  </button>
                </div>
              </div>

              {/* Target Price input */}
              <div>
                <label className="block text-[10px] text-gray-400 font-mono uppercase tracking-wider mb-1.5">
                  Nilai Target Harga (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    className="w-full text-xs font-mono font-bold pl-7 pr-16 py-2 rounded-md bg-[#0a0d14] border border-[#1d273a] text-white focus:outline-none focus:border-amber-500"
                    placeholder="2340.00"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetPriceInput(currentPrice.toFixed(2))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-[#16202f] border border-[#2b3a53] text-amber-400 px-1.5 py-0.5 rounded hover:text-white transition-colors"
                  >
                    Set Live
                  </button>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all outline-none"
            >
              <Plus className="w-4 h-4" /> Tambah Alarm Monitor
            </button>
          </form>

          {/* Active Alerts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1b2332] pb-2">
              <h4 className="text-[11px] font-mono uppercase text-amber-500 font-bold tracking-wider flex items-center gap-1.5">
                <span>⏰ Aktivitas Monitoring Aktif</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                  {activeAlerts.length}
                </span>
              </h4>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="p-6 bg-[#080b11] border border-dashed border-[#1d2535] rounded-lg text-center">
                <BellOff className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-gray-500">Tidak ada alarm aktif saat ini.</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Silakan tambahkan target harga di atas untuk memulai pengawasan.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {activeAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3 bg-[#0a0d14] border border-[#1b2535] rounded-md flex items-center justify-between hover:bg-[#0c101a] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      {alert.condition === "above" ? (
                        <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-white">
                            XAUUSD {alert.condition === "above" ? "≥" : "≤"} ${alert.targetPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500">
                          Dibuat: {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Hapus Alarm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triggered Alerts History */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#1b2332] pb-2">
              <h4 className="text-[11px] font-mono uppercase text-gray-400 font-bold tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-gray-500" />
                <span>📜 Riwayat Alarm Terpenuhi</span>
                <span className="px-1.5 py-0.2 rounded bg-gray-500/10 text-gray-400 text-[10px] font-bold">
                  {triggeredAlerts.length}
                </span>
              </h4>
              {triggeredAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                >
                  Bersihkan Riwayat
                </button>
              )}
            </div>

            {triggeredAlerts.length === 0 ? (
              <div className="p-3 bg-[#080b11] border border-dashed border-[#1d2535] rounded-lg text-center">
                <span className="text-[10px] text-gray-600 block">Belum ada riwayat alarm terpicu.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {triggeredAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-2.5 bg-[#0a0d14]/40 border border-[#1b2535]/50 rounded-md flex items-center justify-between opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <div>
                        <div className="text-xs font-mono text-gray-300">
                          XAUUSD {alert.condition === "above" ? "≥" : "≤"} ${alert.targetPrice.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-mono text-gray-500">
                          Terpicu pada ${alert.triggeredValue?.toFixed(2) || alert.targetPrice.toFixed(2)} ({alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : ""})
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer info lock */}
        <div className="px-6 py-4 bg-[#06080c] border-t border-[#1b2332] flex items-center justify-between">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
            Penyimpanan: Client LocalStorage Cache
          </span>
          <span className="text-[9px] font-mono text-amber-500 px-1.5 py-0.5 rounded bg-amber-500/5 border border-amber-500/12">
            Perseus Core Engine Live
          </span>
        </div>
      </div>
    </div>
  );
}
