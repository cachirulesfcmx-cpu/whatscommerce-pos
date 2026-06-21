# ✅ Checklist de despliegue — WhatsCommerce POS

## Lo que YA quedó hecho automáticamente

- ✅ **Base de datos creada** en Supabase: proyecto **`whatscommerce-pos`** (región us-east-1, Postgres 17, $0/mes).
- ✅ **Esquema completo aplicado** por SQL: las ~36 tablas, todos los enums, índices y llaves foráneas.
- ✅ **Datos sembrados**: 3 planes, 8 plantillas, super admin y **3 tiendas demo** (comida, boutique, servicios) con productos, variantes, inventario, cupones, clientes y pedidos.
- ✅ **Código commiteado** en git (138 archivos) en la carpeta del proyecto.
- ✅ **`AUTH_SECRET` generado** (abajo).

## Lo que falta (lo haces tú — 5–10 min)

Estas herramientas no me permiten **escribir variables de entorno en Vercel** ni leer la **contraseña de la base de datos**, así que estos dos pasos son manuales.

---

### Paso 1 — Obtén la cadena de conexión de la base de datos

1. Entra a **https://supabase.com/dashboard/project/phmjxwoczoyoaxrfhylu**
2. Botón **Connect** (arriba) → pestaña **ORMs** → **Prisma**. Verás `DATABASE_URL` y `DIRECT_URL` listos.
3. Si te pide la contraseña: **Settings → Database → Reset database password**, genera una y cópiala.

La forma exacta (reemplaza `[PASSWORD]`):

```
DATABASE_URL=postgresql://postgres.phmjxwoczoyoaxrfhylu:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.phmjxwoczoyoaxrfhylu:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```
> Nota: el host del pooler de este proyecto es **`aws-1-us-east-1`** (confirmado desde el panel de Supabase). Copia siempre las cadenas exactas del diálogo *Connect → ORMs → Prisma*.

---

### Paso 2 — Despliega en Vercel

**Opción A — Git (recomendada):** sube el repo a GitHub y en Vercel haz **Add New → Project → Import** ese repo.

```bash
# desde la carpeta del proyecto
git remote add origin https://github.com/<tu-usuario>/whatscommerce-pos.git
git push -u origin main
```

**Opción B — CLI:**

```bash
npm i -g vercel
vercel        # vincula/crea el proyecto
vercel --prod
```

Framework: **Next.js** (autodetectado). Build command y output son los de Next por defecto (el `build` ya incluye `prisma generate`).

---

### Paso 3 — Configura las variables de entorno en Vercel

En **Project → Settings → Environment Variables**, agrega (Production):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | *(la del Paso 1)* |
| `DIRECT_URL` | *(la del Paso 1)* |
| `AUTH_SECRET` | `deHEYSXiAip1ECJSp5qJFgR0McgAj7CiErDsnnpiUtU=` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://<tu-deploy>.vercel.app` *(ajústalo tras el 1er deploy)* |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `whatscommerce.com` *(o tu dominio real)* |

**Opcionales** (la app funciona sin ellas, en modo pagos manuales / WhatsApp por wa.me):
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`, `WHATSAPP_*`, `REDIS_URL`.

Tras agregarlas, **Redeploy** (Deployments → ⋯ → Redeploy). El primer build sin variables puede quedar a medias; con ellas, queda funcional.

---

## 🔑 Credenciales (ya sembradas en la base de datos)

| Rol | Email | Contraseña |
|---|---|---|
| Super Admin | `admin@whatscommerce.com` | `WhatsAdmin#2026` |
| Tienda comida | `comida@demo.com` | `Demo1234` |
| Boutique | `boutique@demo.com` | `Demo1234` |
| Servicios | `servicios@demo.com` | `Demo1234` |

Tiendas públicas: `/store/tacos-el-guero` · `/store/boutique-luna` · `/store/estudio-creativo`

> **Cambia la contraseña del super admin** después del primer login.

---

## 🌐 Nota sobre multi-tenant (subdominios)

El ruteo por subdominio (`tienda.tudominio.com`) y dominio propio requiere un **dominio real con comodín `*.tudominio.com`** apuntado a Vercel. Sobre `*.vercel.app` no hay wildcard, pero **todo funciona igual por ruta**: `tudominio.vercel.app/store/<slug>`. Cuando conectes tu dominio, agrega `tudominio.com` y `*.tudominio.com` en Vercel → Domains y actualiza `NEXT_PUBLIC_ROOT_DOMAIN`.

## 🔗 Webhooks (cuando actives Stripe / WhatsApp)
- Stripe → `https://<tu-dominio>/api/webhooks/stripe`
- WhatsApp → `https://<tu-dominio>/api/webhooks/whatsapp` (verify token = `WHATSAPP_VERIFY_TOKEN`)
