export interface TranslationSet {
  // Navigation
  home: string;
  features: string;
  mt5Bridge: string;
  terminal: string;
  liveChart: string;
  calendar: string;
  riskCalc: string;
  marketRate: string;
  aiAnalysis: string;
  vip: string;

  // Header System 
  liveTicker: string;
  setAlert: string;
  sidebarAccess: string;

  // Hero Section
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  heroBtnVip: string;
  heroBtnConnect: string;
  heroTrust: string;

  // Performance Section
  performanceTitle: string;
  performanceSubtitle: string;
  cloudPercent: string;
  cloudActive: string;
  latencyTitle: string;
  latencySub: string;
  accuracyTitle: string;
  accuracySub: string;
  monthlyTitle: string;
  monthlySub: string;

  // Home Interactive Center (HUD)
  hudBadge: string;
  hudTitle: string;
  hudSub: string;
  hudDeckActive: string;
  hudLiveFeed: string;
  hudTabHeatmap: string;
  hudTabOrderbook: string;
  hudTabAiPattern: string;
  hudTabMacroMatrix: string;
  hudTabRiskSandbox: string;

  // Status Alerts
  activeAlarm: string;
  voiceAnnouncements: string;
  voiceOn: string;
  voiceOff: string;
  languageSelect: string;

  // History / Backtest
  historyBadge: string;
  historyTitle: string;
  historySubtitle: string;
  exportCsv: string;
  exportJson: string;
  journalAdded: string;
  journalPlaceholder: string;
  writeNotes: string;
  saveJournalNotes: string;
  personalNotes: string;

  // Risk Calc
  riskTitle: string;
  riskSub: string;
  riskConnectionActive: string;
  riskConnectionManual: string;
  riskBalance: string;
  riskSaran: string;
  riskPercentLabel: string;
  riskExposure: string;
  recommendLot: string;
  threatSafe: string;
  threatModerat: string;
  threatTinggi: string;
  threatEkstrem: string;
}

