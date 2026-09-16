# CleanGram — material para Chrome Web Store

## Ficha

- **Nombre** (máx. 45): `CleanGram — menos scroll`
- **Resumen corto** (máx. 132): `Oculta Reels, Explorar y publicaciones sugeridas, deja solo Siguiendo y bloquea el scroll infinito de Instagram.`
- **Categoría sugerida**: Productividad (alternativa: Estilo de vida / Bienestar)
- **Idioma principal**: Español
- **Página de privacidad**: `https://cdoblas-eng.github.io/cleangram/privacy.html`
- **Sitio web**: `https://github.com/cdoblas-eng/cleangram`

## Descripción detallada

```
CleanGram reduce el uso compulsivo de Instagram web quitando de en medio
lo que engancha y no aporta: Reels, Explorar, publicaciones sugeridas y el
scroll infinito. Tú decides qué desactivar desde el icono de la extensión.

QUÉ HACE
• Reels: oculta el tab de Reels y los reels del feed. Los reels que te
  comparte un amigo por mensaje directo se pueden seguir viendo.
• Explorar: mantiene el botón (así puedes seguir buscando usuarios) pero
  oculta el contenido de reels y publicaciones del Explorar.
• Solo Siguiendo: en el inicio oculta la pestaña "Para ti" y deja únicamente
  el feed de "Siguiendo".
• Publicaciones sugeridas: se ocultan automáticamente en todo Instagram.
• Scroll infinito: bloquea la carga de más publicaciones al llegar al final.

PRIVACIDAD
No recopila ningún dato. Todo funciona en tu navegador; no hay servidores,
analíticas ni rastreadores. Solo se guardan tus preferencias de activación
con chrome.storage.sync.

CÓDIGO ABIERTO
https://github.com/cdoblas-eng/cleangram
```

## Justificación de permisos

| Permiso | Motivo |
| --- | --- |
| `storage` | Guardar las preferencias de activación/desactivación del usuario. |
| `host_permissions` `*://*.instagram.com/*` | Aplicar los cambios de ocultado en Instagram web. |

No se usan permisos de red adicionales ni código remoto.

## Prácticas de privacidad (textos para la pestaña del dashboard)

Copia y pega cada bloque en el campo correspondiente. Todos están por debajo
del límite de 1000 caracteres.

### Finalidad única (Single purpose)

```
CleanGram tiene una finalidad única: reducir el uso compulsivo de Instagram
web ocultando funciones concretas de su interfaz y dejando solo el feed de
"Siguiendo". Todas las funciones de la extensión sirven a ese mismo propósito:
ocultar el tab de Reels y los reels del feed, vaciar el contenido de Explorar
(sin quitar su botón, para poder seguir buscando),
ocultar las publicaciones sugeridas, bloquear el scroll infinito y guardar las
preferencias del usuario. No realiza ninguna otra función ni trata datos para
fines ajenos a este propósito.
```

### Justificación del permiso `storage`

```
El permiso storage se usa exclusivamente para guardar las preferencias de
activación/desactivación de las opciones de CleanGram (Reels, Explorar y Solo
Siguiendo) mediante chrome.storage.sync, de modo que se conserven entre
sesiones y, si el usuario tiene la sincronización activada, entre sus
dispositivos. Es el único dato que se escribe y no contiene información
personal ni de navegación. Sin este permiso el usuario tendría que volver a
configurar la extensión en cada visita.
```

### Justificación del uso de código remoto

```
CleanGram no usa código remoto. Todo el JavaScript y el CSS se incluye en el
propio paquete de la extensión y se ejecuta localmente en el navegador. No se
cargan scripts ni recursos ejecutables desde servidores externos, no se usa
eval() y no hay lógica que se descargue en tiempo de ejecución. La extensión
tampoco realiza peticiones de red.
```

### Justificación del permiso de host `*://*.instagram.com/*`

```
El permiso de host *://*.instagram.com/* es necesario porque la extensión solo
actúa sobre Instagram web. Inyecta una hoja de estilos y un script de contenido
que leen y modifican el DOM de instagram.com para ocultar Reels, Explorar y las
publicaciones sugeridas, dejar solo el feed de "Siguiendo" y bloquear el scroll
infinito. No accede a ningún otro sitio web y no envía datos fuera del
navegador.
```

### Otras preguntas del cuestionario

- **¿Recopila datos?** No (seleccionar "No recopila datos del usuario").
- **¿Usa datos para fines ajenos al propósito?** No.
- **¿Vende datos a terceros?** No.
- **¿Usa o transfiere datos para determinar creditworthiness/lending?** No.
- **Certificación de datos**: marcar las casillas de conformidad con las
  Políticas del Programa para Desarrolladores.

### Pasos que solo se pueden hacer en el dashboard

1. **Correo de contacto del editor** → página *Configuración*:
   `cdoblas.eng@gmail.com`.
2. **Verificar el correo de contacto** → botón *Verificar* en *Configuración*
   (se recibe un enlace por email).
3. **Certificar el uso de datos** → pestaña *Prácticas de privacidad*.


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
   `zip -r cleangram.zip manifest.json icons content popup -x "*.DS_Store"`
2. Subir `cleangram.zip` en <https://chrome.google.com/webstore/devconsole>.
3. Rellenar ficha, permisos y prácticas de privacidad con lo de arriba.
