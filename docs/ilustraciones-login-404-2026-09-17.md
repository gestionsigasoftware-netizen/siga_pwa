# Ilustraciones en login y 404 — 2026-09-17

Parte de una pieza más grande hecha en el proyecto web (`siga-nacional`,
ver `docs/fixes/ilustraciones-estados-vacios-2026-09-17.md` en ese
repo): SIGAP debía sentirse "amigable en todo lado", incluida la PWA.

Se copiaron dos componentes de ilustración ya construidos y verificados
en el proyecto web a `src/components/illustrations/` de este proyecto,
sin modificarlos:

- `EmptyStreetIllustration.jsx` → `NotFound.jsx` (reemplaza el ícono de
  brújula).
- `EnterIllustration.jsx` → `Login.jsx` (insignia circular blanca junto
  al titular del encabezado oscuro -- la ilustración está pensada para
  fondo claro, por eso la insignia).

Ambas son ilustraciones reales de unDraw (licencia libre, uso comercial
permitido), recoloreadas al azul de marca y con el tono de piel de los
personajes reemplazado por un gris cálido neutro (ni blanco ni negro,
para no representar ninguna raza en particular).

Verificado con `npm run build` sin errores.
