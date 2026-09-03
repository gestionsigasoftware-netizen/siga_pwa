# Mejoras a la captura de Obra Carcelaria (2026-09-03)

## Contexto

Auditoría del módulo Obra Carcelaria (comparando la pantalla de captura
de la PWA contra el módulo completo de la web y su esquema real,
`obra_carcelaria.sql`) para identificar qué faltaba. Se encontraron 4
puntos; se corrigieron 3, el cuarto se dejó fuera a propósito.

## 1. Responsable del culto (corregido)

La web permite elegir un responsable al registrar un culto
(`responsable_persona_id`); la PWA no tenía ese campo y siempre lo
dejaba vacío, perdiendo esa trazabilidad. Como la persona que registra
desde el celular casi siempre ES la responsable, se auto-completa con
su propio `persona_id` en vez de agregar un selector más al formulario
móvil.

- **`src/lib/supabase.js`**: `getMisAsignaciones()` ahora también trae
  `persona_id` de `asignaciones_cargo` (antes no se seleccionaba, aunque
  la fila sí pertenece a esa persona). `registrarCultoCarcelaria()`
  acepta y guarda `responsablePersonaId`.
- **`src/pages/CapturaCarcelaria.jsx`**: el payload de guardado incluye
  `responsablePersonaId: asignacion.persona_id`.

## 2. Validación de duplicados (corregido)

El formulario genérico (Ujieres/Evangelismo/Misión Juvenil) ya
verificaba si existía un registro igual antes de guardar; Obra
Carcelaria no tenía ese chequeo.

- **`src/lib/supabase.js`**: nueva `findDuplicateCultoCarcelaria({
  congregacionId, centroId, fecha, patio })` -- busca un culto existente
  con el mismo centro, patio y fecha.
- **`src/pages/CapturaCarcelaria.jsx`**: se llama antes de confirmar el
  guardado (solo si hay conexión, igual criterio que el formulario
  genérico), y bloquea con un mensaje claro si ya existe.

## 3. "Mis estadísticas" no incluía nada de Obra Carcelaria (corregido)

`Estadisticas.jsx` solo leía `registros_actividad` -- Obra Carcelaria
vive en su propia tabla (`obra_carcelaria_cultos`), así que un
capturador de Obra Carcelaria no veía ningún historial ni progreso
propio, aunque sí estuviera guardando datos correctamente.

- **`src/lib/supabase.js`**: nuevas `getMisCultosCarcelaria()` (filtra
  por `responsable_persona_id` -- esta tabla no tiene columna
  `capturado_por` como `registros_actividad`, por eso depende de que el
  punto 1 quedara resuelto primero) y
  `getCultosCarcelariaCongregacion(congregacionId, desde)`. Ambas
  normalizan sus filas a la misma forma que ya usa `getMisRegistros()`
  (`fecha`, `total_asistentes`, `nombre_actividad: 'Culto carcelario'`)
  para que se puedan mezclar sin tocar el resto de la pantalla.
- **`src/pages/Estadisticas.jsx`**: se agregan esos resultados a
  `records`/`congregationRecords` además de lo que ya cargaba.

## 4. Asistencia individual por interno (dejado fuera, a propósito)

En la web, al registrar un culto también se puede marcar qué internos
con ficha activa asistieron (alimenta `obra_carcelaria_asistencia`,
útil para saber quién ha estado yendo). La PWA solo captura el número
total de asistentes. **No se agregó** esa lista de casillas al
formulario móvil: iría en contra de la decisión de arquitectura de esta
misma sesión de mantener la gestión de fichas individuales solo en la
web, y alargaría justo el formulario que debe ser rápido de llenar en
el celular. Queda anotado como una limitación conocida y aceptada, no
como pendiente.

## Verificación

`npm run build` corre limpio. De punta a punta con Playwright y la
cuenta de prueba: se registró un culto real (responsable guardado,
confirmado leyendo la fila directamente); se intentó registrar el mismo
culto una segunda vez y se rechazó por duplicado; "Mis estadísticas"
mostró el culto ("Culto carcelario", 7 asistentes) bajo "Mis registros".
Se borró el registro de prueba al terminar.
