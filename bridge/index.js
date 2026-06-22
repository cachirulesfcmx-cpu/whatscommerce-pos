/**
 * WhatsCommerce — WhatsApp Web (QR) bridge
 * ----------------------------------------
 * Connects ONE WhatsApp number via QR (like WhatsApp Web) using Baileys and
 * relays messages to/from the WhatsCommerce app. This is an UNOFFICIAL channel
 * (not the Meta Cloud API); Meta may ban automated numbers. Use at your own risk.
 *
 * Endpoints (all require header `x-bridge-token: <BRIDGE_TOKEN>`):
 *   GET  /status  → { status }
 *   GET  /qr      → { status, qr }   (qr = data URL while pairing)
 *   POST /send    → { to, text }     send a message
 *   GET  /health  → ok (no auth)
 *
 * Inbound messages and connection status are POSTed to:
 *   ${APP_URL}/api/webhooks/whatsapp-web   with the same token + { storeId, ... }
 *
 * Env:
 *   APP_URL       e.g. https://tu-tienda.vercel.app
 *   BRIDGE_TOKEN  shared secret (also set in the store's WhatsApp settings)
 *   STORE_ID      the WhatsCommerce store id this number belongs to
 *   PORT          default 8080
 *   AUTH_DIR      where the session is persisted (default ./auth) — use a volume!
 */
import express from "express";
import qrcode from "qrcode";
import pino from "pino";
import { Boom } from "@hapi/boom";
import baileys, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";

const makeWASocket = baileys.default || baileys.makeWASocket;

const APP_URL = process.env.APP_URL;
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN;
const STORE_ID = process.env.STORE_ID;
const PORT = process.env.PORT || 8080;
const AUTH_DIR = process.env.AUTH_DIR || "./auth";

if (!APP_URL || !BRIDGE_TOKEN || !STORE_ID) {
  console.error("Missing env: APP_URL, BRIDGE_TOKEN and STORE_ID are required.");
  process.exit(1);
}

const logger = pino({ level: "warn" });
let sock = null;
let status = "disconnected"; // disconnected | qr | connected
let currentQrDataUrl = null;

function jidToPhone(jid) {
  return (jid || "").split("@")[0].split(":")[0];
}

async function notifyApp(payload) {
  try {
    await fetch(`${APP_URL.replace(/\/$/, "")}/api/webhooks/whatsapp-web`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-token": BRIDGE_TOKEN },
      body: JSON.stringify({ storeId: STORE_ID, ...payload }),
    });
  } catch (e) {
    logger.warn({ e: String(e) }, "notifyApp failed");
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  sock = makeWASocket({ auth: state, logger, printQRInTerminal: false, syncFullHistory: false });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      status = "qr";
      currentQrDataUrl = await qrcode.toDataURL(qr);
      notifyApp({ status });
    }
    if (connection === "open") {
      status = "connected";
      currentQrDataUrl = null;
      notifyApp({ status });
      console.log("✓ WhatsApp connected");
    }
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      status = "disconnected";
      notifyApp({ status });
      console.log("Connection closed.", loggedOut ? "Logged out — delete auth to re-pair." : "Reconnecting…");
      if (!loggedOut) setTimeout(start, 2000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const m of messages) {
      if (!m.message || m.key.fromMe) continue;
      const jid = m.key.remoteJid || "";
      if (jid.endsWith("@g.us") || jid === "status@broadcast") continue; // skip groups/status
      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        "";
      if (!text) continue;
      await notifyApp({ from: jidToPhone(jid), name: m.pushName || null, text });
    }
  });
}

/* ── HTTP API ── */
const app = express();
app.use(express.json());

function auth(req, res, next) {
  if (req.headers["x-bridge-token"] !== BRIDGE_TOKEN) return res.status(401).json({ error: "unauthorized" });
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/status", auth, (_req, res) => res.json({ status }));
app.get("/qr", auth, (_req, res) => res.json({ status, qr: status === "qr" ? currentQrDataUrl : null }));

app.post("/send", auth, async (req, res) => {
  const { to, text } = req.body || {};
  if (!to || !text) return res.status(400).json({ error: "missing to/text" });
  if (!sock || status !== "connected") return res.status(409).json({ error: "not connected" });
  try {
    await sock.sendMessage(`${String(to).replace(/[^0-9]/g, "")}@s.whatsapp.net`, { text });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(`Bridge listening on :${PORT} (store ${STORE_ID})`));
start().catch((e) => { console.error(e); process.exit(1); });
