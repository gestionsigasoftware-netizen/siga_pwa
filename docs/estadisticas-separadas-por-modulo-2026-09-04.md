# Estadísticas separadas por módulo (2026-09-04)

## El pedido

"Mis estadísticas" mezclaba todo: una persona con más de un cargo (ej.
Ujieres + Obra Carcelaria) veía los totales sumados juntos, sin poder
distinguir cuánto vino de cada módulo. Se confirmó el problema leyendo
`resumen_asistencia_movil` (suma `registros_actividad` de toda la
congregación agrupado solo por fecha, sin filtrar por módulo) y
`getMisRegistros()` (sin filtro de módulo tampoco).

## Rediseño

- **`src/lib/supabase.js`**: `getMisRegistros()` y
  `getResumenCongregacion()` (RPC agregada, sin filtro de módulo) se
  reemplazan por `getMisRegistrosPorModulo(moduloId)` y
  `getCongregacionRegistrosPorModulo(congregacionId, moduloId, desde)` --
  ambas consultan `registros_actividad` directamente, filtradas por
  `modulo_id`. `getMisCultosCarcelaria()`/
  `getCultosCarcelariaCongregacion()` (Obra Carcelaria, tabla aparte) se
  mantienen igual -- por naturaleza ya estaban aisladas de los demás
  módulos, solo faltaba dejar de mezclarlas con las otras en el mismo
  arreglo.
- **`src/pages/Estadisticas.jsx`**: se calcula `misModulos` -- la lista
  de módulos distintos que la cuenta tiene realmente asignados (a partir
  de `useMisAsignaciones()`). Se agregó una fila de pestañas nueva
  (solo visible si hay más de un módulo) para elegir cuál ver; todo lo
  demás (Mis registros/Congregación, periodo, tarjetas, lista) ahora se
  carga y calcula **solo para el módulo activo**, nunca mezclado.

## Verificación

`npm run build` corre limpio. Con la cuenta de prueba (Ujieres + Obra
Carcelaria activos) y Playwright: la pestaña "Obra Carcelaria" mostró 0
mientras existía un registro real de Ujieres con 106 asistentes ese
mismo mes -- confirma que ya no se mezclan. Se registró un culto real de
Ujieres (37 asistentes) y se confirmó que, al recargar, "Obra
Carcelaria" seguía en 0 (separación real, no solo visual). Se borró el
registro de prueba generado en esta verificación; los demás registros
de septiembre encontrados en la base no se tocaron por no tener certeza
de que fueran de prueba y no capturas reales del usuario.
