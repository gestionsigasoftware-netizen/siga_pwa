# Registrar amigo nuevo — habilitado para Ujieres — 2026-09-07

## Contexto

"Registrar amigo nuevo" (`CapturaAmigo.jsx`, construido el
2026-09-04) solo estaba disponible para módulos con `requiere_zona =
true` (Evangelismo, Misión Juvenil -- trabajo extramural organizado
por zona). Ujieres (intramural -- recibe/ubica personas en el salón de
predicación y toma la asistencia general del culto) no maneja zonas,
así que quedaba sin esta captura, aunque es quien está físicamente
presente en cualquier culto normal y por tanto el más indicado para
anotar "esta persona entregó su vida a Cristo esta noche" en el
momento.

Ujieres no administra población (no es un comité de seguimiento como
Jóvenes o Damas Dorcas) -- por eso el nuevo campo "Comité que lo
recibió" es **opcional**: si el ujier no sabe a qué comité le
corresponderá el seguimiento, se deja en blanco y el pastor lo asigna
después desde la web (Amigos.jsx).

## Cambios

- `src/pages/Home.jsx`: `permiteAmigos` ahora también es verdadero
  para el módulo Ujieres (`esModuloUjieres`), no solo cuando
  `modulo.requiere_zona`.
- `src/pages/CapturaAmigo.jsx`: el bloqueo por falta de zona
  (`"Tu cargo todavía no tiene zona asignada"`) ahora solo aplica si
  `modulo.requiere_zona` -- Ujieres entra sin necesitar zona. Nuevo
  selector opcional "Comité que lo recibió" (carga
  `getComites(congregacionId)`).
- `src/lib/supabase.js`: nueva función `getComites(congregacionId)`;
  `registrarAmigo()` acepta `comiteOrigenId` y lo guarda en la columna
  `amigos.comite_origen_id` (agregada en la web el mismo día, migración
  `comite_origen_amigo.sql` del repo `siga-nacional`).

## Requisito de base de datos (ejecutado en el repo web)

Este cambio depende de una migración RLS que vive en el repo
`siga-nacional` (`supabase/modulos/tengo_cargo_activo_rls.sql`), no en
este proyecto -- agrega políticas para que cualquier cargo activo
(no solo pastores) pueda insertar un amigo sin zona y leer la lista de
comités de su congregación. Sin esa migración, un ujier real (sin rol
de pastor) recibiría un error de RLS al intentar guardar.

## Verificación

`npm run build` sin errores. La verificación de la RLS (función
`tengo_cargo_activo_congregacion`) se hizo desde el repo web -- ver su
doc `docs/fixes/registrar-amigo-ujieres-pwa-2026-09-07.md`. No se probó
de extremo a extremo en esta PWA con una cuenta real de ujier (sin rol
de pastor) -- pendiente cuando haya una disponible.
