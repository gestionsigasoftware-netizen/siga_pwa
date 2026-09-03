# Ícono real, nombre SIGAP y footer eliminado (2026-09-03)

## Pedido

Probando la app instalada en el celular (Android), aparecía como "SIGA
Captura" con un ícono circular negro genérico (el placeholder de
`icon-192.png`/`icon-512.png` que nunca se había reemplazado). Además,
el footer agregado en la corrección anterior obligaba a hacer scroll de
más -- "normalmente las apps no tienen footer".

## Corrección

- **`public/icons/icon-192.png`** y **`icon-512.png`**: reemplazados por
  el ícono real de la marca -- el mismo mark (fondo negro redondeado +
  la flecha/gráfico blanco) que ya usa `favicon.svg` del proyecto web,
  generado a partir de ese mismo SVG (no un ícono inventado). Antes eran
  placeholders genéricos.
- **`vite.config.js`**: `manifest.name` → "SIGAP — Captura",
  `manifest.short_name` → "SIGAP" (antes "SIGA Captura" -- es lo que el
  launcher de Android muestra debajo del ícono, y lo que aparecía en la
  vista de apps recientes/ventanas flotantes de la captura del usuario).
- **`index.html`**: `<title>` → "SIGAP — Captura"; se agregó
  `<link rel="icon" type="image/png" href="/icons/icon-192.png">`
  explícito para que la pestaña del navegador también use el ícono real
  en vez de depender del `favicon.ico` placeholder.
- **`src/components/Footer.jsx`** eliminado, junto con su uso en
  `Home.jsx` y `Estadisticas.jsx` (agregado en la corrección anterior de
  esta misma sesión) -- decisión explícita del usuario de no tener
  footer para evitar scroll extra, coherente con que las apps móviles
  normalmente no llevan uno.

## Verificación

`npm run build` corre limpio; se inspeccionó `dist/manifest.webmanifest`
generado y confirma `short_name: "SIGAP"` y los íconos apuntando a los
PNG nuevos. Verificado visualmente con Playwright que Home y
Estadísticas ya no tienen el footer y caben sin scroll adicional.

## Pendiente del lado del usuario

Para ver el nombre e ícono nuevos en el celular hay que **desinstalar
la app actual** (el ícono viejo que instaló Android) y volver a
"Agregar a pantalla de inicio" después de que Railway despliegue este
cambio -- los navegadores/launchers cachean el ícono y el nombre de una
instalación previa, no se actualizan solos.
