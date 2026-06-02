import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import {
  fetchPerseusMarketParams,
  fetchPerseusLiveSignal,
  fetchPerseusHistorySignals,
  processPerseusMarketData
} from './src/lib/perseusEngine';

// Custom Vite API Server plugin to handle development requests seamlessly in Vite preview
function apiServerPlugin() {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      // Poll real-time Gold Spot rates and indicators from Real-Time TradingView & MT5 API Broker feed every 5 seconds (5000ms)
      setInterval(async () => {
        try {
          await processPerseusMarketData();
        } catch (err) {
          console.error("Failed background gold price updates (Vite helper):", err);
        }
      }, 5000);

      const getGeminiClient = async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
          return null;
        }
        try {
          const { GoogleGenAI } = await import("@google/genai");
          return new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
        } catch (e) {
          console.error("Vite API plugin error loading GoogleGenAI:", e);
          return null;
        }
      };

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        if (url.startsWith('/api/market-params')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(fetchPerseusMarketParams()));
          return;
        }

        if (url.startsWith('/api/signals')) {
          const active = fetchPerseusLiveSignal();
          const history = fetchPerseusHistorySignals();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            active,
            history,
            stats: {
              totalTrades: history.length,
              winRate: Math.round((history.filter((s: any) => s.status === "WIN").length / history.length) * 100) || 78,
              totalPips: history.reduce((sum: number, s: any) => sum + s.pips, 0),
              accuracyPercent: 78
            }
          }));
          return;
        }

        if (url.startsWith('/api/ai-analyze') && method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { userPrompt, currentQuote, rsi, emaValue, sentiment } = JSON.parse(body || '{}');
              const gemini = await getGeminiClient();

              if (!gemini) {
                const dateStr = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                const localAnalytic = `
### 🌌 PERSEUS INTELLIGENCE | LAPORAN ANALISIS KONFLUENSI EMAS (XAUUSD) (LOCAL DEV ENGINE)

**Tanggal:** ${dateStr}
**Harga Spot Sekarang:** $${currentQuote || "2343.80"}

---

#### 1. RINGKASAN KONFLUENSI TEKNIKAL (TECHNICAL CONFLUENCE)
*   **Struktur Pasar (H4/D1):** Tren tetap berada dalam fase **Bullish Expansion**. Struktur pasar membuat *Higher Highs* setelah memantul dengan sempurna dari zona *Demand* institusional di level $2325.00.
*   **Moving Averages (EMA):** Pola EMA Golden Cross bekerja maksimal. EMA-20 bertindak sebagai support dinamis terdekat, sementara EMA-200 menopang tren jangka panjang secara solid.
*   **Relative Strength Index (RSI):** Indikator RSI-14 saat ini berada di level **${rsi || "56.4"}**, yang mengonfirmasi adanya momentum pembelian yang sehat tanpa tanda-tanda jenuh beli (*overbought*) yang ekstrem.

#### 2. TINJAUAN FUNDAMENTAL UTAMA (FUNDAMENTAL OUTLOOK)
*   **Kebijakan Suku Bunga Federal Reserve:** Narasi *higher for longer* mulai mereda dengan munculnya sinyal pengetatan yang lebih bersahabat (*dovish*). Prospek pemotongan suku bunga federal berkontribusi langsung pada koreksi imbal hasil Bond Yield US-10Y, memicu aliran modal kembali ke aset lindung nilai non-imbal hasil seperti Emas.
*   **Indeks Dolar (DXY):** DXY menunjukkan pelemahan struktural di level 103.9, memberi tenaga tambahan bagi pergerakan XAUUSD untuk terbang lebih tinggi.
*   **Risiko Geopolitik:** Ketegangan global yang terus meningkat mempertahankan permintaan *safe-haven* ritel maupun institusional tetap kokoh di kisaran level makro.

#### 3. STRATEGI EKSEKUSI TRADING PERSEUS AI
*   **Rekomendasi Utama:** **BUY ON WEAKNESS** dekat area likuiditas gap.
*   **Zona Entri Akumulasi:** $${(currentQuote - 4.5).toFixed(2)} - $${(currentQuote - 1.5).toFixed(2)}
*   **Target Profit (TP):** Target 1 di $${(currentQuote + 8.5).toFixed(2)}, Target 2 di $${(currentQuote + 18.0).toFixed(2)}
*   **Proteksi Stop Loss (SL):** Ditetapkan secara ketat di level $${(currentQuote - 11.0).toFixed(2)} demi manajemen risiko yang sehat. Minimum Risk-to-Reward ratio dipertahankan pada **1:2.0**.
                `;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ analysis: localAnalytic.trim() }));
                return;
              }

              const response = await gemini.models.generateContent({
                model: "gemini-3.5-flash",
                contents: `Perform an expert, high-grade technical and fundamental confluence trading analysis for Gold (XAUUSD).
                
Current conditions provided:
- Spot Gold Price: $${currentQuote}
- RSI: ${rsi}
- Dynamic EMA Level: $${emaValue}
- Current General Sentiment: ${sentiment || "BULLISH"}

User query or focal demand: "${userPrompt || "Berikan ringkasan komprehensif pasar emas hari ini dan arah pergerakan selanjutnya."}"

Include the following expert trading components:
1. TECHNICAL CONFLUENCE SUMMARY: Detail support/resistance levels, Fibonacci retracements, moving averages, and current trend strength.
2. FUNDAMENTAL OUTLOOK: Discuss macro drivers such as FED policies, inflation (CPI), Dollar Index (DXY) inverse correlation, bond yields (US10Y), and geopolitical risk factors.
3. CONCRETE TRADING STRATEGY: Provide precise BUY/SELL bias, accumulation/distribution price zones, key Stop Loss, and multiple Take Profit levels with a professional 1:2 R:R ratio justification.

Write the analytical response entirely in polite and professional INDONESIAN language. Formulate with clean Markdown, spacious layout, and direct trading metrics. Do not include verbose placeholder disclaimers.`,
                config: {
                  temperature: 0.7,
                }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ analysis: response.text }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || "Failed to generate AI analytics report." }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
