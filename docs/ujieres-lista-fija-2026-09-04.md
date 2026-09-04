# Ujier responsable por culto (2026-09-04)

## El pedido

Hay una lista fija de ~42 personas que sirven como ujieres. Al capturar
la asistencia de Ujieres, se necesita elegir cuál de ellos fue el
responsable de ese culto -- no la persona logueada (`responsable_persona_id`,
que ya se auto-completa desde el fix anterior), porque puede ser una
cuenta compartida entre varios ujieres y no todos tienen cuenta propia.

Confirmado: la lista no entra al censo (catálogo propio, ver
`supabase/ujieres_congregacion.sql` en el proyecto web) y solo se
guarda UN responsable por culto, no dos, aunque el turno real sea de a
dos personas.

## Lo que se agregó aquí

- **`src/lib/modulos.js`**: `esModuloUjieres(nombreModulo)`.
- **`src/lib/supabase.js`**: `getUjieresCongregacion(congregacionId)`;
  `registrarActividad()` acepta y guarda `ujierResponsableId`
  (`registros_actividad.ujier_responsable_id`, columna nueva).
- **`src/pages/CapturaActividad.jsx`**: selector **"Ujier responsable"**,
  **obligatorio**, solo visible cuando el módulo activo es Ujieres y la
  congregación ya tiene ujieres cargados. Se valida junto con el culto
  y la fecha antes de dejar guardar.

## Diferencia con "Carácter del culto"

Mismo patrón técnico (catálogo administrado en la web, elegido al
capturar), pero con dos diferencias: este selector es obligatorio (no
opcional), y solo aparece en Ujieres -- carácter de culto aplica a
cualquier módulo del motor genérico.

## Verificación

`npm run build` corre limpio. Pendiente de punta a punta hasta que se
ejecute el script SQL y se cargue la lista real de ujieres desde la
web.
