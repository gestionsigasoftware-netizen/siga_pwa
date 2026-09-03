# Layout unificado: toda la app con las dimensiones de Login (2026-09-03)

## El pedido

El usuario notó que Login se veía "como web" (tarjeta flotante centrada,
bordes redondeados grandes, sombra, sobre un fondo distinto), pero el
resto de la app (Home, Captura, Estadísticas) se veía plana, a pantalla
completa. Pidió que toda la PWA usara las mismas dimensiones que Login.

## Causa

`Login.jsx` nunca usó las clases compartidas `.app-shell`/`.app-screen`
— tiene su propio markup con la tarjeta flotante hecha a mano. Esas
clases compartidas (`src/index.css`), usadas por todas las demás
pantallas, solo ponían un ancho máximo (`max-w-lg`) sin tarjeta, sombra
ni fondo diferenciado.

## Corrección

Se invirtieron las responsabilidades de `.app-shell` y `.app-screen` en
`src/index.css` para replicar exactamente el patrón de Login:

- `.app-shell` pasó a ser el fondo de pantalla completa
  (`bg-surface-1`, con el padding y los insets de área segura que antes
  tenía `.app-screen`).
- `.app-screen` pasó a ser la tarjeta flotante centrada (`max-w-md`,
  `bg-surface-2`, `border`, `rounded-3xl`,
  `shadow-[0_16px_48px_rgba(21,27,34,0.1)]`, `overflow-hidden`) — mismas
  medidas que la tarjeta de Login.

`Login.jsx` no se tocó (ya tenía su propio markup correcto); el cambio
solo afecta a las páginas que usan las clases compartidas: Home,
CapturaActividad, CapturaCarcelaria, Estadisticas.

## Efecto secundario encontrado y corregido

El padding combinado (shell + tarjeta) le resta ancho útil al contenido
frente a antes. En las pantallas de captura, el rótulo superior
("Registro de asistencia" / "Registro carcelario") se partía en dos
líneas de forma desalineada con el botón de volver. Se corrigió
reduciendo tamaño/tracking de ese rótulo y fijando `whitespace-nowrap`
en `CapturaActividad.jsx` y `CapturaCarcelaria.jsx`.

## Verificación

Playwright contra `npm run dev`, con la cuenta de prueba
(`pueba691@gmail.com`): Login, Home, Captura Carcelaria y Estadísticas
en viewport de celular (390×844) — misma tarjeta flotante en las
cuatro. También se verificó en escritorio (1280×900): la tarjeta se ve
centrada sobre el fondo, igual que Login, en vez de estirarse a todo el
ancho. `npm run build` corre limpio.
