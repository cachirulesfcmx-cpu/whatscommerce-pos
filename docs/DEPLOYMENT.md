# Despliegue — WhatsCommerce POS

## 1. Desarrollo local

Requisitos: Node ≥ 20, Docker (opcional, para Postgres/Redis).

```bash
npm run setup      # crea .env, levanta Docker, migra y siembra
npm run dev
```

Si no usas Docker, apunta `DATABASE_URL` a tu Postgres (local, Supabase o Neon) y corre `npm install && npx prisma migrate dev && npm run db:seed`.

---

## 2. Producción en Vercel + PostgreSQL (recomendado)

### 2.1 Base de datos

Crea un Postgres gestionado (cualquiera sirve):

- **Supabase** → usa la cadena *Connection pooling* (puerto 6543, `?pgbouncer=true`) como `DATABASE_URL` y la *direct connection* (puerto 5432) como `DIRECT_URL` (Prisma la usa para migraciones).
- **Neon** → `DATABASE_URL` con `?sslmode=require`.
- **RDS / Postgres propio** → cadena estándar.

### 2.2 Variables de entorno en Vercel

Configura en *Project → Settings → Environment Variables*:

| Variable | Obligatoria | Notas |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres (pooled si Supabase) |
| `DIRECT_URL` | ✅ | conexión directa para migraciones |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ✅ | `true` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | ✅ | p.ej. `whatscommerce.com` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://whatscommerce.com` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | opc. | pagos |
| `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_ENTERPRISE_MONTHLY` | opc. | price IDs |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | opc. | cliente |
| `WHATSAPP_*` | opc. | Cloud API |
| `REDIS_URL` | opc. | Upstash/Redis gestionado |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` | opc. | bootstrap del seed |

### 2.3 Migraciones y seed

El `build` ejecuta `prisma generate`. Aplica migraciones contra la BD de producción:

```bash
# desde tu máquina, con DATABASE_URL apuntando a producción
npx prisma migrate deploy
npm run db:seed     # opcional: planes + super admin (omite tiendas demo en real)
```

> Como mínimo necesitas que existan los **planes** (el registro de tiendas requiere el plan BASIC). El seed los crea; o créalos con un script propio.

### 2.4 Dominios y multi-tenant

1. Apunta tu dominio raíz y un **comodín** `*.whatscommerce.com` a Vercel (CNAME / A según Vercel).
2. Agrega `whatscommerce.com` y `*.whatscommerce.com` en *Vercel → Domains*.
3. Cada tienda queda disponible en `slug.whatscommerce.com` automáticamente (resuelto por `middleware.ts`).
4. **Dominio propio del cliente:** registra el host en la tabla `Domain` (status `ACTIVE`) y añádelo en Vercel Domains apuntando al proyecto.

### 2.5 Webhooks

- **Stripe:** crea un endpoint a `https://<tu-dominio>/api/webhooks/stripe` y copia el *signing secret* a `STRIPE_WEBHOOK_SECRET`. Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- **WhatsApp Cloud API:** callback `https://<tu-dominio>/api/webhooks/whatsapp`, verify token = `WHATSAPP_VERIFY_TOKEN`.

---

## 3. Escalar a VPS / Docker

La app es un Next.js estándar; para contenedor productivo:

```Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
```

Acompáñalo con Postgres y Redis (ver `docker-compose.yml` para desarrollo; en producción usa servicios gestionados o un compose endurecido). Para colas en segundo plano (BullMQ) con `REDIS_URL`, ejecuta un *worker* aparte (Fase 3+).

---

## 4. Checklist previo a producción

- [ ] `AUTH_SECRET` fuerte y único.
- [ ] `DATABASE_URL` + `DIRECT_URL` correctos; `prisma migrate deploy` ejecutado.
- [ ] Planes creados en la BD.
- [ ] Dominio raíz + comodín configurados.
- [ ] Webhooks de Stripe y (si aplica) WhatsApp verificados.
- [ ] Cambiar contraseña del super admin.
- [ ] `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_ROOT_DOMAIN` con el dominio real.
- [ ] Probar registro → onboarding → producto → pedido → ticket WhatsApp.
