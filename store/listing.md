# BetterInsta — material para Chrome Web Store

## Ficha

- **Nombre** (máx. 45): `BetterInsta — menos scroll`
- **Resumen corto** (máx. 132): `Oculta Reels, Explorar y publicaciones sugeridas, deja solo Siguiendo y bloquea el scroll infinito de Instagram.`
- **Categoría sugerida**: Productividad (alternativa: Estilo de vida / Bienestar)
- **Idioma principal**: Español
- **Página de privacidad**: `https://TU_USUARIO.github.io/betterinsta/privacy.html`
- **Sitio web**: `https://github.com/TU_USUARIO/betterinsta`

## Descripción detallada

```
BetterInsta reduce el uso compulsivo de Instagram web quitando de en medio
lo que engancha y no aporta: Reels, Explorar, publicaciones sugeridas y el
scroll infinito. Tú decides qué desactivar desde el icono de la extensión.

QUÉ HACE
• Reels: oculta el tab de Reels y los reels del feed. Los reels que te
  comparte un amigo por mensaje directo se pueden seguir viendo.
• Explorar: elimina la pestaña de Explorar.
• Solo Siguiendo: en el inicio oculta la pestaña "Para ti" y deja únicamente
  el feed de "Siguiendo".
• Publicaciones sugeridas: se ocultan automáticamente en todo Instagram.
• Scroll infinito: bloquea la carga de más publicaciones al llegar al final.

PRIVACIDAD
No recopila ningún dato. Todo funciona en tu navegador; no hay servidores,
analíticas ni rastreadores. Solo se guardan tus preferencias de activación
con chrome.storage.sync.

CÓDIGO ABIERTO
https://github.com/TU_USUARIO/betterinsta
```

## Justificación de permisos

| Permiso | Motivo |
| --- | --- |
| `storage` | Guardar las preferencias de activación/desactivación del usuario. |
| `host_permissions` `*://*.instagram.com/*` | Aplicar los cambios de ocultado en Instagram web. |

No se usan permisos de red adicionales ni código remoto.

## Prácticas de privacidad (cuestionario del dashboard)

- **Single purpose**: reducir distracciones en Instagram web ocultando funciones concretas.
- **¿Recopila datos?** No. No se recopila ningún dato del usuario.
- **¿Usa datos para fines ajenos al propósito?** No.
- **¿Vende datos a terceros?** No.
- **¿Usa o transfiere datos para determinar creditworthiness/lending?** No.
- **¿Código remoto?** No. Todo el código va incluido en el paquete.
- **Certificación de datos**: marcar las 3 casillas (no se recopilan datos).

## Checklist de assets

- [x] Icono del paquete: `icons/icon16.png`, `32`, `48`, `128`.
- [ ] Icono de la tienda (128×128): usar `icons/icon128.png`.
- [ ] Captura 1 (1280×800 o 640×400): popup con los toggles.
- [ ] Captura 2: feed con "Para ti" oculto (solo Siguiendo).
- [ ] Captura 3: feed sin publicaciones sugeridas.
- [ ] Vídeo (opcional, YouTube).
- [ ] Página de privacidad publicada (GitHub Pages → carpeta `/docs`).
- [ ] URL de soporte (issues del repo) / email de contacto.

## Subida

1. Comprimir el contenido **sin** la carpeta raíz (manifest.json en la raíz del zip):
   `zip -r betterinsta.zip manifest.json icons content popup -x "*.DS_Store"`
2. Subir `betterinsta.zip` en <https://chrome.google.com/webstore/devconsole>.
3. Rellenar ficha, permisos y prácticas de privacidad con lo de arriba.
