# WhatsCommerce — WhatsApp Web (QR) bridge · multi-tenant

Conecta números de WhatsApp **por QR** (como WhatsApp Web, usando Baileys) para
que el **chatbot, el inbox y los disparadores** funcionen **sin la API oficial**.

Se **despliega UNA sola vez para toda la plataforma**. Maneja **muchas sesiones a
la vez, una por tienda** (separadas por `storeId`). Cada dueño solo pulsa
**"Conectar por QR"** en su dashboard y escanea — **sin variables por tienda**.

> ⚠️ Canal **no oficial**: va contra los Términos de WhatsApp; riesgo de **baneo**
> del número (mayor con envíos masivos). No corre en Vercel: necesita un servicio
> **always-on** (Railway/Render/Fly.io/VPS) con un **volumen** persistente.

## Cómo funciona

```
Cliente WhatsApp ⇄ (Baileys, QR, 1 sesión por tienda) ⇄ Bridge ⇄ /api/webhooks/whatsapp-web ⇄ App
```

- La app pide al bridge iniciar/leer la sesión de una tienda por su `storeId`.
- El bridge devuelve el **QR**; el dueño lo escanea desde su panel.
- Cada mensaje entrante se reenvía al webhook de la app (con el `storeId`), que
  ejecuta el flujo y responde llamando a `POST /sessions/:storeId/send`.
- Las sesiones se guardan en `AUTH_DIR/<storeId>` y se **restauran al reiniciar**.

## Variables (solo 2 + volumen)

| Variable | Descripción |
|---|---|
| `APP_URL` | URL pública de la app (ej. `https://tu-tienda.vercel.app`) |
| `ADMIN_TOKEN` | Secreto de plataforma. En la app va como `WA_BRIDGE_ADMIN_TOKEN` |
| `AUTH_DIR` | Raíz de sesiones (monta un volumen, ej. `/app/auth`) |

En la **app** configura (una sola vez, en Vercel → Environment Variables):

```
WA_BRIDGE_URL=https://tu-bridge.up.railway.app
WA_BRIDGE_ADMIN_TOKEN=el-mismo-ADMIN_TOKEN
```

Con eso, **todas las tiendas** ya pueden conectar por QR desde su dashboard sin
configurar nada.

## Desplegar en Railway/Render

1. New Project → Deploy from GitHub repo → elige el repo.
2. **Root Directory** = `bridge` (usa el Dockerfile).
3. Variables: `APP_URL`, `ADMIN_TOKEN`.
4. **Volumen** montado en `/app/auth`.
5. Copia la **URL pública** y ponla en la app como `WA_BRIDGE_URL`.

## Docker (local/VPS)

```bash
docker build -t wa-bridge ./bridge
docker run -p 8080:8080 \
  -e APP_URL=https://tu-tienda.vercel.app \
  -e ADMIN_TOKEN=secreto \
  -v $(pwd)/auth:/app/auth \
  wa-bridge
```

## Endpoints (auth: `x-bridge-token: ADMIN_TOKEN`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Healthcheck (sin auth) |
| POST | `/sessions/:storeId/start` | Inicia/asegura la sesión |
| GET | `/sessions/:storeId/qr` | `{ status, qr }` |
| GET | `/sessions/:storeId/status` | `{ status }` |
| POST | `/sessions/:storeId/send` | Enviar `{ to, text }` |
| POST | `/sessions/:storeId/logout` | Desvincular el número |

## Escalado

Un proceso sostiene muchas sesiones (suficiente para decenas/cientos). Para
escalar más, replica el bridge y reparte tiendas por instancia (sharding por
`storeId`), o usa varias instancias con almacenamiento de sesión compartido.
