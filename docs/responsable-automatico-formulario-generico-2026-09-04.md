# Responsable automático en el formulario genérico (Ujieres/Evangelismo/Misión Juvenil) (2026-09-04)

## El hallazgo

Al corregir Obra Carcelaria (ver
`docs/mejoras-obra-carcelaria-2026-09-03.md`) se auto-completó
`responsable_persona_id` con quien captura. La misma falta existía en
el formulario genérico -- usado por Ujieres, Misiones y Evangelismo y
Misión Juvenil -- y no se había corregido todavía:
`CapturaActividad.jsx` siempre mandaba `responsablePersonaId: null`.

## Corrección

**`src/pages/CapturaActividad.jsx`**: el payload ahora usa
`responsablePersonaId: asignacion.persona_id` (el mismo campo que ya se
trae desde `getMisAsignaciones()` desde el fix de Obra Carcelaria).

## Verificación

`npm run build` corre limpio. Se registró un culto de Ujieres real de
punta a punta y se confirmó leyendo la fila directamente:
`responsable_persona_id` quedó con el UUID correcto de la persona que
capturó -- a diferencia de dos registros anteriores (de antes del fix)
que efectivamente tenían ese campo en `null`, confirmando que el bug
era real. Se borró el registro de prueba al terminar.
