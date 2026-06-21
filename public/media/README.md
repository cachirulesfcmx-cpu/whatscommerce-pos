# Media para landings por industria

Coloca aquí tus imágenes/videos y referencia la URL en `src/lib/industries.ts`:

```ts
{ slug: "reposteria", ..., heroImage: "/media/reposteria.jpg" }
{ slug: "restaurantes", ..., heroVideo: "/media/restaurantes.mp4", heroImage: "/media/restaurantes-poster.jpg" }
```

- Video: MP4 (H.264), ~10-20s, en bucle, sin audio. Recomendado < 5 MB.
- Imagen: 1600×900 (16:9), JPG/WebP.
Si no defines `heroImage`/`heroVideo`, se usa un gradiente por defecto.
