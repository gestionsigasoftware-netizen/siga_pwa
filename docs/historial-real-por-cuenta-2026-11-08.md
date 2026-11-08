# Historial real por cuenta (ya no localStorage) — 2026-11-08

## Pedido del usuario

Después del primer parche del mismo día (ver
`registros-recientes-entre-cuentas-2026-11-08.md`), el usuario pidió
la solución de fondo: "cada cuenta debe ver lo que haya registrado esa
cuenta que inició sesión, no datos de nadie más" — y que "Registros
recientes" en el Home muestre solo 4-5, con el resto del historial
completo viviendo en otra pantalla aparte.

El parche anterior (limpiar `localStorage` al cerrar sesión) seguía
siendo frágil: si alguien no cerraba sesión entre una cuenta y otra en
el mismo teléfono, el problema original volvía a pasar. La causa raíz
real era que ese dato vivía en el dispositivo, no en la cuenta.

## Solución

### 1. Columna nueva `capturado_por` (repo `siga-nacional`)

`registros_actividad` ya tenía `capturado_por uuid default auth.uid()`
desde el inicio. Los otros 3 tipos de captura de la PWA no lo tenían:

- `amigos`
- `obra_carcelaria_internos`
- `obra_carcelaria_cultos` (tiene `responsable_persona_id`, pero ese
  es un campo distinto — quién se marcó como responsable del culto en
  el formulario, no necesariamente quién tecleó el registro)

Migración: `supabase/modulos/capturado_por_pwa_historial.sql`
(`siga-nacional`) — agrega la columna con default `auth.uid()` a las
3 tablas. Los registros ya existentes quedan en `NULL` (no hay forma
de saber quién los capturó porque la columna no existía); simplemente
no aparecen en el historial de nadie, no se le atribuyen a la cuenta
equivocada. **Pendiente: el usuario debe correr este script en
producción.**

### 2. `getMiHistorial()` (repo `siga-pwa-nacional`, `src/lib/supabase.js`)

Trae y mezcla los 4 tipos de captura, todos filtrados por
`capturado_por = auth.uid()` (la cuenta logueada ahora mismo, no
`localStorage`), ordenados por fecha de creación descendente.

### 3. UI

- `Home.jsx`: "Registros recientes" ahora pide los **últimos 5** vía
  `getMiHistorial(5)` — en vivo del servidor, cada vez que se abre la
  pantalla.
- `Historial.jsx` (nueva, ruta `/historial`): historial completo
  (hasta 1000 registros) de la cuenta logueada, **paginado** en
  pantallas fijas de 30 con Anterior/Siguiente -- nunca scroll
  infinito ni todo pintado de una sola vez, aunque la cuenta tenga
  cientos o miles de registros. Se llega desde el nuevo botón "Ver
  historial completo" debajo de los recientes.
- `src/lib/historial.js`: helper compartido `labelDeHistorial()` +
  `fechaHistorial()`, usado por ambas pantallas para no duplicar el
  armado de las etiquetas.

### 4. Limpieza

Se eliminó por completo el mecanismo anterior de `localStorage`
(`RECENT_KEY`, `getRecentCaptures`, `rememberCapture`,
`clearRecentCaptures`) de `offline.js` y de las 4 pantallas de
captura que lo llamaban al guardar. **No se tocó** la cola de
capturas pendientes sin sincronizar (`PENDING_KEY` / `queueCapture` /
`syncPendingCaptures`) — eso sigue siendo correcto tal cual estaba,
es trabajo real del dispositivo sin enviar todavía, no un aviso de
"ya sincronizado".

## Verificación

`npm run build` limpio en ambos repos. Llaves i18n (`es`/`en`/`pt`)
verificadas sin faltantes. No se pudo probar con clics reales (no hay
cuenta de prueba de la PWA documentada — mismo gap de sesiones
anteriores); queda sujeto a que el usuario corra la migración SQL y
pruebe en su celular real.

Commits `5a50393` (PWA) + migración en `siga-nacional`, pusheados.
