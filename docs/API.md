# API pública (REST v1)

Disponible en el plan **Enterprise**. Autenticación por **API key** (header
`Authorization: Bearer <key>` o `x-api-key`). Base URL: `https://TU-DOMINIO`.

## Llaves
- Se generan en **Dashboard → API**. La llave en texto plano se muestra **una sola vez**.
- Solo se guarda un hash SHA-256; revócalas cuando quieras.
- Formato: `wc_live_...`. Cada llave pertenece a una tienda.

## Rate limits
- Lectura: 120 req/min · Escritura: 60 req/min (por tienda + IP).

## Endpoints

### GET /api/v1/products
Lista productos de la tienda (precio, stock, variantes, categoría).

```bash
curl https://TU-DOMINIO/api/v1/products -H "Authorization: Bearer wc_live_xxx"
```

### GET /api/v1/customers
Lista clientes (nombre, teléfono, total gastado, etiquetas).

### GET /api/v1/orders?status=NEW
Lista pedidos recientes (filtro opcional por estado).

### POST /api/v1/orders
Crea un pedido. Body (JSON):
```json
{
  "items": [{ "productId": "...", "name": "Taco", "unitPrice": 25, "quantity": 2, "extras": [] }],
  "customer": { "name": "Ana", "phone": "5215511112222" },
  "deliveryMethod": "PICKUP",
  "paymentMethod": "CASH"
}
```
Los precios se recalculan en el servidor; respeta límites de plan y stock.
Respuesta incluye `number`, `total`, `ticket` (texto WhatsApp) y `waLink`.

## Errores
JSON `{ "ok": false, "error": { "message", "code" } }` con códigos HTTP estándar
(401 sin/clave inválida, 403 plan sin API o tienda inactiva, 422 validación, 429 rate limit).
