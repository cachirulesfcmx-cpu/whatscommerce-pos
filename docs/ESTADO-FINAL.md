# WhatsCommerce POS — Estado final (revisión comercial)

Revisión como si el producto se vendiera a negocios reales mañana.

## ✅ Funcionalidades listas (producción)

**Cuenta y tienda**
- Registro/login (Auth.js v5, bcrypt, JWT), prueba gratis de 14 días.
- Onboarding guiado (wizard) y editor de tienda con **vista previa móvil/escritorio**.
- Multi-tenant por subdominio + dominio propio (resolución por host).

**Catálogo y tienda pública**
- CRUD de productos con variantes, extras, categorías, imágenes, destacados, SEO.
- 8 plantillas visuales con diseño propio (Restaurante, Boutique, Cafetería, Repostería, Barbería, Servicios, Mayorista, Premium oscura).
- Storefront mobile-first, tema claro/oscuro, carrito persistente.

**Pedidos y WhatsApp**
- Checkout con cupón, envío, métodos de pago; precios recalculados en servidor.
- Ticket de WhatsApp profesional + `wa.me`; botones "confirmar/contactar" al cliente.
- **Plantillas de mensajes editables** por estado (con variables).
- Gestión de pedidos con estados, historial y cambio de estado.

**POS**
- Venta de mostrador: búsqueda, variantes/extras, descuento, cliente, pago (efectivo/transferencia/tarjeta), ticket + WhatsApp, descuento de inventario, historial.

**Inventario**
- Stock por producto/variante, alertas de bajo stock, movimientos, ajustes con motivo, reporte de bajo stock, bloqueo de venta sin stock, export CSV.

**CRM**
- Perfil de cliente, historial, total gastado, frecuencia, segmentación (Nuevo/Recurrente/VIP/Inactivo), etiquetas, notas, export CSV, WhatsApp.

**Planes SaaS**
- Básico/Pro/Enterprise con límites validados (backend + frontend), bloqueo de funciones premium, indicadores de uso, pantalla de upgrade, mensajes de límite.

**Pagos (Stripe)**
- Suscripciones, checkout de pedidos con tarjeta, portal de facturación, webhooks firmados e idempotentes, estados e historial de pagos.

**Reportes**
- Ventas por día/producto/categoría/método de pago, ticket promedio, clientes recurrentes, carritos abandonados, conversión, export CSV.

**Super Admin**
- Métricas (usuarios, tiendas, MRR/ARR, pedidos, suspendidas), gestión de tiendas (suspender/activar, cambiar plan), logs de auditoría, plantillas.

**API pública v1**
- API keys (hash SHA-256), endpoints products/customers/orders, rate limiting, docs.

**PWA / seguridad**
- Manifest + iconos + service worker + bottom nav móvil.
- Zod en todas las entradas, rate limiting, RBAC, aislamiento multi-tenant, webhooks firmados, audit logs, headers de seguridad, manejo central de errores, secretos solo por env.

## 🟡 Pendientes / parciales
- **PDF en reportes** (CSV listo; PDF requiere librería extra).
- **WhatsApp Cloud API**: adaptador listo, requiere credenciales de Meta + plantillas aprobadas para envío automático (hoy funciona por `wa.me`).
- **Webhooks salientes** y **broadcasts masivos** (Fase 4 avanzada, no implementados).
- **Multi-sucursal operativo** y **white-label** (esquema preparado; UI pendiente).
- **Migraciones Prisma versionadas** (el esquema se aplicó por SQL; conviene crear baseline `prisma/migrations`).
- **Cobertura de tests** limitada a lógica pura; faltan e2e/integración.

## 💡 Recomendaciones antes de vender
1. Quitar `typescript.ignoreBuildErrors`/`eslint.ignoreDuringBuilds` tras correr `npm run typecheck` local (Prisma genera ahí) y arreglar lo que aparezca.
2. Configurar Stripe en modo live + webhook, y precios reales por plan.
3. Conectar dominio raíz + comodín `*.dominio.com` para subdominios por tienda.
4. Subir imágenes reales de producto (hoy hay placeholders en el demo).
5. Cambiar contraseña del super admin y revisar políticas de respaldo de la BD.
6. Añadir página legal (términos/privacidad) y emails transaccionales.
7. Crear baseline de migraciones Prisma para evolución segura del esquema.

## Credenciales demo
- Super admin: `admin@whatscommerce.com` / `WhatsAdmin#2026`
- Tiendas: `comida@demo.com`, `boutique@demo.com`, `servicios@demo.com` / `Demo1234`
- API key demo (Enterprise): `wc_live_demoEstudio2026Key`
