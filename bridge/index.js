/**
 * WhatsCommerce — WhatsApp Web (QR) bridge · MULTI-TENANT
 * ------------------------------------------------------
 * Deploy ONCE for the whole platform. Holds many WhatsApp Web sessions, one per
 * store (keyed by storeId). Each store pairs from its own dashboard by scanning
 * a QR — no per-store deploy or env needed.
 *
 * UNOFFICIAL channel (not the Meta Cloud API). Meta may ban automated numbers.
 * Needs an always-on host (Railway/Render/VPS) and a persistent volume.
 *
 * Auth (all /sessions/* routes): header `x-bridge-token: <ADMIN_TOKEN>`
 *   POST /sessions/:storeId/start   → ensure a session is running → { status }
 *   GET  /sessions/:storeId/qr      → { status, qr }  (qr = data URL while pairing)
 *   GET  /sessions/:storeId/status  → { status }
 *   POST /sessions/:storeId/send    → { to, text }
 *   POST /sessions/:storeId/logout  → unlink the number
 *   GET  /health                    → ok (no auth)
 *
 * Inbound messages + status are POSTed to:
 *   ${APP_URL}/api/webhooks/whatsapp-web  with x-bridge-token + { storeId, ... }
 *
 * Env:
 *   APP_URL      public URL of the WhatsCommerce app
 *   ADMIN_TOKEN  shared platform secret (also set as WA_BRIDGE_ADMIN_TOKEN in the app)
 *   PORT         default 8080
 *   AUTH_DIR     persistent sessions root (default ./auth) — MOUNT A VOLUME
 */
import fs from "fs";
import path from "path";
import express from "express";
import qrcode from "qrcode";
import pino from "pino";
import { Boom } from "@hapi/boom";
import baileys, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";

const makeWASocket = baileys.default || baileys.makeWASocket;

const APP_URL = process.env.APP_URL;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PORT = process.env.PORT || 8080;
const AUTH_DIR = process.env.AUTH_DIR || "./auth";

if (!APP_URL || !ADMIN_TOKEN) {
  console.error("Missing env: APP_URL and ADMIN_TOKEN are required.");
  process.exit(1);
}

const logger = pino({ level: "warn" });

/** storeId → { sock, status, qr } */
const sessions = new Map();

function jidToPhone(jid) {
  return (jid || "").split("@")[0].split(":")[0];
}

async function notifyApp(storeId, payload) {
  try {
    await fetch(`${APP_URL.replace(/\/$/, "")}/api/webhooks/whatsapp-web`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-token": ADMIN_TOKEN },
      body: JSON.stringify({ storeId, ...payload }),
    });
  } catch (e) {
    logger.warn({ e: String(e) }, "notifyApp failed");
  }
}

async function startSession(storeId) {
  const existing = sessions.get(storeId);
  if (existing?.sock && existing.status !== "disconnected") return existing;

  const dir = path.join(AUTH_DIR, storeId);
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const sock = makeWASocket({ auth: state, logger, printQRInTerminal: false, syncFullHistory: false });
  const entry = { sock, status: "connecting", qr: null };
  sessions.set(storeId, entry);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      entry.status = "qr";
      entry.qr = await qrcode.toDataURL(qr);
      notifyApp(storeId, { status: "qr" });
    }
    if (connection === "open") {
      entry.status = "connected";
      entry.qr = null;
      notifyApp(storeId, { status: "connected" });
      console.log(`✓ ${storeId} connected`);
    }
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      entry.status = "disconnected";
      notifyApp(storeId, { status: "disconnected" });
      if (loggedOut) {
        sessions.delete(storeId);
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`${storeId} logged out`);
      } else {
        setTimeout(() => startSession(storeId), 2000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const m of messages) {
      if (!m.message || m.key.fromMe) continue;
      const jid = m.key.remoteJid || "";
      if (jid.endsWith("@g.us") || jid === "status@broadcast") continue;
      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        "";
      if (!text) continue;
      await notifyApp(storeId, { from: jidToPhone(jid), name: m.pushName || null, text });
    }
  });

  return entry;
}

/** Restore all previously-paired sessions on boot. */
function restoreSessions() {
  if (!fs.existsSync(AUTH_DIR)) return;
  for (const storeId of fs.readdirSync(AUTH_DIR)) {
    if (fs.statSync(path.join(AUTH_DIR, storeId)).isDirectory()) {
      startSession(storeId).catch((e) => logger.warn({ e: String(e) }, `restore ${storeId} failed`));
    }
  }
}

/* ── HTTP API ── */
const app = express();
app.use(express.json());

function auth(req, res, next) {
  if (req.headers["x-bridge-token"] !== ADMIN_TOKEN) return res.status(401).json({ error: "unauthorized" });
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true, sessions: sessions.size }));

app.post("/sessions/:storeId/start", auth, async (req, res) => {
  const e = await startSession(req.params.storeId);
  res.json({ status: e.status });
});

app.get("/sessions/:storeId/status", auth, (req, res) => {
  res.json({ status: sessions.get(req.params.storeId)?.status ?? "disconnected" });
});

app.get("/sessions/:storeId/qr", auth, async (req, res) => {
  let e = sessions.get(req.params.storeId);
  if (!e) e = await startSession(req.params.storeId);
  res.json({ status: e.status, qr: e.status === "qr" ? e.qr : null });
});

app.post("/sessions/:storeId/send", auth, async (req, res) => {
  const { to, text } = req.body || {};
  const e = sessions.get(req.params.storeId);
  if (!to || !text) return res.status(400).json({ error: "missing to/text" });
  if (!e?.sock || e.status !== "connected") return res.status(409).json({ error: "not connected" });
  try {
    await e.sock.sendMessage(`${String(to).replace(/[^0-9]/g, "")}@s.whatsapp.net`, { text });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/sessions/:storeId/logout", auth, async (req, res) => {
  const e = sessions.get(req.params.storeId);
  try { await e?.sock?.logout(); } catch { /* ignore */ }
  sessions.delete(req.params.storeId);
  fs.rmSync(path.join(AUTH_DIR, req.params.storeId), { recursive: true, force: true });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Multi-tenant bridge listening on :${PORT}`);
  restoreSessions();
});
