import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;

// Define interfaces for our tables/entities
export interface BotConfig {
  botEnabled: boolean;
  mt5LotSize: number;
  mt5Slippage: number;
  telegramBotToken: string;
  telegramChatId: string;
  lastUpdateId: number;
  executionLogs: Array<{ time: string; type: string; message: string }>;
  riskProfile?: "CONSERVATIVE" | "BALANCED" | "TACTICAL";
}

export interface Signal {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  tp1: number;
  tp2: number;
  sl: number;
  time: string;
  status: "ACTIVE" | "WIN" | "LOSS" | "CANCELLED" | "INVALID";
  timeframe: string;
  riskReward: string;
  analysisType: string;
  confidence: number;
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  slHit?: boolean;
  commentary?: string;
  mt5TicketId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  telegram: string;
  vipUnlocked: boolean;
  vipUnlockedType: string; // "temporary" | "permanent" | "none"
  vipUnlockedTime: number;
  createdAt: number;
}

export interface AffiliateRecord {
  userId: string;
  code: string;
  clicks: number;
  signups: number;
  earnings: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  plan: string;
  createdAt: number;
}

// Global DB Structure for local file fallback
interface LocalDbSchema {
  botConfigs: Record<string, BotConfig>;
  signals: {
    activeLiveSignal: Signal | null;
    activeHistorySignals: Signal[];
  };
  users: Record<string, UserProfile>;
  affiliates: Record<string, AffiliateRecord>;
  payments: Record<string, PaymentRecord>;
}

// Determine if we can run PostgreSQL
const pgUrl = process.env.DATABASE_URL || process.env.PGURL || "";
let pool: pg.Pool | null = null;
const isPostgres = pgUrl.length > 0;

if (isPostgres) {
  console.log("[Database Engine] Initializing with PostgreSQL Pool (Railway Production Mode)...");
  pool = new Pool({
    connectionString: pgUrl,
    ssl: pgUrl.includes("sslmode=require") || pgUrl.includes("render.com") || pgUrl.includes("railway")
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("[Database Engine] Unexpected PostgreSQL Pool Error:", err);
  });
} else {
  console.log("[Database Engine] DATABASE_URL not set. Running in Local JSON Database Fallback Mode...");
}

// Local Fallback JSON setup
const fallbackPath = path.resolve(process.cwd(), "perseus-db-fallback.json");

function readLocalDb(): LocalDbSchema {
  try {
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[Database Engine] Error reading local JSON fallback DB:", err);
  }

  // Default empty state
  return {
    botConfigs: {},
    signals: {
      activeLiveSignal: null,
      activeHistorySignals: []
    },
    users: {},
    affiliates: {},
    payments: {}
  };
}

function writeLocalDb(data: LocalDbSchema) {
  try {
    fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Database Engine] Error writing local JSON fallback DB:", err);
  }
}

