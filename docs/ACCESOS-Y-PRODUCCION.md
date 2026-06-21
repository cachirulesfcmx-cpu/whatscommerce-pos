# WhatsCommerce POS — Accesos y requisitos de producción

## 🔗 Links

| Recurso | URL |
|---|---|
| App / Landing | https://whatscommerce-eight.vercel.app |
| Login (negocios) | https://whatscommerce-eight.vercel.app/login |
| Registro | https://whatscommerce-eight.vercel.app/register |
| Panel del negocio | https://whatscommerce-eight.vercel.app/dashboard |
| Super Admin (SaaS) | https://whatscommerce-eight.vercel.app/admin |
| Panel Supabase (BD) | https://supabase.com/dashboard/project/phmjxwoczoyoaxrfhylu |
| Panel Vercel (deploy) | https://vercel.com/cachirulesfcmx-cpus-projects/whatscommerce |

> Nota: el deploy de producción se actualiza corriendo `vercel --prod` desde la carpeta del proyecto.

---

## 🏪 Tiendas demo (públicas)

| Tienda | Plan | URL pública |
|---|---|---|
| Tacos El Güero | Pro | https://whatscommerce-eight.vercel.app/store/tacos-el-guero |
| Boutique Luna | Pro | https://whatscommerce-eight.vercel.app/store/boutique-luna |
| Estudio Creativo | Enterprise | https://whatscommerce-eight.vercel.app/store/estudio-creativo |

---

## 👤 Usuarios (dueños de tienda)

Todos con contraseña: **`Demo1234`**

| Tienda | Email | Plan |
|---|---|---|
| Tacos El Güero | `comida@demo.com` | Pro |
| Boutique Luna | `boutique@demo.com` | Pro |
| Estudio Creativo | `servicios@demo.com` | Enterprise |

---

## 🔑 Logins

### Login Admin (dueño de un negocio)
Entra en **/login** con cualquiera de los usuarios de arriba. Ejemplo:
```
URL:   https://whatscommerce-eight.vercel.app/login
Email: comida@demo.com
Pass:  Demo1234
```
Acceden a su panel: pedidos, POS, productos, inventario, clientes, reportes, etc.

### Login Superadmin (dueño de la plataforma SaaS)
```
URL:   https://whatscommerce-eight.vercel.app/login
Email: admin@whatscommerce.com
Pass:  WhatsAdmin#2026
```
Al entrar es redirigido a **/admin** (métricas globales, tiendas, MRR, suspender/cambiar plan, logs).
> ⚠️ Cambia esta contraseña antes de operar en real.

### API key demo (plan Enterprise)
```
wc_live_demoEstudio2026Key
```
Prueba:
```bash
curl https://whatscommerce-eight.vercel.app/api/v1/products \
  -H "Authorization: Bearer wc_live_demoEstudio2026Key"
```

---

## 🚀 Qué APIs / claves necesitas para lanzar a producción

### 1. Obligatorias (ya configuradas o imprescindibles)
| Variable | Para qué | Dónde se obtiene | Estado |
|---|---|---|---|
| `DATABASE_URL` | Conexión a Postgres (runtime, pooler 6543) | Supabase → Connect → Prisma | ✅ ya conectada |
| `DIRECT_URL` | Conexión directa (migraciones, 5432) | Supabase → Connect → Prisma | ✅ ya conectada |
| `AUTH_SECRET` | Firma de sesiones (Auth.js) | `openssl rand -base64 32` | ✅ configurada |
| `AUTH_TRUST_HOST` | Auth en Vercel | valor `true` | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | tu dominio | ✅ |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Subdominios por tienda | tu dominio raíz | ⚙️ ajustar al dominio real |

### 2. Pagos — Stripe (necesarias para cobrar planes y pedidos con tarjeta)
| Variable | Cómo se obtiene |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (modo **live**) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → API keys (publishable, live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint `https://TU-DOMINIO/api/webhooks/stripe` |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe → Products → precio mensual del plan Pro |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Stripe → Products → precio mensual de Enterprise |

> Cuenta requerida: **Stripe** (gratis crear cuenta; cobra comisión por transacción). Sin esto, el sistema funciona en modo pagos manuales (efectivo/transferencia/COD).

### 3. WhatsApp (opcional — la app ya funciona sin esto vía enlaces wa.me)
Solo si quieres **envío automático** sin abrir la app (WhatsApp Business Cloud API de Meta):
| Variable | Cómo se obtiene |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta for Developers → WhatsApp → API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Meta for Developers → token permanente |
| `WHATSAPP_APP_SECRET` | Meta → App settings |
| `WHATSAPP_VERIFY_TOKEN` | lo defines tú (cualquier cadena) |

> Cuenta requerida: **Meta Business + WhatsApp Business Platform** y **plantillas aprobadas** por Meta. Sin esto, todo sigue funcionando con `wa.me` (deep links).

### 4. Opcionales (rendimiento / escala)
| Variable | Para qué | Dónde |
|---|---|---|
| `REDIS_URL` | Rate limiting y colas en escala | Upstash / Redis gestionado |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Login con Google | Google Cloud Console → OAuth |

### 5. Dominio
- Comprar/usar un dominio y apuntarlo a Vercel.
- Añadir `tudominio.com` **y** comodín `*.tudominio.com` en Vercel → Domains (para subdominios por tienda).
- Actualizar `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_ROOT_DOMAIN`.

---

## ✅ Resumen rápido para "ir live"
1. **Stripe** (cuenta + 5 variables) → cobros de planes y tarjeta.
2. **Dominio** + comodín en Vercel → tiendas con su subdominio.
3. (Opcional) **WhatsApp Cloud API** de Meta → automatización; si no, sigue con wa.me.
4. (Opcional) **Redis** (Upstash) y **Google OAuth**.
5. Cambiar la contraseña del **superadmin** y subir imágenes reales de producto.

Lo demás (base de datos, auth, despliegue, datos demo) **ya está funcionando**.
