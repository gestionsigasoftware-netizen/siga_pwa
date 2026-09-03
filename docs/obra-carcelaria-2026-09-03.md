# Captura de Obra Carcelaria en la PWA (2026-09-03)

## Contexto

La PWA (`siga-pwa-nacional`) captura únicamente lo extramural: Ujieres
(intramural, en el templo), Evangelismo, Misión Juvenil y — a partir de
este cambio — Obra Carcelaria. Feligresía/censo y los comités con ficha
individual (Damas Dorcas, etc.) siguen siendo exclusivos de la web.

Obra Carcelaria **no participa** del motor genérico de captura (módulo +
tipo de actividad + desglose por categoría) que sí usan Ujieres,
Evangelismo y Misión Juvenil. Tiene su propio esquema en el proyecto web
(`supabase/obra_carcelaria.sql`): `centros_reclusion`,
`obra_carcelaria_cultos` (`centro_id, fecha, patio, asistentes_total,
estudios_biblicos_entregados, responsable_persona_id, notas`), y tablas
de seguimiento individual de internos que no se tocan desde la PWA.

## Decisiones de diseño (confirmadas con el usuario)

1. Pantalla de captura propia, con los campos reales de
   `obra_carcelaria_cultos` — no el formulario genérico de categorías
   demográficas, porque el modelo de datos es distinto.
2. El acceso se otorga mediante un cargo real (`cargos` +
   `asignaciones_cargo`), no reutilizando el sistema de perfiles de la
   web (`perfiles_acceso`). Es el mismo mecanismo que ya usan
   Ujieres/Evangelismo/Misión Juvenil.

## Qué se construyó (todo dentro de este proyecto, `siga-pwa-nacional`)

- **`src/lib/modulos.js`** (nuevo): `esModuloObraCarcelaria(nombreModulo)`
  — detecta el módulo por nombre (`/carcelari/i`), igual que la web ya
  identifica Evangelismo/Misión Juvenil por nombre exacto.
- **`src/lib/supabase.js`**: `getCentrosReclusion(congregacionId)`
  (resuelve el `distrito_id` de la congregación y consulta
  `centros_reclusion` de ese distrito) y `registrarCultoCarcelaria(payload)`
  (inserta en `obra_carcelaria_cultos`).
- **`src/lib/offline.js`**: generalizado para soportar más de un tipo de
  captura en la misma cola local. `queueCapture(payload, label, tipo)`
  ahora guarda un discriminador `tipo` (`'actividad'` por defecto,
  compatible con lo que ya había en el dispositivo antes de este cambio).
  `syncPendingCaptures` acepta un mapa `{ tipo: registrarFn }` además de
  una función suelta (retrocompatible). Se agregó `hasPendingCultoCarcelaria`
  para evitar duplicados en la cola del dispositivo.
- **`src/pages/CapturaCarcelaria.jsx`** (nuevo): centro de reclusión,
  patio, fecha, asistentes, estudios bíblicos entregados y notas. Mismo
  patrón de confirmación y guardado offline que `CapturaActividad.jsx`.
- **`src/pages/Home.jsx`** y **`src/App.jsx`**: la asignación rutea a
  `/captura-carcelaria/:id` en vez del formulario genérico cuando el
  módulo es Obra Carcelaria; la sincronización al reconectar ahora pasa
  ambos registradores (`{ actividad, obra_carcelaria }`).

## Cambio necesario del lado del backend (no de código web)

El mecanismo módulo → cargo → asignación ya funcionaba de punta a punta
sin tocar la web (`EquipoCongregacion.jsx` → función `invitar-usuario` →
`cargos`/`asignaciones_cargo`, lo mismo que lee `useMisAsignaciones()` en
la PWA). Pero **faltaba el dato**: a diferencia de Evangelismo/Misión
Juvenil, que siembran su fila en `modulos` desde su propia migración SQL,
Obra Carcelaria nunca tuvo esa siembra porque su funcionalidad web vive
en tablas separadas. Por eso no aparecía como opción en "Responsabilidad
operativa" en Equipo de trabajo.

Se creó `supabase/sembrar_modulo_obra_carcelaria.sql` en el proyecto web
(mismo patrón que `supabase/evangelismo.sql`): crea, para cada
congregación, un módulo "Obra Carcelaria" (`alcance = 'extramural'`, sin
`tipos_actividad` porque no usa el motor genérico) si no existe. El
usuario lo ejecutó en Supabase.

## Verificación (Playwright, de punta a punta)

1. Tras ejecutar el script, "Obra Carcelaria" apareció en el dropdown de
   Responsabilidad operativa en Equipo de trabajo (web).
2. Se asignó esa responsabilidad a la cuenta de prueba
   (`pueba691@gmail.com`, rol local, Puerto Tejada Cauca Central) — mismo
   flujo que cualquier otro módulo, sin cambios de código web.
3. En la PWA, la cuenta pasó a ver dos asignaciones ("Ujieres" y "Obra
   Carcelaria"), ambas como "Capturador PWA".
4. La pantalla nueva cargó los centros de reclusión reales de esa
   congregación.
5. Se guardó un registro de prueba completo (5 asistentes, 2 estudios
   entregados) → "Registro sincronizado", insert real en
   `obra_carcelaria_cultos` sin errores de RLS.
6. Se borró el registro de prueba al terminar.

## Pendiente / fuera de alcance de este cambio

- La pantalla `/modulos` de la web siempre crea módulos nuevos con
  `alcance: 'interno'` fijo (no da opción de elegir 'extramural'). No se
  tocó porque el usuario pidió no modificar el proyecto web más allá del
  script SQL — si en el futuro alguien crea un módulo manualmente desde
  ahí (en vez de por script de siembra), quedaría con el alcance
  incorrecto. Queda anotado, no corregido.
- No se agregó un selector de `responsable_persona_id` en la pantalla de
  captura de la PWA (el campo es opcional en el esquema y no se pidió).
