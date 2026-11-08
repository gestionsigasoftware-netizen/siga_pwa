# "Registros recientes" mostraba datos de otra cuenta — 2026-11-08

## Síntoma

El usuario inició sesión en la PWA desde su celular y en "Registros
recientes" (pantalla Home) aparecían entradas que no eran suyas (ej.
"Amigo nuevo · Pepito higo", un registro de prueba).

## Causa

`getRecentCaptures()` (`src/lib/offline.js`) lee de `localStorage`
bajo la clave `siga-capturas-recientes`, sin ninguna relación con la
cuenta que inició sesión — es solo un aviso local de "esto se
sincronizó desde este aparato". `signOut()` (`src/hooks/useAuth.js`)
solo cerraba la sesión de Supabase; nunca limpiaba ese almacenamiento
local. Si el mismo teléfono se usó antes con otra cuenta (prueba,
demo, otro líder), esos registros quedaban guardados indefinidamente
y los veía cualquiera que después iniciara sesión en ese mismo
dispositivo.

## Corrección

Nueva función `clearRecentCaptures()` en `offline.js`, llamada desde
`signOut()`. Deliberadamente **no** se toca `PENDING_KEY` (la cola de
capturas sin sincronizar) — borrar eso al cerrar sesión arriesgaría
perder datos reales que el usuario aún no ha podido enviar (ej. sin
conexión). Solo se limpia la lista de "recientes", que ya está
sincronizada y es puramente informativa.

## Efecto para el usuario

Después de que el despliegue llegue a Cloudflare, con cerrar sesión
una vez en el dispositivo afectado basta para que la lista quede
limpia desde ese momento en adelante.

Commit `1cff562`, pusheado.
