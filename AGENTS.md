## Imported Claude Cowork project instructions

Actúa como un equipo senior de desarrollo full-stack, arquitectura SaaS, diseño UX/UI, e-commerce, WhatsApp Business, pagos online y seguridad.

Quiero que construyas un sistema SaaS de punto de venta, catálogo online y tienda web sincronizada con WhatsApp Business, inspirado en plataformas como Take App, Shopify y Tiendanube, pero con identidad propia y arquitectura profesional, escalable y lista para producción.

NOMBRE TEMPORAL DEL PROYECTO:
WhatsCommerce POS

OBJETIVO GENERAL:
Crear una plataforma donde cualquier negocio pueda registrarse, crear su tienda online, configurar productos, plantillas, métodos de pago, WhatsApp Business, dominio propio, pedidos, clientes, inventario, reportes, personal, sucursales y automatizaciones.

El flujo principal debe ser:
1. El vendedor crea su cuenta.
2. Configura su tienda.
3. Elige plantilla visual.
4. Agrega productos, variantes, precios, fotos, inventario y categorías.
5. Conecta WhatsApp Business.
6. Publica su catálogo online.
7. El cliente entra a la tienda, agrega productos al carrito y finaliza pedido.
8. El sistema genera un ticket/desglose completo.
9. El pedido se envía automáticamente por WhatsApp al negocio y opcionalmente al cliente.
10. El vendedor puede gestionar el pedido desde un panel tipo POS.
11. Según el plan contratado, puede activar pagos con tarjeta, dominio propio, automatizaciones, personal, reportes avanzados e integraciones.

STACK TÉCNICO REQUERIDO:
Usa una arquitectura moderna, profesional y mantenible:

Frontend:
- Next.js 15 con App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Diseño mobile-first
- PWA instalable
- Tema claro/oscuro
- UI premium estilo Shopify + Tiendanube + iOS Liquid Glass

Backend:
- Next.js API Routes o NestJS si lo consideras mejor
- Prisma ORM
- PostgreSQL
- Redis para colas, cache y rate limiting
- BullMQ para trabajos en segundo plano
- Webhooks para pagos y WhatsApp
- Arquitectura multi-tenant

Auth:
- Registro/login con email y contraseña
- Login social opcional
- Magic links opcionales
- Roles:
  - Super Admin
  - Owner
  - Manager
  - Staff
  - Cashier
- Permisos granulares por módulo

Pagos:
- Stripe como proveedor principal
- Preparar arquitectura para Mercado Pago, PayPal y pagos locales
- Webhooks seguros
- Suscripciones SaaS
- Checkout para pago de pedidos
- Pagos manuales: efectivo, transferencia, COD, QR
- Validación de disponibilidad por plan

WhatsApp:
- Integración inicial mediante deep link / wa.me con mensaje prellenado
- Preparar módulo para WhatsApp Business Cloud API
- Generación automática de ticket de pedido para WhatsApp
- Plantillas de mensaje configurables
- Mensajes para:
  - Nuevo pedido
  - Confirmación
  - Pedido pagado
  - Pedido en preparación
  - Pedido enviado
  - Pedido entregado
  - Recuperación de carrito
  - Pedido abandonado
  - Promociones
- Panel para configurar número de WhatsApp, horarios, idioma y mensajes

MÓDULOS PRINCIPALES:

1. LANDING PAGE SAAS
Crear una landing profesional con:
- Hero section
- Beneficios
- Cómo funciona
- Demo visual de tienda
- Demo visual del ticket por WhatsApp
- Planes y precios
- Preguntas frecuentes
- Casos de uso:
  - Restaurantes
  - Cafeterías
  - Repostería
  - Ropa
  - Belleza
  - Servicios
  - Tiendas locales
  - Mayoristas
- CTA para empezar gratis

2. SISTEMA DE PLANES
Crear planes:

BÁSICO:
- 1 tienda
- Hasta 50 pedidos al mes
- Hasta 20 productos
- Hasta 20 imágenes
- Catálogo web básico
- Pedidos por WhatsApp manual
- Pagos manuales
- Subdominio gratuito
- Marca de la plataforma visible
- Sin dominio propio
- Sin pagos con tarjeta
- Sin automatizaciones avanzadas

PRO:
- Pedidos ilimitados
- Productos ilimitados
- Imágenes ilimitadas
- Pagos con tarjeta
- Stripe / Mercado Pago
- Dominio propio
- Remover marca de la plataforma
- Cupones
- Variantes de productos
- Inventario
- Clientes
- Reportes
- WhatsApp automation básica
- Recuperación de carrito
- Plantillas premium
- SEO avanzado