// AUTOMATIC POSTGRESQL TABLE CREATION (Migrations)
export async function initializeDatabaseSchema() {
  if (!isPostgres || !pool) {
    // Local JSON DB initialization
    const local = readLocalDb();
    // Pre-populate default bot configs if empty
    if (!local.botConfigs["master"]) {
      local.botConfigs["master"] = {
        botEnabled: true,
        mt5LotSize: 0.1,
        mt5Slippage: 3,
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
        telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
        lastUpdateId: 0,
        executionLogs: []
      };
      writeLocalDb(local);
    }
    return;
  }

  try {
    const client = await pool.connect();
    try {
      console.log("[Database Engine] Verifying/creating PostgreSQL database tables...");

      // 1. Create bot_configs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bot_configs (
          id VARCHAR(50) PRIMARY KEY,
          bot_enabled BOOLEAN DEFAULT TRUE,
          mt5_lot_size DOUBLE PRECISION DEFAULT 0.1,
          mt5_slippage INTEGER DEFAULT 3,
          telegram_bot_token VARCHAR(255) DEFAULT '',
          telegram_chat_id VARCHAR(100) DEFAULT '',
          last_update_id INTEGER DEFAULT 0,
          execution_logs TEXT DEFAULT '[]',
          risk_profile VARCHAR(50) DEFAULT 'BALANCED',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Create signals table
      await client.query(`
        CREATE TABLE IF NOT EXISTS signals (
          id VARCHAR(50) PRIMARY KEY,
          active_live_signal TEXT,
          active_history_signals TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) DEFAULT '',
          telegram VARCHAR(100) DEFAULT '',
          vip_unlocked BOOLEAN DEFAULT FALSE,
          vip_unlocked_type VARCHAR(50) DEFAULT 'none',
          vip_unlocked_time BIGINT DEFAULT 0,
          created_at BIGINT DEFAULT 0
        );
      `);

      // 4. Create affiliates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS affiliates (
          user_id VARCHAR(100) PRIMARY KEY,
          code VARCHAR(50) DEFAULT '',
          clicks INTEGER DEFAULT 0,
          signups INTEGER DEFAULT 0,
          earnings DOUBLE PRECISION DEFAULT 0.0
        );
      `);

      // 5. Create payments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          amount DOUBLE PRECISION DEFAULT 0.0,
          status VARCHAR(50) DEFAULT 'pending',
          plan VARCHAR(50) DEFAULT '',
          created_at BIGINT DEFAULT 0
        );
      `);

      // 6. Seed Default Bot Config if not exists
      const configRes = await client.query("SELECT id FROM bot_configs WHERE id = 'master'");
      if (configRes.rows.length === 0) {
        await client.query(`
          INSERT INTO bot_configs (id, bot_enabled, mt5_lot_size, mt5_slippage, telegram_bot_token, telegram_chat_id, last_update_id, execution_logs)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, ["master", true, 0.1, 3, process.env.TELEGRAM_BOT_TOKEN || "", process.env.TELEGRAM_CHAT_ID || "", 0, "[]"]);
        console.log("[Database Engine] Seeded default master bot configuration to PostgreSQL.");
      }

      console.log("[Database Engine] All PostgreSQL tables checked and initialized successfully.");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Database Engine] Migration / table initialization failed:", error);
  }
}

// -------------------------------------------------------------
// CENTRAL DATABASE CRUD ACTIONS (API-LEVEL SECURITY LAYER)
// -------------------------------------------------------------

// --- BOT CONFIGURATIONS ---
export async function dbGetBotConfig(id: string = "master"): Promise<BotConfig> {
  const defaultVal: BotConfig = {
    botEnabled: true,
    mt5LotSize: 0.1,
    mt5Slippage: 3,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
    telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
    lastUpdateId: 0,
    executionLogs: [],
    riskProfile: "BALANCED"
  };

  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return local.botConfigs[id] || defaultVal;
  }

  try {
    const res = await pool.query("SELECT * FROM bot_configs WHERE id = $1", [id]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      let logsParsed = [];
      try {
        logsParsed = JSON.parse(row.execution_logs || "[]");
      } catch {
        logsParsed = [];
      }
      return {
        botEnabled: row.bot_enabled,
        mt5LotSize: row.mt5_lot_size,
        mt5Slippage: row.mt5_slippage,
        telegramBotToken: row.telegram_bot_token || "",
        telegramChatId: row.telegram_chat_id || "",
        lastUpdateId: row.last_update_id || 0,
        executionLogs: logsParsed,
        riskProfile: row.risk_profile || "BALANCED"
      };
    }
    return defaultVal;
  } catch (err) {
    console.error("[DB Helper] dbGetBotConfig failed:", err);
    return defaultVal;
  }
}

export async function dbSaveBotConfig(id: string, config: BotConfig): Promise<void> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    local.botConfigs[id] = config;
    writeLocalDb(local);
    return;
  }

  try {
    await pool.query(`
      INSERT INTO bot_configs (id, bot_enabled, mt5_lot_size, mt5_slippage, telegram_bot_token, telegram_chat_id, last_update_id, execution_logs, risk_profile, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO UPDATE SET
        bot_enabled = EXCLUDED.bot_enabled,
        mt5_lot_size = EXCLUDED.mt5_lot_size,
        mt5_slippage = EXCLUDED.mt5_slippage,
        telegram_bot_token = EXCLUDED.telegram_bot_token,
        telegram_chat_id = EXCLUDED.telegram_chat_id,
        last_update_id = EXCLUDED.last_update_id,
        execution_logs = EXCLUDED.execution_logs,
        risk_profile = EXCLUDED.risk_profile,
        updated_at = NOW()
    `, [
      id,
      config.botEnabled,
      config.mt5LotSize,
      config.mt5Slippage,
      config.telegramBotToken,
      config.telegramChatId,
      config.lastUpdateId,
      JSON.stringify(config.executionLogs || []),
      config.riskProfile || "BALANCED"
    ]);
  } catch (err) {
    console.error("[DB Helper] dbSaveBotConfig failed:", err);
  }
}

// --- TRADING SIGNALS ---
export async function dbGetSignals(): Promise<{ activeLiveSignal: Signal | null; activeHistorySignals: Signal[] }> {
  const defaultVal = { activeLiveSignal: null, activeHistorySignals: [] };

  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return local.signals || defaultVal;
  }

  try {
    const res = await pool.query("SELECT * FROM signals WHERE id = 'master'");
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        activeLiveSignal: row.active_live_signal ? JSON.parse(row.active_live_signal) : null,
        activeHistorySignals: row.active_history_signals ? JSON.parse(row.active_history_signals) : []
      };
    }
    return defaultVal;
  } catch (err) {
    console.error("[DB Helper] dbGetSignals failed:", err);
    return defaultVal;
  }
}

export async function dbSaveSignals(active: Signal | null, history: Signal[]): Promise<void> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    local.signals = { activeLiveSignal: active, activeHistorySignals: history };
    writeLocalDb(local);
    return;
  }

  try {
    await pool.query(`
      INSERT INTO signals (id, active_live_signal, active_history_signals, updated_at)
      VALUES ('master', $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET
        active_live_signal = EXCLUDED.active_live_signal,
        active_history_signals = EXCLUDED.active_history_signals,
        updated_at = NOW()
    `, [
      active ? JSON.stringify(active) : null,
      JSON.stringify(history)
    ]);
  } catch (err) {
    console.error("[DB Helper] dbSaveSignals failed:", err);
  }
}

// --- USER PROFILES ---
export async function dbGetUser(uid: string): Promise<UserProfile | null> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return local.users[uid] || null;
  }

  try {
    const res = await pool.query("SELECT * FROM users WHERE uid = $1", [uid]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        uid: row.uid,
        email: row.email || "",
        telegram: row.telegram || "",
        vipUnlocked: row.vip_unlocked || false,
        vipUnlockedType: row.vip_unlocked_type || "none",
        vipUnlockedTime: Number(row.vip_unlocked_time || 0),
        createdAt: Number(row.created_at || 0)
      };
    }
    return null;
  } catch (err) {
    console.error("[DB Helper] dbGetUser failed:", err);
    return null;
  }
}

export async function dbSaveUser(user: UserProfile): Promise<void> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    local.users[user.uid] = user;
    writeLocalDb(local);
    return;
  }

  try {
    await pool.query(`
      INSERT INTO users (uid, email, telegram, vip_unlocked, vip_unlocked_type, vip_unlocked_time, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (uid) DO UPDATE SET
        email = EXCLUDED.email,
        telegram = EXCLUDED.telegram,
        vip_unlocked = EXCLUDED.vip_unlocked,
        vip_unlocked_type = EXCLUDED.vip_unlocked_type,
        vip_unlocked_time = EXCLUDED.vip_unlocked_time
    `, [
      user.uid,
      user.email,
      user.telegram,
      user.vipUnlocked,
      user.vipUnlockedType,
      user.vipUnlockedTime,
      user.createdAt
    ]);
  } catch (err) {
    console.error("[DB Helper] dbSaveUser failed:", err);
  }
}

export async function dbGetAllUsers(): Promise<UserProfile[]> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return Object.values(local.users);
  }

  try {
    const res = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return res.rows.map(row => ({
      uid: row.uid,
      email: row.email || "",
      telegram: row.telegram || "",
      vipUnlocked: row.vip_unlocked || false,
      vipUnlockedType: row.vip_unlocked_type || "none",
      vipUnlockedTime: Number(row.vip_unlocked_time || 0),
      createdAt: Number(row.created_at || 0)
    }));
  } catch (err) {
    console.error("[DB Helper] dbGetAllUsers failed:", err);
    return [];
  }
}

// --- AFFILIATES ---
export async function dbGetAffiliate(userId: string): Promise<AffiliateRecord | null> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return local.affiliates[userId] || null;
  }

  try {
    const res = await pool.query("SELECT * FROM affiliates WHERE user_id = $1", [userId]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        userId: row.user_id,
        code: row.code || "",
        clicks: row.clicks || 0,
        signups: row.signups || 0,
        earnings: Number(row.earnings || 0)
      };
    }
    return null;
  } catch (err) {
    console.error("[DB Helper] dbGetAffiliate failed:", err);
    return null;
  }
}

export async function dbSaveAffiliate(affiliate: AffiliateRecord): Promise<void> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    local.affiliates[affiliate.userId] = affiliate;
    writeLocalDb(local);
    return;
  }

  try {
    await pool.query(`
      INSERT INTO affiliates (user_id, code, clicks, signups, earnings)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        code = EXCLUDED.code,
        clicks = EXCLUDED.clicks,
        signups = EXCLUDED.signups,
        earnings = EXCLUDED.earnings
    `, [
      affiliate.userId,
      affiliate.code,
      affiliate.clicks,
      affiliate.signups,
      affiliate.earnings
    ]);
  } catch (err) {
    console.error("[DB Helper] dbSaveAffiliate failed:", err);
  }
}

export async function dbGetAllAffiliates(): Promise<AffiliateRecord[]> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return Object.values(local.affiliates);
  }

  try {
    const res = await pool.query("SELECT * FROM affiliates");
    return res.rows.map(row => ({
      userId: row.user_id,
      code: row.code || "",
      clicks: row.clicks || 0,
      signups: row.signups || 0,
      earnings: Number(row.earnings || 0)
    }));
  } catch (err) {
    console.error("[DB Helper] dbGetAllAffiliates failed:", err);
    return [];
  }
}

// --- PAYMENTS ---
export async function dbGetPayment(id: string): Promise<PaymentRecord | null> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return local.payments[id] || null;
  }

  try {
    const res = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        amount: Number(row.amount || 0),
        status: row.status,
        plan: row.plan || "",
        createdAt: Number(row.created_at || 0)
      };
    }
    return null;
  } catch (err) {
    console.error("[DB Helper] dbGetPayment failed:", err);
    return null;
  }
}

export async function dbSavePayment(payment: PaymentRecord): Promise<void> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    local.payments[payment.id] = payment;
    writeLocalDb(local);
    return;
  }

  try {
    await pool.query(`
      INSERT INTO payments (id, user_id, amount, status, plan, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        plan = EXCLUDED.plan
    `, [
      payment.id,
      payment.userId,
      payment.amount,
      payment.status,
      payment.plan,
      payment.createdAt
    ]);
  } catch (err) {
    console.error("[DB Helper] dbSavePayment failed:", err);
  }
}

export async function dbGetAllPayments(): Promise<PaymentRecord[]> {
  if (!isPostgres || !pool) {
    const local = readLocalDb();
    return Object.values(local.payments);
  }

  try {
    const res = await pool.query("SELECT * FROM payments ORDER BY created_at DESC");
    return res.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount || 0),
      status: row.status,
      plan: row.plan || "",
      createdAt: Number(row.created_at || 0)
    }));
  } catch (err) {
    console.error("[DB Helper] dbGetAllPayments failed:", err);
    return [];
  }
}

// Spark system
initializeDatabaseSchema();
