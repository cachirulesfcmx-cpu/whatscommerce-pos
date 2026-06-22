# WhatsCommerce — WhatsApp Web (QR) bridge

Conecta **un número de WhatsApp por QR** (como WhatsApp Web, usando Baileys) y
enlaza los mensajes con tu app WhatsCommerce. Así el **chatbot, el inbox y los
disparadores** funcionan **sin la API oficial de Meta**.

> ⚠️ **Aviso:** este es un canal **no oficial**. Va contra los Términos de
> WhatsApp y existe riesgo de que **baneen el número**, especialmente con envíos
> automatizados o masivos. Para producción seria se recomienda la Cloud API.
> No corre en Vercel: necesita un **servicio always-on** (Railway, Render, Fly.io
> o un VPS con Docker) que mantenga viva la sesión.

## Cómo funciona

```
Cliente WhatsApp  ⇄  (Baileys, QR)  ⇄  Bridge  ⇄  /api/webhooks/whatsapp-web  ⇄  App (chatbot + inbox)
```

- El bridge genera el **QR**; lo escaneas con *WhatsApp → Dispositivos vinculados*.
- Cada mensaje entrante se reenvía al webhook de la app, que ejecuta el flujo y
  responde llamando a `POST /send` del bridge.
- La sesión se guarda en `AUTH_DIR` — **monta un volumen** para no re-escanear.

## Variables de entorno

Copia `.env.example` → `.env` y llena:

| Variable | Descripción |
|---|---|
| `APP_URL` | URL pública de tu app (p. ej. `https://tu-tienda.vercel.app`) |
| `BRIDGE_TOKEN` | Secreto compartido (el mismo en el dashboard) |
| `STORE_ID` | ID de la tienda (lo ves en el panel de QR) |
| `PORT` | Puerto (por defecto 8080) |
| `AUTH_DIR` | Carpeta de sesión persistente (volumen) |

## Correr local

```bash
cd bridge
npm install
APP_URL=http://localhost:3000 BRIDGE_TOKEN=secreto STORE_ID=tu_store_id npm start
```

## Docker

```bash
docker build -t wa-bridge ./bridge
docker run -p 8080:8080 \
  -e APP_URL=https://tu-tienda.vercel.app \
  -e BRIDGE_TOKEN=secreto \
  -e STORE_ID=tu_store_id \
  -v $(pwd)/auth:/app/auth \
  wa-bridge
```

## Railway / Render

1. Crea un servicio nuevo apuntando a la carpeta `bridge/` (o este Dockerfile).
2. Configura las variables `APP_URL`, `BRIDGE_TOKEN`, `STORE_ID`.
3. Añade un **volumen** montado en `/app/auth` (persistencia de la sesión).
4. Copia la **URL pública** del servicio.

## Conectar en el dashboard

1. Ve a **Configuración → WhatsApp**, elige modo **QR**.
2. Pega la **URL del bridge** y el **BRIDGE_TOKEN**, guarda.
3. Pulsa **Conectar** y **escanea el QR** con tu teléfono.
4. Cuando el estado sea **Conectado**, el bot responde solo por ese número.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Healthcheck |
| GET | `/status` | token | `{ status }` |
| GET | `/qr` | token | `{ status, qr }` (data URL al vincular) |
| POST | `/send` | token | Enviar `{ to, text }` |
