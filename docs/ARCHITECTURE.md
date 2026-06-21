# Arquitectura — WhatsCommerce POS

## Visión general

Aplicación **Next.js 15 full-stack** (App Router) desplegable en Vercel, con PostgreSQL vía Prisma. Una sola base de código sirve tres superficies:

1. **Marketing** (`/`) — landing pública del SaaS.
2. **Aplicación** (`/dashboard`, `/onboarding`) — panel del negocio (protegido).
3. **Storefront** (`/store/[slug]`) — tienda pública por tienda (tenant).

```
┌──────────────────────────────────────────────────────────────┐
│                         Navegador / PWA                        │
└───────────────┬───────────────────────────┬──────────────────┘
                │                           │
        rootdomain / app             tienda.rootdomain / dominio propio
                │                           │
                ▼                           ▼
┌──────────────────────────────────────────────────────────────┐
│  middleware.ts  → resuelve tenant por Host y reescribe a       │
│                   /store/[slug]; protege /dashboard            │
├──────────────────────────────────────────────────────────────┤
│  App Router (RSC)        │  Route Handlers (/api/*)            │
│  - páginas server        │  - REST con Zod + manejo de errores │
│  - componentes cliente   │  - rate limit, auditoría, RBAC      │
├──────────────────────────────────────────────────────────────┤
│  Capa de servicios (src/server/services/*)                     │
│  products · orders · billing                                   │
├──────────────────────────────────────────────────────────────┤
│  Prisma ORM → PostgreSQL                                        │
│  Integraciones: Stripe · WhatsApp (wa.me / Cloud API) · Redis  │
└──────────────────────────────────────────────────────────────┘
```

## Estructura de carpetas

```
prisma/
  schema.prisma         # ~30 modelos, enums, índices
  seed.ts               # planes, super admin, 3 tiendas demo
src/
  app/
    (marketing)/        # landing
    (auth)/             # login / register
    (dashboard)/        # panel protegido (layout con guard)
    onboarding/         # wizard de creación de tienda
    store/[storeSlug]/  # tienda pública + checkout + estado de pedido
    api/                # route handlers (auth, products, orders, checkout,
                        #   coupons, customers, inventory, billing, webhooks)
    sitemap.ts
  components/
    ui/                 # design system (shadcn-style)
    dashboard/  store/  marketing/  auth/
  lib/
    auth/               # Auth.js config, password, rbac
    plans/              # definición de planes + enforcement de límites
    payments/           # cliente Stripe
    whatsapp/           # ticket builder + adaptador de envío
    security/           # rate-limit, redis, audit
    validations/        # esquemas Zod por dominio
    cart/               # pricing + cupones
    prisma.ts env.ts utils.ts constants.ts tenant.ts
  server/
    api.ts              # helpers de respuesta + mapeo de errores
    context.ts          # sesión, acceso a tienda, permisos
    dashboard.ts        # guard server-side del panel
    storefront.ts       # carga/serialización del storefront
    services/           # lógica de negocio
  store/                # estado cliente (carrito, Zustand)
  middleware.ts
```

## Multi-tenancy

- **Aislamiento por `storeId`:** toda entidad de negocio lleva `storeId` e índices por tienda. Las consultas siempre se filtran por la tienda activa resuelta del usuario autenticado (`src/server/context.ts`).
- **Resolución por Host** (`middleware.ts`, edge-safe):
  - `slug.rootdomain` → reescribe a `/store/slug`.
  - dominio propio → reescribe a `/store/_host` con header `x-tenant-host`; se resuelve contra la tabla `Domain`.
  - `rootdomain` / `app.` → marketing + app.
- **Seguridad cross-tenant:** `requireStoreAccess(storeId)` valida que el usuario tenga un registro `Staff` activo en esa tienda (los Super Admin lo omiten). Ninguna ruta confía en `storeId` del cliente para datos sensibles: la tienda activa se deriva del usuario.

## Autenticación y RBAC

- **Auth.js v5** con proveedor *credentials* (bcrypt) y estrategia **JWT**. Social (Google) se activa solo si hay credenciales en el entorno.
- **Roles**: `OWNER`, `MANAGER`, `STAFF`, `CASHIER` (+ `isSuperAdmin` global).
- **Permisos** `modulo:accion` (`products:create`, `orders:update`, …). Cada rol tiene un set por defecto y cada `Staff` admite *overrides*. Las rutas usan `assertPermission()`.

## Planes y límites

`src/lib/plans/plans.ts` define límites (`maxProducts`, `maxOrdersMonth`, …) y _feature flags_ (`cardPayments`, `inventory`, `coupons`, …). `src/lib/plans/limits.ts` los aplica:

- `assertCanCreateProduct`, `assertCanCreateOrder`, `assertCanCreateStaff` → límites cuantitativos (errores `402`).
- `assertFeature` → bloqueo de funciones (`403`), con `FeatureGate` equivalente en UI.
- Uso mensual rastreado en `UsageCounter` (`storeId+period+metric`).

## Pedidos y dinero

- Precios **siempre recalculados en el servidor** (`createOrder` en `src/server/services/orders.ts`) a partir de la BD; nunca se confía en el precio del cliente. Los _extras_ se validan contra los modificadores del producto.
- Dinero en `Decimal(12,2)`; números de pedido vía `StoreSettings.nextOrderNumber` (incremento transaccional).
- Una transacción crea/actualiza: cliente (upsert por teléfono), pedido + items + pago, uso de cupón, decremento de inventario con `InventoryMovement`, y rollup del cliente.

## WhatsApp

`src/lib/whatsapp/ticket.ts` arma el ticket profesional (formato del spec) y el enlace `wa.me` codificado. `src/lib/whatsapp/index.ts` es el **adaptador**: si la Cloud API está configurada envía por API; si no, devuelve el deep link `wa.me`. El sistema funciona completo sin la API.

## Pagos (Stripe)

- **Suscripciones**: Checkout (`mode=subscription`) → webhook `checkout.session.completed` sincroniza `Subscription`. Portal de facturación para gestionar/cancelar.
- **Pedidos**: Checkout (`mode=payment`) por el total del pedido → webhook marca `Payment`/`Order` como pagados.
- **Webhook** (`/api/webhooks/stripe`): verifica firma, **idempotente** vía tabla `WebhookEvent`.

## Seguridad

Validación Zod en todas las entradas · rate limiting (Redis o memoria) en endpoints sensibles (registro, checkout) · audit logs (`AuditLog`) · webhooks con verificación de firma e idempotencia · cabeceras de seguridad en `next.config.mjs` · secretos solo por variables de entorno · aislamiento multi-tenant en cada consulta.

## Modelo de datos (resumen)

Auth: `User`, `Account`, `Session`, `VerificationToken`.
SaaS: `Plan`, `Subscription`, `UsageCounter`.
Tienda: `Store`, `StoreSettings`, `Branch`, `Domain`, `WhatsAppSettings`, `Template`.
RBAC: `Staff`.
Catálogo: `Category`, `Product`, `ProductImage`, `Variant`, `VariantOption`, `Modifier`, `ModifierOnProduct`.
Inventario: `Inventory`, `InventoryMovement`.
Ventas: `Customer`, `Address`, `Order`, `OrderItem`, `Payment`, `Coupon`, `Cart`.
Automatización: `Automation`, `Broadcast`.
Ops: `AuditLog`, `WebhookEvent`.

> Todos los IDs son `cuid()`. Relaciones con `onDelete` apropiado (Cascade en hijos de tienda, SetNull en referencias históricas para preservar pedidos).
