# Branding SIGAP correcto + footer (2026-09-03)

## Pedido

La PWA seguía diciendo "SIGA" en vez de "SIGAP" (Login y Home), no tenía
el logo real de la marca (solo un badge con la letra "S"), mencionaba
"IPUC" en el login (igual que se corrigió antes en el proyecto web para
Inicio/Login), y no tenía ningún footer dentro de la app.

## Corrección

- **`src/assets/sigap-logo.svg`** y **`sigap-logo-white.svg`** (nuevos,
  copiados tal cual del proyecto web `siga-nacional/src/assets/` -- es
  el mismo logo real que ya usa el Sidebar de la web, no uno inventado).
- **`src/pages/Login.jsx`**: el badge "S" + texto "SIGA" + "IPUC ·
  Gestión pastoral" del encabezado oscuro se reemplazó por el logo real
  (versión blanca) + el mismo tagline que usa el Sidebar de la web
  ("Gestión y Analítica Pastoral"), sin mención a IPUC. "Tu espacio
  SIGA" → "Tu espacio SIGAP". El pie "IPUC · Gestión pastoral" → "SIGAP
  · Gestión pastoral" (mismo criterio que ya se aplicó en el Login de la
  web esta sesión).
- **`src/pages/Home.jsx`**: el badge "S" + texto "SIGA" del encabezado
  se reemplazó por el logo real (versión azul, para fondo claro).
- **`src/components/Footer.jsx`** (nuevo): mismo texto que el footer de
  la web (`Footer.jsx` de `siga-nacional`) -- "SIGAP — Sistema Integrado
  de Gestión y Analítica Pastoral" + "© {año} IPUC. Todos los derechos
  reservados. · By Jormelia Soft". Se mantiene "IPUC" aquí a propósito:
  es el mismo aviso legal de derechos de autor que ya tiene la web sin
  cambios -- lo que se quitó fue la mención a IPUC en el branding/marca
  del login, no este aviso.
- Se agregó el footer a **`Home.jsx`** y **`Estadisticas.jsx`** (las dos
  pantallas de navegación/consulta). No se agregó a las pantallas de
  captura (`CapturaActividad.jsx`, `CapturaCarcelaria.jsx`) para no
  quitarle espacio vertical al formulario en móvil -- si se quiere ahí
  también, es un cambio menor de seguirlo pidiendo.

## Verificación

`npm run build` corre limpio. Verificado visualmente con Playwright en
Login, Home y Estadísticas (viewport de celular): logo real visible,
"SIGAP" correcto en todos los textos, sin "IPUC" en el branding, footer
presente con el texto esperado.
