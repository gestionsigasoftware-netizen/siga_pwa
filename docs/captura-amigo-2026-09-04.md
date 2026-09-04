# Registrar Amigo nuevo desde la PWA (2026-09-04)

## El pedido

Capturar un "Amigo" (persona en proceso de evangelización/integración)
directamente desde la PWA, en Evangelismo y Misión Juvenil. Confirmado
con el usuario: debe guardarse en la misma tabla `amigos` que usa
"Amigos en ruta" en la web (proyecto `siga-nacional`), no en una tabla
aparte -- así el pastor le da seguimiento (etapa, notas, conversión,
incorporación a Feligresía) sin duplicar el registro.

Este cambio dependía de que el cargo del capturador tuviera zona
asignada (ver `docs/zona-centro-en-responsabilidad-operativa-2026-09-04.md`
en el proyecto web), porque la política de seguridad de `amigos`
(`amigos_write`, `tengo_acceso_zona(zona_id)`) exige que la zona del
registro coincida exactamente con la zona del cargo activo de quien
guarda -- sin eso, un capturador puro nunca podría insertar la fila,
sin importar qué se construyera aquí.

## Diseño

- Acceso: en Home, cada módulo que `requiere_zona` (Evangelismo, Misión
  Juvenil) y esté asignado muestra, debajo de su tarjeta principal, un
  botón secundario **"Registrar amigo nuevo"** -- solo si `requiere_zona`
  es `true`, porque solo esos módulos usan zona. Ujieres y Obra
  Carcelaria no lo muestran.
- La zona del amigo **no es editable** en el formulario -- se toma
  directo de `asignacion.zona_id` (la zona del cargo del capturador) y
  se muestra solo como texto informativo, igual que ya hace
  `CapturaActividad.jsx`. Si el cargo todavía no tiene zona, la pantalla
  lo explica y no deja continuar (evita un insert que la RLS igual
  rechazaría).
- Campos: nombre completo (obligatorio), teléfono, dirección, sector,
  invitado por, fecha de primer contacto (default hoy) -- todos
  opcionales salvo el nombre, igual que el formulario web. Metodología
  de evangelismo (catálogo `tipos_actividad` del módulo Evangelismo,
  vía `getTiposActividad`) solo se muestra en Evangelismo, no en Misión
  Juvenil.
- Soporta modo sin conexión igual que el resto de la app -- se reutilizó
  `queueCapture`/`syncPendingCaptures` con un tercer tipo `'amigo'`
  (antes solo `'actividad'` y `'obra_carcelaria'`).

## Cambios

- **`src/lib/supabase.js`**: `registrarAmigo({ congregacionId, zonaId,
  nombres, telefono, direccion, sector, invitadoPor,
  fechaPrimerContacto, evangelismoMetodologiaId })` -- inserta en
  `amigos`.
- **`src/pages/CapturaAmigo.jsx`** (nuevo): formulario de registro,
  calcado del patrón de `CapturaActividad.jsx` (mismo encabezado,
  mismo manejo de sin-conexión, misma pantalla de éxito).
- **`src/App.jsx`**: ruta `/captura-amigo/:asignacionId`.
- **`src/pages/Home.jsx`**: botón secundario "Registrar amigo nuevo" por
  módulo asignado con `requiere_zona`; `syncPendingCaptures` ahora
  también sincroniza el tipo `'amigo'` con `registrarAmigo`.

## Verificación

`npm run build` corre limpio. Probado de punta a punta con Playwright
contra el dev server y la cuenta de prueba (Evangelismo, con zona ya
asignada): el botón aparece, el formulario muestra la zona correcta,
el registro se guarda y se confirmó directo en la base de datos que
quedó con el `zona_id` correcto. Dato de prueba eliminado después de
verificar.
