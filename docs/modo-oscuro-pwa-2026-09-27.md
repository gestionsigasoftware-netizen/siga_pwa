# Modo dia/noche en la PWA — 2026-09-27

## Contexto

Tras cerrar el i18n de la PWA (ver `docs/i18n-pwa-2026-09-27.md`), el
usuario pregunto si el modo oscuro tambien quedo y pidio agregarlo.
Se confirmo antes que no existia (colores fijos en
`tailwind.config.js`, `color-scheme: light` forzado en `index.css`).

## Implementacion (mismo patron ya probado en el proyecto web)

- `tailwind.config.js`: `darkMode: 'class'` + colores apuntando a
  variables CSS (`rgb(var(--color-x-rgb) / <alpha-value>)`) en vez de
  hex fijo, mas el token nuevo `night` (negro fijo, igual en ambos
  temas).
- `src/index.css`: bloques `:root` / `:root.dark` con los mismos
  valores RGB exactos que el proyecto web (misma marca, cero deriva
  visual entre web y PWA en modo claro).
- `src/hooks/useTheme.jsx` (`ThemeProvider`/`useTheme`) -- copia
  exacta del hook del web, persistencia en `localStorage` bajo
  `sigap:theme` (aislado por origen).
- `src/components/ThemeToggle.jsx` -- mismo componente del web, con
  una generalizacion propia: prop `dark` (igual convencion que
  `LanguageSwitcher`) para forzar el tratamiento "sobre superficie
  oscura fija" en el encabezado del Login, independiente del tema
  real -- sin esto, en tema claro el boton quedaria con texto gris
  sobre un fondo oscuro fijo, ilegible.
- Selector agregado en Login (encabezado oscuro fijo) y Home
  (superficie reactiva), junto al selector de idioma ya existente,
  misma decision de UX de la sesion anterior.
- `main.jsx`: `<ThemeProvider>` envolviendo `<App />`.

## Bugs reales corregidos durante la implementacion (no solo "agregar tema")

1. **8 usos de `bg-ink`/`border-ink`/`shadow-ink` que en realidad
   necesitaban una superficie oscura FIJA**, no el color de texto
   reactivo `ink` (que en modo oscuro se invierte a casi-blanco):
   boton primario (`.btn-primary`) y `.app-mark` en `index.css`,
   encabezado del Login, las pildoras "activo" en `Estadisticas.jsx`
   (modulo/alcance/periodo, 3 lugares), y el fondo del modal de
   confirmacion + sombra de boton en las 4 pantallas de captura. Se
   corrigieron todos a `night` -- mismo criterio ya usado en el
   proyecto web (`bg-night text-white border-night` para pildoras
   activas, confirmado grepeando el codigo real del web antes de
   asumir el patron).
2. **Bug latente heredado del propio `LanguageSwitcher.jsx` portado
   ayer**: su variante `dark` usaba `bg-white text-ink` para el
   idioma activo -- funciona en el web porque ahi `dark` solo se
   activa junto con el tema oscuro real (`esOscuro`), y aun asi seria
   el mismo problema si se probara; en la PWA `dark` esta fijo en el
   encabezado del Login (siempre oscuro, sin importar el tema real),
   asi que con tema oscuro activo `ink` se vuelve casi-blanco y el
   texto quedaria invisible sobre el fondo blanco de la pildora
   activa. Corregido a `text-night` (fijo, garantiza contraste
   siempre). No se toco el componente del web (fuera de alcance,
   caso de borde raro ahi).
3. **Regresion de layout que la propia adicion introdujo**: sumar
   `LanguageSwitcher` + `ThemeToggle` al encabezado de `Home.jsx`
   junto al indicador de conexion hacia que se encimaran a 390px de
   ancho (viewport de telefono real). Se reorganizo en dos filas
   (marca+indicador arriba, selectores abajo) en vez de dejarlo
   comprimido en una sola fila.

## Verificacion

- `npm run build` real sin errores, dos veces (antes y despues de los
  ajustes de layout).
- Playwright real contra `npm run dev`: toggle de tema con clic real
  en Login (confirmado por clase `dark` en `<html>` y
  `getComputedStyle` del `<body>`), persistencia tras recargar
  pagina, estado compartido correcto tras iniciar sesion real y
  llegar a Home, capturas de pantalla en claro/oscuro de Login, Home,
  Estadisticas (pildoras activas) y un formulario de captura real
  (Ujieres) -- todos con contraste correcto, cero errores de consola.
- **Nota de proceso**: una primera captura de pantalla parecio mostrar
  un campo de formulario "blanco" en modo oscuro (posible artefacto
  de temporizacion del screenshot); se verifico con
  `getComputedStyle` directo sobre el elemento (no solo la captura) y
  se reprodujo la captura de forma limpia para confirmar que el color
  real aplicado si era el oscuro correcto antes de dar el hallazgo
  por descartado -- coherente con la memoria del proyecto sobre no
  confiar solo en comparar screenshots.

## Pendiente

Ninguno. El modo oscuro completo el trabajo de tema+idiomas (Fase 1-3)
en la PWA, igual que ya estaba completo en el proyecto web.
