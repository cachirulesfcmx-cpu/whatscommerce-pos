# WhatsCommerce POS

SaaS multi-tenant de **catálogo online + punto de venta (POS) + tienda web sincronizada con WhatsApp Business**. Inspirado en Take App, Shopify y Tiendanube, con identidad propia, arquitectura profesional y lista para producción.

> Cualquier negocio se registra, crea su tienda, agrega productos, conecta WhatsApp y empieza a recibir pedidos con un ticket profesional — sin comisiones por venta.

---

## ✨ Características

- **Multi-tenant** por subdominio (`tienda.whatscommerce.com`) y dominio propio.
- **Auth** con email/contraseña (Auth.js v5 + bcrypt + JWT), social opcional (Google).
- **Roles y permisos** granulares: Super Admin, Owner, Manager, Staff, Cashier.
- **Tienda pública** mobile-first, PWA instalable, tema claro/oscuro, estilo "liquid glass".
- **Carrito persistente** + checkout + **ticket de WhatsApp** vía `wa.me` (y adaptador para la Cloud API).
- **Dashboard** con KPIs, gráficas, pedidos, productos, clientes, inventario, cupones y reportes.
- **POS** para venta de mostrador con envío del ticket por WhatsApp.
- **Planes (Básico / Pro / Enterprise)** con límites validados en backend y frontend.
- **Stripe**: suscripciones SaaS + cobro de pedidos con tarjeta (webhooks firmados e idempotentes).
- **Seguridad**: validación Zod, rate limiting, audit logs, webhooks firmados, aislamiento por tienda.

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| Backend | Next.js Route Handlers, Prisma ORM, PostgreSQL |
| Auth | Auth.js (NextAuth v5), bcrypt, JWT |
| Pagos | Stripe (suscripciones + checkout de pedidos) |
| Infra opcional | Redis + BullMQ (colas/cache/rate-limit), con _fallback_ en memoria |

> **Decisión de arquitectura:** se eligió **Next.js full-stack** (en vez de NestJS) por su despliegue nativo en Vercel y menor superficie operativa, y **Prisma + PostgreSQL** por portabilidad: el mismo código corre con Postgres local (Docker), Supabase, Neon o RDS sin cambios.

## 🚀 Inicio rápido

### Opción A — script automático (recomendado)

```bash
npm run setup
npm run dev
```

El script crea `.env`, genera `AUTH_SECRET`, levanta Postgres+Redis con Docker, corre migraciones y siembra datos demo.

### Opción B — manual

```bash
# 1. Variables de entorno
cp .env.example .env            # edita DATABASE_URL y AUTH_SECRET

# 2. Base de datos (Docker) — o usa tu propio Postgres/Supabase/Neon
docker compose up -d

# 3. Dependencias + Prisma
npm install
npx prisma generate
npx prisma migrate dev --name init

# 4. Datos demo (3 tiendas: comida, boutique, servicios)
npm run db:seed

# 5. Arrancar
npm run dev
```

Abre **http://localhost:3000**.

### 🔑 Credenciales demo (tras el seed)

| Rol | Email | Contraseña |
|---|---|---|
| Super Admin | `admin@whatscommerce.com` | `ChangeMe123!` |
| Tienda de comida | `comida@demo.com` | `Demo1234` |
| Boutique | `boutique@demo.com` | `Demo1234` |
| Servicios | `servicios@demo.com` | `Demo1234` |

Tiendas públicas: `/store/tacos-el-guero`, `/store/boutique-luna`, `/store/estudio-creativo`.

## 🗺️ Rutas principales

| Ruta | Descripción |
|---|---|
| `/` | Landing SaaS (hero, beneficios, precios, FAQ) |
| `/register`, `/login` | Alta e inicio de sesión |
| `/onboarding` | Wizard de creación de tienda |
| `/dashboard` | Panel del negocio (KPIs, ventas) |
| `/dashboard/products` | CRUD de productos |
| `/dashboard/orders` | Gestión de pedidos + cambio de estado + cobro |
| `/dashboard/pos` | Punto de venta |
| `/dashboard/customers` `/inventory` `/coupons` `/reports` | Módulos Pro |
| `/dashboard/billing` | Planes y suscripción (Stripe) |
| `/dashboard/settings` | Configuración, apariencia y WhatsApp |
| `/store/[slug]` | Tienda pública + carrito + checkout |

## 🔌 Integraciones (opcionales)

- **Stripe** — define `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`. Sin estas claves, el sistema funciona en modo pagos manuales.
- **WhatsApp Cloud API** — opcional. Sin ella, los tickets se envían por `wa.me`. Con `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` se envían por la API; webhook en `/api/webhooks/whatsapp`.
- **Redis** — opcional (`REDIS_URL`). Sin él, rate-limit usa memoria.

## 📦 Scripts

```bash
npm run dev          # desarrollo
npm run build        # build de producción (incluye prisma generate)
npm run db:migrate   # migraciones (dev)
npm run db:deploy    # migraciones (prod)
npm run db:seed      # datos demo
npm run db:studio    # Prisma Studio
npm run typecheck    # TypeScript
```

## 📚 Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura, multi-tenant, modelo de datos, seguridad.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — despliegue en Vercel + Postgres y en VPS/Docker.

## 🛣️ Roadmap (fases)

- **Fase 1 ✅** Auth, multi-tenant, tienda, dashboard, productos, tienda pública, carrito, checkout, ticket WhatsApp.
- **Fase 2 ✅** Planes, suscripciones Stripe, pago de pedidos, cupones, clientes, inventario.
- **Fase 3** POS avanzado, reportes ampliados, editor visual de plantillas, dominio propio, automatizaciones WhatsApp.
- **Fase 4** Super Admin SaaS, Enterprise multi-sucursal, API privada, webhooks salientes, broadcasts, white-label.

## 📄 Licencia

Propietario — © WhatsCommerce. Uso interno / comercial del titular del proyecto.
