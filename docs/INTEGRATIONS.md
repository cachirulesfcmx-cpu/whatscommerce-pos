# Integraciones — Stripe & WhatsApp

## 💳 Stripe

### Qué está implementado
| Funcionalidad | Estado | Dónde |
|---|---|---|
| Suscripciones SaaS (Pro/Enterprise) | ✅ | `src/server/services/billing.ts` → Checkout `mode=subscription` |
| Checkout de pedidos (tarjeta) | ✅ | `/api/orders/[id]/pay` → Checkout `mode=payment` |
| Webhooks seguros (firma + idempotencia) | ✅ | `/api/webhooks/stripe` (tabla `WebhookEvent`) |
| Portal de facturación | ✅ | `/api/billing/portal` → Stripe Billing Portal |
| Upgrade / downgrade de plan | ✅ | Checkout (upgrade) + Portal (cambios/cancelación) |
| Estados de pago | ✅ | `Payment.status` + `Order.paymentStatus` (PENDING/PAID/…) |
| Historial de pagos | ✅ (datos) | modelo `Payment` por pedido; vista de UI en backlog |

> Sin claves de Stripe el sistema funciona en **modo manual** (efectivo, transferencia, COD). Las funciones de tarjeta requieren plan Pro+ (`assertFeature("cardPayments")`).

### Variables (.env)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
```

### Configuración LOCAL
1. Crea productos/precios en el dashboard de Stripe (modo test) para Pro y Enterprise mensuales y copia los `price_...`.
2. Instala el CLI: `brew install stripe/stripe-cli/stripe` → `stripe login`.
3. Reenvía webhooks a tu app local:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copia el `whsec_...` que imprime a `STRIPE_WEBHOOK_SECRET`.
4. Prueba un upgrade desde `/dashboard/upgrade`. Tarjeta de prueba: `4242 4242 4242 4242`, fecha futura, cualquier CVC.

### Configuración PRODUCCIÓN
1. Claves **live** en las variables de entorno de Vercel.
2. Stripe Dashboard → Developers → Webhooks → *Add endpoint*:
   - URL: `https://TU-DOMINIO/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
   - Copia el signing secret a `STRIPE_WEBHOOK_SECRET` y redeploy.
3. Crea los precios en modo live y actualiza los `STRIPE_PRICE_*`.

---

## 💬 WhatsApp

El módulo tiene **dos modos**. El sistema funciona completo en el modo 1 sin nada de Meta.

### Modo 1 — Deep links `wa.me` (sin API, funciona ya)
| Funcionalidad | Estado |
|---|---|
| Ticket de pedido al negocio | ✅ `buildOrderTicket` + `wa.me` |
| Botón "Enviar pedido por WhatsApp" en checkout | ✅ |
| Enviar confirmación al cliente (por estado) | ✅ botón en *Pedidos* (`buildCustomerStatusMessage`) |
| Contactar al cliente | ✅ botón en *Pedidos* y *Clientes* |
| Botón flotante de WhatsApp en la tienda | ✅ |
| Plantillas/mensajes por estado | ✅ (predefinidas) / editables: en backlog |

**Cómo funciona:** se genera un enlace `https://wa.me/<numero>?text=<mensaje>` y se abre la app de WhatsApp con el mensaje pre-llenado. El usuario solo presiona enviar. No requiere aprobación de Meta, tokens ni número verificado.

### Modo 2 — WhatsApp Business Cloud API (requiere Meta)
| Funcionalidad | Estado |
|---|---|
| Adaptador de envío directo (sin abrir la app) | ✅ preparado en `src/lib/whatsapp/index.ts` (`sendWhatsApp`) |
| Verificación de webhook (handshake) | ✅ `/api/webhooks/whatsapp` GET |
| Recepción de mensajes/estados con firma | ✅ POST (verifica `x-hub-signature-256`) |
| Envío automático de plantillas (sin intervención) | ⚙️ requiere plantillas aprobadas por Meta |

**Qué requiere Meta (no funciona sin esto):**
- Una cuenta de **WhatsApp Business Platform** + app en Meta for Developers.
- Un **número verificado** y `WHATSAPP_PHONE_NUMBER_ID`.
- Un **token de acceso** (`WHATSAPP_ACCESS_TOKEN`) y `WHATSAPP_APP_SECRET`.
- **Plantillas de mensaje aprobadas** por Meta para mensajes proactivos fuera de la ventana de 24h.

Variables:
```
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=whatscommerce-verify
```
Cuando estas variables existen, `sendWhatsApp()` envía por la API; si no, devuelve el enlace `wa.me` como *fallback* automático. **El código no cambia: degrada con elegancia.**

### Resumen para el demo
- **Funciona hoy, sin configurar nada de Meta:** todos los tickets y mensajes vía `wa.me`.
- **Solo si activas la Cloud API:** envío automático sin abrir la app y recepción de mensajes entrantes.

---

## ⚡ Crear precios de Stripe automáticamente

En vez de crearlos a mano, corre el script (idempotente):
```bash
STRIPE_SECRET_KEY=sk_live_xxx npm run stripe:setup
```
Crea los productos **WhatsCommerce Pro** y **Enterprise** con precios mensual y anual (MXN por defecto; cambia con `STRIPE_CURRENCY`) y te imprime las variables `STRIPE_PRICE_*` para pegar en Vercel. Vuelve a correrlo cuando quieras: reutiliza los precios existentes por `lookup_key`.
