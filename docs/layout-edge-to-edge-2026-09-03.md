# De tarjeta flotante a pantalla completa (edge-to-edge) (2026-09-03)

## El problema real (detectado probando en celular, no en el navegador)

El ajuste anterior de esta misma sesión ("layout unificado") hizo que
toda la app usara la misma tarjeta flotante centrada que tenía Login:
ancho máximo, bordes redondeados, sombra, sobre un fondo de un color
distinto. Se ve bien dentro de un navegador de escritorio, pero al
desplegar la PWA en Railway y probarla instalada en un celular real, se
vio exactamente como lo que es esa tarjeta: una página web con una
tarjeta encima, con margen visible en los cuatro lados -- no como una
app nativa, que es la intención real de instalarla en la pantalla de
inicio.

## Corrección: la app ahora llena la pantalla real

- **`src/pages/Login.jsx`**: se quitó el envoltorio con
  `px-5 py-6 bg-surface-1` + la tarjeta `rounded-3xl border shadow`. El
  encabezado oscuro y la sección blanca ahora ocupan todo el ancho y
  alto reales del dispositivo (`min-h-screen`, sin márgenes laterales),
  respetando las áreas seguras (notch arriba, barra de gestos abajo) con
  `pt-[env(safe-area-inset-top)]` / `pb-[env(safe-area-inset-bottom)]`.
  El único detalle "de tarjeta" que se conservó es la esquina superior
  redondeada de la sección blanca sobre el encabezado oscuro
  (`-mt-6 rounded-t-3xl`) -- un efecto de "hoja" muy común en apps
  nativas, no una tarjeta separada del fondo.
- **`src/index.css`** (`.app-shell` / `.app-screen`): mismo criterio
  para el resto de las pantallas (Home, Captura, Estadísticas) --
  `.app-shell` ahora es simplemente el fondo de pantalla completa con
  las áreas seguras respetadas; `.app-screen` ya no tiene fondo, borde
  ni sombra propios, solo aporta el padding interno del contenido. El
  resultado es el mismo en las cuatro pantallas: contenido hasta los
  bordes reales del dispositivo, con solo el padding necesario para que
  el texto no toque el borde -- no una tarjeta con margen alrededor.

## Verificación

`npm run build` corre limpio. Verificado con Playwright en viewport de
celular (390×844): Login, Home y el formulario de captura llegan ahora
a los bordes reales de la pantalla, sin el margen/fondo de contraste que
mostraba la captura de pantalla real del usuario en Railway.