ENTERPRISE:
- Multi tienda
- Multi sucursal
- Personal ilimitado
- Roles avanzados
- API privada
- Webhooks
- Automatizaciones avanzadas
- WhatsApp Business API
- Broadcasts
- Soporte prioritario
- Account manager
- Reportes avanzados
- Integraciones personalizadas
- White label opcional

El sistema debe validar límites de plan en backend y frontend.

3. PANEL DE ADMINISTRACIÓN DEL NEGOCIO
Crear dashboard con:
- Ventas del día
- Pedidos pendientes
- Pedidos pagados
- Pedidos cancelados
- Productos más vendidos
- Clientes recientes
- Ingresos
- Gráficas
- Accesos rápidos
- Estado de WhatsApp
- Estado de pagos
- Estado del plan

4. CREACIÓN DE TIENDA
Wizard inicial:
- Nombre de tienda
- Logo
- Descripción
- Categoría del negocio
- Moneda
- País
- Zona horaria
- Número de WhatsApp
- Horarios
- Métodos de entrega
- Métodos de pago
- Plantilla visual
- URL pública

5. EDITOR DE TIENDA / PLANTILLAS
Crear editor visual con:
- Selección de plantilla
- Colores
- Tipografías
- Logo
- Banner
- Secciones
- Orden de productos
- Vista previa móvil
- Vista previa escritorio
- SEO
- Redes sociales
- Link-in-bio

Plantillas iniciales:
- Minimal Store
- Food Express
- Boutique Pro
- Beauty Studio
- Digital Services
- Wholesale Catalog
- Premium Dark
- Local Market

6. PRODUCTOS
CRUD completo:
- Nombre
- Descripción
- Precio
- Precio rebajado
- SKU
- Categoría
- Fotos
- Variantes
- Modificadores
- Extras
- Stock
- Estado activo/inactivo
- Producto destacado
- Producto digital/físico/servicio
- Tiempo de preparación
- SEO
- Etiquetas

Soportar variantes como:
- Talla
- Color
- Sabor
- Tamaño
- Presentación

Soportar extras como:
- Queso extra
- Salsa
- Envoltura regalo
- Personalización

7. CARRITO Y CHECKOUT
Crear una experiencia de compra rápida:
- Carrito persistente
- Cantidades
- Variantes
- Extras
- Notas por producto
- Cupón
- Método de entrega:
  - Recoger en tienda
  - Envío local
  - Delivery propio
  - Paquetería
- Datos del cliente:
  - Nombre
  - Teléfono
  - Email opcional
  - Dirección
  - Referencias
  - Notas
- Método de pago:
  - Efectivo
  - Transferencia
  - Tarjeta
  - Link de pago
  - Pago contra entrega
- Resumen completo
- Botón finalizar pedido
- Confirmación
- Envío a WhatsApp

8. TICKET DE WHATSAPP
Al finalizar pedido, generar mensaje profesional:

NUEVO PEDIDO
Tienda: [Nombre]
Pedido: #[Número]
Fecha: [Fecha y hora]

Cliente
Nombre:
Teléfono:
Dirección:
Método de entrega:

Productos
1. Producto
   Variante:
   Extras:
   Cantidad:
   Precio:

Resumen
Subtotal:
Descuento:
Envío:
Total:

Método de pago
[Pago elegido]

Notas
[Notas del cliente]

Estado
Pendiente de confirmación

Generar link de WhatsApp con mensaje codificado.

9. POS / GESTIÓN DE ÓRDENES
Panel tipo punto de venta:
- Crear pedido manual
- Buscar producto
- Agregar al carrito
- Aplicar descuento
- Cobrar
- Imprimir ticket
- Enviar por WhatsApp
- Cambiar estado
- Asignar responsable
- Historial de cambios
- Filtros por fecha, estado, pago, canal
- Estados:
  - Nuevo
  - Confirmado
  - En preparación
  - Listo
  - Enviado
  - Entregado
  - Cancelado
  - Reembolsado

10. CLIENTES / CRM
- Lista de clientes
- Historial de pedidos
- Total gastado
- Última compra
- Etiquetas
- Segmentos
- Notas internas
- Botón WhatsApp
- Exportación CSV
- Consentimiento para marketing

11. INVENTARIO
- Stock por producto y variante
- Alertas de bajo stock
- Movimientos
- Ajustes manuales
- Historial
- Stock por sucursal en Enterprise
- Bloqueo de venta sin stock configurable

12. CUPONES Y PROMOCIONES
- Porcentaje
- Monto fijo
- Envío gratis
- Compra mínima
- Fechas de vigencia
- Límite de usos
- Productos/categorías aplicables

13. REPORTES
- Ventas por día
- Ventas por producto
- Ventas por categoría
- Ventas por canal
- Métodos de pago
- Clientes recurrentes
- Ticket promedio
- Conversión
- Pedidos abandonados
- Exportación CSV/PDF