export const translations: Record<"ID" | "EN", TranslationSet> = {
  ID: {
    home: "BERANDA",
    features: "FITUR SCAN",
    mt5Bridge: "MT5 BRIDGE",
    terminal: "TERMINAL HISTORI",
    liveChart: "LIVE CHART",
    calendar: "KALENDER EKONOMI",
    riskCalc: "KALKULATOR RESIKO",
    marketRate: "PASAR & KORELASI",
    aiAnalysis: "ANALISIS AI",
    vip: "VIP PASS",

    liveTicker: "PERSEUS LIVE TICKER",
    setAlert: "Setel Notifikasi Harga",
    sidebarAccess: "Akses Dashboard Hub Akun & Fitur Sekunder",

    heroTitle1: "TRADING LEBIH CERDAS",
    heroTitle2: "HASIL MAKSIMAL",
    heroSubtitle: "Perseus Intelligence mengalirkan data XAUUSD real-time, analisis multi-timeframe berbasis AI, dan sinyal presisi setingkat institusional dalam satu terminal terpadu.",
    heroBtnVip: "DAFTAR WHITELIST PRO",
    heroBtnConnect: "MENGHUBUNGKAN TERMINAL",
    heroTrust: "800+ institusi & retail trader mempercayai Perseus Terminal",

    performanceTitle: "PERFORMA PLATFORM",
    performanceSubtitle: "KECEPATAN, PRESISI, DOMINASI.",
    cloudPercent: "100%",
    cloudActive: "Platform Cloud Aktif",
    latencyTitle: "0.3ms",
    latencySub: "Sinergi Latency Data",
    accuracyTitle: "78%",
    accuracySub: "Akurasi Sinyal Teruji",
    monthlyTitle: "2.8JT+",
    monthlySub: "Eksekusi Analisis Bulanan",

    hudBadge: "PUSAT INTELIJEN PASAR",
    hudTitle: "PUSAT KOMANDO INTERAKTIF PERSEUS",
    hudSub: "Simulasikan, uji, dan lihat konfluensi data pasar modal secara langsung melalui panel interaktif dwi-fungsi visual terbaik kelas institusi.",
    hudDeckActive: "DEK_KOMANDO_UTAMA_AKTIF_v3.5",
    hudLiveFeed: "UMPAN DATA AKTIF",
    hudTabHeatmap: "PETA MOMENTUM",
    hudTabOrderbook: "BUKU LIKUIDITAS",
    hudTabAiPattern: "KORIDOR POLA AI",
    hudTabMacroMatrix: "MATRIKS MAKRO",
    hudTabRiskSandbox: "SANDBOX RISIKO",

    activeAlarm: "Notifikasi Harga Aktif",
    voiceAnnouncements: "Pemberitahuan Suara AI",
    voiceOn: "Suara Aktif",
    voiceOff: "Suara Senyap",
    languageSelect: "Bahasa",

    historyBadge: "JURNAL BACKTEST LIVE",
    historyTitle: "Histori Sinyal & Basis Data Backtest",
    historySubtitle: "Semua riwayat sinyal dihitung serta-merta berdasarkan backtest algoritma trend crossover pada data candlestick spot. Log ini termonitor secara realtime oleh modul evaluasi Perseus Engine.",
    exportCsv: "EKSPOR CSV DETIL",
    exportJson: "EKSPOR JSON DATA",
    journalAdded: "Jurnal diperbarui!",
    journalPlaceholder: "Masukkan catatan jurnal trading personal Anda...",
    writeNotes: "Tulis Catatan Jurnal",
    saveJournalNotes: "SIMPAN CATATAN",
    personalNotes: "Catatan Jurnal Pribadi",

    riskTitle: "Kalkulator Risiko & Posisi Lot",
    riskSub: "Modul perhitungan lot posisi emas di applet Perseus yang disinkronisasi presisi tinggi dengan terminal sinyal dan simulator stochastic Monte Carlo.",
    riskConnectionActive: "KONEKSI SINYAL AKTIF PERSEUS",
    riskConnectionManual: "MANUAL RISK SANDBOX",
    riskBalance: "Saldo Akun Utama (USD)",
    riskSaran: "Saran $2,000+",
    riskPercentLabel: "Persen Risiko Maksimal",
    riskExposure: "RISIKO FINANSIAL (USD)",
    recommendLot: "Rekomendasi Standard Lot",
    threatSafe: "SAFE SHIELD (RENDAH)",
    threatModerat: "TACTICAL ACCUM (CUKUP)",
    threatTinggi: "RISK WARNING (TINGGI)",
    threatEkstrem: "DESTRUCTIVE LIMIT (EKSTREM)"
  },
  EN: {
    home: "HOME",
    features: "SCAN FEATURES",
    mt5Bridge: "MT5 BRIDGE",
    terminal: "TERMINAL HISTORY",
    liveChart: "LIVE CHART",
    calendar: "ECONOMIC CALENDAR",
    riskCalc: "RISK CALCULATOR",
    marketRate: "MARKET CORRELATION",
    aiAnalysis: "AI ANALYSIS",
    vip: "VIP PASS",

    liveTicker: "PERSEUS LIVE TICKER",
    setAlert: "Set Price Alarm alerts",
    sidebarAccess: "Access Main Hub Dashboard & Features",

    heroTitle1: "TRADE SMARTER",
    heroTitle2: "MAXIMUM RESULTS",
    heroSubtitle: "Perseus Intelligence delivers real-time XAUUSD pricing datasets, multi-timeframe AI analytical forecasts, and institutional-grade custom signals inside a unified terminal interface.",
    heroBtnVip: "JOIN WHITESHEET PRO",
    heroBtnConnect: "CONNECT TERMINAL FEED",
    heroTrust: "800+ institutional & retail traders trust Perseus Terminal",

    performanceTitle: "PLATFORM PERFORMANCE Metrics",
    performanceSubtitle: "SPEED, ACCURACY, DOMINANCE.",
    cloudPercent: "100%",
    cloudActive: "Cloud Platform Active",
    latencyTitle: "0.3ms",
    latencySub: "Data Transmission Latency",
    accuracyTitle: "78%",
    accuracySub: "Verified Signal Accuracy",
    monthlyTitle: "2.8M+",
    monthlySub: "Monthly Analysis Batches",

    hudBadge: "MARKET INTELLIGENCE HUB",
    hudTitle: "PERSEUS COMMAND CENTER INTERACTIVE",
    hudSub: "Simulate, test, and trace custom capital market confluences using our top-tier institutional-grade dual-action visual decks.",
    hudDeckActive: "CORE_HUD_DECK_ACTIVE_v3.5",
    hudLiveFeed: "DATA FEED ACTIVE",
    hudTabHeatmap: "MOMENTUM MAP",
    hudTabOrderbook: "LIQUIDITY BOOK",
    hudTabAiPattern: "AI CORRIDORS",
    hudTabMacroMatrix: "MACRO MATRIX",
    hudTabRiskSandbox: "RISK SANDBOX",

    activeAlarm: "Active Price Alarms",
    voiceAnnouncements: "AI Voice Announcements",
    voiceOn: "Voice Enabled",
    voiceOff: "Voice Silent",
    languageSelect: "Language",

    historyBadge: "LIVE BACKTEST JOURNAL",
    historyTitle: "Signal History & Backtest Database",
    historySubtitle: "All signal records are compiled automatically from candlestick trend-crossover algorithmic backtesting, strictly monitored by the Perseus real-time engine.",
    exportCsv: "EXPORT DETAILED CSV",
    exportJson: "EXPORT JSON COMPACT",
    journalAdded: "Journal updated!",
    journalPlaceholder: "Enter custom trading journal thoughts, market factors, emotional state...",
    writeNotes: "Record Journal Notes",
    saveJournalNotes: "SAVE RECORD",
    personalNotes: "Trading Log Journal",

    riskTitle: "Risk & Position Sizing Calculator",
    riskSub: "Sizing calculator for precise spot gold lot volumes with interactive live signal sync and stochastic Monte Carlo drawdown simulator.",
    riskConnectionActive: "PERSEUS SIGNAL CONNECTED",
    riskConnectionManual: "MANUAL RISK SANDBOX",
    riskBalance: "Account Balance (USD)",
    riskSaran: "Recommended $2,000+",
    riskPercentLabel: "Max Balance Capital at Risk",
    riskExposure: "RISK AMOUNT AT PLAY (USD)",
    recommendLot: "Recommended Standard Lot Size",
    threatSafe: "SAFE SHIELD (LOW RISK)",
    threatModerat: "TACTICAL ACCUM (MODERATE)",
    threatTinggi: "RISK WARNING (HIGH RISK)",
    threatEkstrem: "DESTRUCTIVE LIMIT (EXTREME)"
  }
};
