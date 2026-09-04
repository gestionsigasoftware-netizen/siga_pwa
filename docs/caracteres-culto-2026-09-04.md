# Carácter de culto configurable (2026-09-04)

## El pedido

Un mismo tipo de culto recurrente (ej. "Culto Martes") puede tener un
carácter distinto según la semana (Enseñanza una vez, Alabanza otra),
sin que eso sea parte del nombre fijo del tipo de culto. El catálogo de
caracteres se administra desde la web (para evitar texto libre
inconsistente: "Alabanza", "alabanza", "Alavanza"...); desde la PWA solo
se elige de esa lista al capturar.

## Lo que se agregó aquí

- **`src/lib/supabase.js`**: `getCaracteresCulto(congregacionId)` (lee
  el catálogo, tabla `caracteres_culto` -- nueva, ver
  `supabase/caracteres_culto.sql` en el proyecto web);
  `registrarActividad()` ahora acepta y guarda `caracterId`
  (`registros_actividad.caracter_id`, columna nueva).
- **`src/pages/CapturaActividad.jsx`**: nuevo selector opcional
  "Carácter del culto", debajo de la elección del culto -- **solo
  aparece si la congregación ya tiene al menos un carácter
  configurado**, para no ensuciar el formulario de quienes no usan esta
  función todavía. Se refleja también en la pantalla de confirmación si
  se eligió alguno.

## Alcance

Solo el formulario genérico (Ujieres/Evangelismo/Misión Juvenil). Obra
Carcelaria no usa este motor y no se tocó.

## Comportamiento si la tabla aún no existe en Supabase

El selector de carácter fue diseñado para degradar sin romper nada: si
`caracteres_culto` todavía no existe (falta ejecutar el script en el
proyecto web), `getCaracteresCulto()` devuelve una lista vacía y el
selector simplemente no aparece -- el resto del formulario sigue
funcionando igual que antes.

## Verificación

`npm run build` corre limpio. Verificación de punta a punta pendiente
de que se ejecute `supabase/caracteres_culto.sql` (proyecto web) en
Supabase.