14. SUPER ADMIN SAAS
Panel para dueño de la plataforma:
- Usuarios registrados
- Tiendas activas
- Planes
- Suscripciones
- Ingresos MRR/ARR
- Pedidos procesados
- Uso por tienda
- Bloquear tiendas
- Cambiar plan manualmente
- Ver logs
- Gestión de plantillas
- Gestión de países/monedas
- Gestión de integraciones
- Métricas SaaS

15. SUSCRIPCIONES
Implementar:
- Tabla de planes
- Suscripciones
- Estado:
  - active
  - trialing
  - past_due
  - canceled
  - unpaid
- Upgrade/downgrade
- Portal de facturación
- Validación de límites por plan
- Middleware de acceso

16. MULTI-TENANT
Cada tienda debe estar aislada:
- storeId en todas las entidades
- Subdominio:
  - tienda.whatscommerce.com
- Dominio propio:
  - mitienda.com
- Middleware para resolver tienda por host
- Seguridad para que una tienda no acceda a datos de otra

17. SEO Y PERFORMANCE
- Metadata por tienda
- Open Graph
- Sitemap dinámico
- Robots.txt
- URLs limpias
- Imágenes optimizadas
- Lazy loading
- PWA
- Lighthouse alto
- Buen Core Web Vitals

18. SEGURIDAD
Implementar:
- Validación con Zod
- Rate limiting
- Protección CSRF donde aplique
- Sanitización
- Logs de auditoría
- Control de permisos
- Webhooks con firma
- Variables de entorno seguras
- Manejo profesional de errores
- No exponer secrets
- Protección multi-tenant

19. BASE DE DATOS
Diseña esquema Prisma profesional para:
- User
- Account
- Session
- Store
- StoreSettings
- Plan
- Subscription
- Product
- ProductImage
- Category
- Variant
- VariantOption
- Modifier
- Inventory
- Customer
- Address
- Order
- OrderItem
- Payment
- Coupon
- Staff
- Role
- Permission
- Template
- Domain
- WhatsAppSettings
- Automation
- Broadcast
- AuditLog
- WebhookEvent

20. UX/UI
Diseño visual:
- Profesional
- Moderno
- Mobile-first
- Inspirado en Shopify, Tiendanube, Stripe Dashboard y Take App
- Componentes reutilizables
- Tablas limpias
- Cards premium
- Empty states
- Loading states
- Toasts
- Modales
- Formularios claros
- Onboarding guiado
- Vista pública de tienda muy atractiva
- Animaciones sutiles

21. ENTREGABLES
Necesito que generes:
- Arquitectura completa
- Estructura de carpetas
- Base de datos Prisma
- Migraciones
- Seed inicial
- Componentes UI
- Backend funcional
- Frontend funcional
- Dashboard
- Tienda pública
- Checkout
- WhatsApp ticket
- Sistema de planes
- Middleware multi-tenant
- Integración Stripe
- CRUD completo
- Datos demo
- README profesional
- Variables .env.example
- Scripts de instalación
- Instrucciones para correr localmente
- Instrucciones para desplegar en producción

22. PRIORIDAD DE DESARROLLO
Construye en fases, pero dejando código real y funcional:

FASE 1:
- Auth
- Multi-tenant
- Crear tienda
- Dashboard básico
- Productos
- Tienda pública
- Carrito
- Checkout
- Ticket WhatsApp

FASE 2:
- Planes
- Stripe subscriptions
- Pagos de pedidos
- Cupones
- Clientes
- Inventario

FASE 3:
- POS
- Reportes
- Plantillas
- Dominio propio
- Automatizaciones WhatsApp

FASE 4:
- Super Admin
- Enterprise
- API
- Webhooks
- Broadcasts
- White label

23. CRITERIOS DE CALIDAD
No generes una demo simple. Quiero un MVP avanzado, profesional y escalable.
Todo debe estar tipado con TypeScript.
Evita código placeholder.
Cuando algo requiera credenciales externas, deja integración preparada con variables de entorno y documentación.
Prioriza arquitectura limpia, seguridad, diseño premium y experiencia mobile-first.

24. REGLAS
- No inventes APIs imposibles.
- Si WhatsApp Business API requiere aprobación o token, deja el adaptador preparado y usa primero deep links wa.me.
- El sistema debe funcionar aunque no haya WhatsApp API activa.
- Debe poder desplegarse en Vercel + PostgreSQL.
- Debe estar preparado para escalar a VPS/Docker después.
- Cada módulo debe tener validaciones reales.
- Crear datos demo para probar una tienda de comida, una boutique y una tienda de servicios.

Empieza creando la arquitectura, el esquema de base de datos, la estructura de carpetas y luego implementa el código por fases.
