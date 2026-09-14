# BetterInsta

Extensión de Chrome que desactiva funciones de Instagram web para reducir el tiempo de uso.

## Funciones

- **Reels**: oculta el tab de Reels y los reels del feed, pero permite abrir un reel compartido (p. ej. por DM). El scroll infinito de reels queda bloqueado.
- **Explorar**: oculta la pestaña y enlaces de Explorar.
- **Solo Siguiendo**: en el inicio oculta la pestaña "Para ti" y deja solo "Siguiendo".
- **Publicaciones sugeridas**: se ocultan automáticamente (siempre activo) en todo Instagram.
- **Scroll infinito**: se bloquean las peticiones de paginación del feed, así no se cargan más publicaciones (incluidas las sugeridas).

Las opciones Reels, Explorar y Solo Siguiendo se gestionan desde el popup y se guardan con `chrome.storage.sync`. El resto es siempre activo.

## Instalación en modo desarrollador

1. Abre `chrome://extensions`.
2. Activa **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida** y selecciona esta carpeta.
4. Abre `instagram.com` y ajusta las opciones desde el icono de la extensión.

## Estructura

```
manifest.json          Manifest V3
content/
  content.js           Aplica las opciones al DOM de Instagram
  content.css          Reglas de ocultado
  inject.js            Bloquea la paginación (scroll infinito) en el contexto de página
popup/
  popup.html/css/js    Interfaz de configuración
icons/                 Iconos 16/32/48/128
tools/
  generate-icons.mjs   Regenera los iconos (Node, sin dependencias)
docs/
  privacy.html         Política de privacidad
store/
  listing.md           Material y checklist para la Chrome Web Store
```

## Compatibilidad

Usa Manifest V3 y la API `chrome.*`, así que funciona en navegadores basados en Chromium: **Chrome, Edge, Brave, Opera, Vivaldi, Arc**, etc. Cada uno tiene su propia tienda (Edge Add-ons, Opera Add-ons...); el código es el mismo, solo cambia dónde se publica. Firefox **no** es Chromium y no soporta `world: "MAIN"` en content scripts, por lo que `content/inject.js` necesitaría adaptación.

## Publicación

Resumen en [`store/listing.md`](store/listing.md). Datos clave:

- Coste único de desarrollador en Chrome Web Store: **5 USD**. Publicar es gratis.
- Empaquetar sin la carpeta raíz: `zip -r betterinsta.zip manifest.json icons content popup -x "*.DS_Store"`.
- Subir `betterinsta.zip` en <https://chrome.google.com/webstore/devconsole>.
- Publicar `docs/` con GitHub Pages para tener la URL de privacidad.

## Notas

Instagram cambia sus clases con frecuencia; los selectores usan `href` y `aria-label` para mantenerse estables. Si algo deja de ocultarse, revisa `content/content.css`.

`content/inject.js` se ejecuta en el mundo MAIN para interceptar `fetch` y `XMLHttpRequest`. Bloquea peticiones GraphQL con cursor `after` (paginación) en el feed de inicio y en las vistas de reels; la petición queda sin resolver para que la app no cargue más y no reintente. La carga inicial de un reel compartido no usa cursor, por lo que sí se muestra.