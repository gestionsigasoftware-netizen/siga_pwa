# Color de los íconos de la barra de estado (2026-09-04)

## El reporte

Ya se había corregido que el FONDO de la barra de estado combinara con
cada pantalla (negro en Login, claro en el resto). Pero en Login los
íconos del sistema (hora, batería, señal) seguían viéndose oscuros
sobre ese fondo negro -- invisibles por falta de contraste.

## Corrección

El color de fondo y el color de los íconos son dos cosas separadas:

- **Android**: no hay una etiqueta explícita -- el navegador decide el
  color de los íconos según qué tan oscuro es `theme-color`. Con
  `#0B0B0B` (casi negro) debería ponerlos claros automáticamente. Si en
  un celular real siguen viéndose oscuros, la causa más probable es que
  la app instalada (el "WebAPK" que genera Android al agregarla a la
  pantalla de inicio) quedó generada con una versión anterior del
  sitio -- esa decisión no se recalcula sola después. Ver "Acción
  requerida" abajo.
- **iOS**: sí tiene una etiqueta explícita,
  `apple-mobile-web-app-status-bar-style` (no existía en `index.html`).
  Se agregó, junto con `apple-mobile-web-app-capable` y
  `viewport-fit=cover` en el `<meta name="viewport">` (necesario para
  que `env(safe-area-inset-*)` -- ya usado en `Login.jsx` y
  `.app-shell` -- funcione de verdad; sin `viewport-fit=cover` esas
  variables siempre valen 0).
- **`src/App.jsx`**: `RouteThemeColor` (ya existente, cambiaba
  `theme-color` por ruta) ahora también actualiza
  `apple-mobile-web-app-status-bar-style`: `black-translucent` (íconos
  claros) en `/login`, `default` (íconos oscuros) en el resto.

## Verificación

`npm run build` corre limpio. Verificado programáticamente que ambas
meta etiquetas cambian correctamente por ruta. El efecto visual real de
los íconos solo se puede confirmar en un dispositivo -- Playwright de
escritorio no simula la barra de notificaciones del sistema operativo.

## Acción requerida del usuario

Para ver el cambio en Android: **desinstala la app actual** de la
pantalla de inicio y vuelve a agregarla desde `https://app.sigap.com.co`
-- el WebAPK de Android decide el color de sus íconos al momento de
instalarse, no se actualiza solo con cada despliegue nuevo.

## Actualización: lo anterior no fue suficiente en Android real

Tras reinstalar, los íconos del sistema (hora, batería, señal) seguían
viéndose oscuros sobre el header negro del login. Se investigó a fondo
(no solo se supuso) y se confirmó que **esto no es un error de esta
app, sino una limitación real y documentada de Android/Chrome**: a
diferencia de iOS (que sí expone
`apple-mobile-web-app-status-bar-style` para elegir explícitamente
iconos claros u oscuros), Android **no tiene ninguna etiqueta web
estándar para forzar el color de esos íconos** -- depende de un cálculo
automático de Chrome a partir de `theme-color` que tiene fallas
documentadas (hay un issue abierto en el rastreador de Chromium sobre
exactamente esto: la app instalada no respeta el color de tema
esperado).

Como no hay forma confiable de garantizar "íconos claros sobre fondo
oscuro" en Android, y el usuario prefirió uniformidad legible sobre
continuidad visual, se simplificó todo a un solo color claro
(`#FCFCFB`) para la barra de estado **en todas las pantallas,
incluido el login** -- ya no depende de la ruta:

- **`index.html`**: `theme-color` y
  `apple-mobile-web-app-status-bar-style` quedaron fijos en
  `#FCFCFB` / `default` (antes cambiaban a oscuro en `/login`).
- **`vite.config.js`**: `manifest.theme_color` también pasó a
  `#FCFCFB` (antes `#0B0B0B`), para que combine con
  `background_color` y no haya un destello oscuro en la pantalla de
  splash antes de que cargue la app.
- **`src/App.jsx`**: se eliminó el componente `RouteThemeColor` -- ya
  no hace falta cambiar nada por ruta, todo usa el mismo valor
  estático.

El encabezado oscuro del login (`bg-ink`) no se tocó -- queda una
franja clara (la barra de estado) justo encima de él, aceptada como
compromiso a cambio de que los iconos del sistema siempre se vean bien
en cualquier dispositivo Android.
