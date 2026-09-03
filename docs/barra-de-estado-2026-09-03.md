# La barra de estado del sistema respeta el color de cada pantalla (2026-09-03)

## El problema

`<meta name="theme-color">` en `index.html` estaba fijo en `#0B0B0B`
(negro) -- ese valor es el que usa el sistema operativo para colorear la
barra de notificaciones/estado cuando la PWA corre instalada. Como es un
valor estático, quedaba negro en todas las pantallas, incluidas las
claras (Home, Captura, Estadísticas, con fondo `#FCFCFB`) -- se veía
como una franja negra pegada encima de una pantalla blanca.

## Corrección

**`src/App.jsx`**: nuevo componente `RouteThemeColor` (renderizado
dentro de `<BrowserRouter>`, usa `useLocation()`) que actualiza el
atributo `content` del meta tag en cada cambio de ruta -- `#0B0B0B`
(negro) solo en `/login`, que es la única pantalla con encabezado
oscuro; `#FCFCFB` (el mismo `bg-surface` del resto de la app) en todo lo
demás.

El manifest (`vite.config.js`) mantiene `theme_color: '#0B0B0B'` sin
tocar -- ese valor solo se usa para la pantalla de carga (splash) antes
de que el JS arranque, y Login (oscuro) es la primera pantalla que ve
cualquiera que abra la app, así que sigue siendo el valor correcto para
ese instante inicial.

## Verificación

`npm run build` corre limpio. Verificado programáticamente (Playwright,
leyendo el atributo `content` del meta tag): `#0B0B0B` en `/login`,
`#FCFCFB` en `/` y `/estadisticas`. El efecto visual real en la barra de
notificaciones del sistema solo se puede confirmar en el celular, ya que
un navegador de escritorio no la simula.
