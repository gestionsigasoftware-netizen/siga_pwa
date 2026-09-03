# Skeletons, mensajes de estado y hueco de seguridad en el acceso por cargo (2026-09-03)

## 1. Skeletons de carga

Todas las pantallas usaban un spinner genérico (`Loader2`) centrado
mientras cargaban, sin relación con la forma real del contenido.

- **`src/components/Skeleton.jsx`** (nuevo): `SkeletonHome`,
  `SkeletonForm`, `SkeletonEstadisticas` -- bloques grises con
  `animate-pulse` que imitan la forma real de cada pantalla (encabezado +
  4 tarjetas de módulo en Home; encabezado + campos de formulario en
  Captura; encabezado + filtros + tiles + lista en Estadísticas).
- Se reemplazó el spinner por el skeleton correspondiente en
  `Home.jsx`, `CapturaActividad.jsx`, `CapturaCarcelaria.jsx`,
  `Estadisticas.jsx` y `ProtectedRoute.jsx` (este último sin contenido de
  skeleton propio -- solo se le dio el mismo tratamiento de tarjeta
  flotante que ya tiene el resto, para no romper la consistencia visual
  mientras resuelve la sesión).
- `CapturaActividad.jsx` y `CapturaCarcelaria.jsx` no tenían ningún
  estado de carga para las categorías/tipos de actividad/centros de
  reclusión -- el formulario aparecía con los selects vacíos un instante
  antes de llenarse. Se agregó `loadingDetalle` para que el skeleton se
  mantenga hasta que esos datos realmente lleguen.

## 2. Mensajes de estado que faltaban

`getCategorias`, `getTiposActividad` (en `CapturaActividad.jsx`) y
`getCentrosReclusion` (en `CapturaCarcelaria.jsx`) ignoraban el `error`
de la respuesta -- si la carga fallaba, el formulario se quedaba con los
selects vacíos sin ninguna explicación. Ahora, si cualquiera de esas
cargas falla, se muestra el mismo mensaje de error rojo que ya usa el
resto del formulario ("No se pudo cargar el formulario..." /
"No se pudieron cargar los centros de reclusión...").

## 3. Hueco de seguridad real en el acceso por cargo (el hallazgo más importante)

El usuario reportó que una cuenta que "se supone que solo tiene acceso a
Obra Carcelaria" podía igual entrar a Ujieres y registrar asistencia.
Investigar esto llevó a revisar las políticas RLS reales (no solo el
código de React) y encontró dos cosas:

**a) El mecanismo de cargos nunca funcionó de verdad para su público
real.** La política que autoriza el INSERT de `registros_actividad`
(`registros_write_scope`, en el proyecto web `supabase/asistencia_web.sql`)
exige, además de pertenecer a la congregación, tener el permiso
`estadisticas.registrar` o `feligresia.editar` vía `tiene_permiso()`.
Esa función solo concede eso automáticamente cuando `rol_local =
'pastor'`. La función `invitar-usuario` (Edge Function del proyecto web)
SIEMPRE crea una fila en `roles_sistema` al invitar a alguien -- con
`rol_local = 'solo_lectura'` cuando no se le asignó un perfil de acceso
web. Es decir: una persona invitada **solo** con un cargo (el caso real
que esta PWA fue pensada para servir -- un ujier o un delegado de Obra
Carcelaria sin acceso a la web) nunca cumplía esa condición. Hasta hoy,
**no podía guardar ni un solo registro**, sin importar que la PWA le
mostrara el formulario correcto -- un bug pre-existente a esta sesión,
nunca detectado porque todas las pruebas anteriores usaron una cuenta de
pastor (que sí pasa `tiene_permiso()` sin importar su cargo).

**b) Por qué la cuenta de prueba sí entraba a Ujieres.** La cuenta usada
para probar (`pueba691@gmail.com`) es el pastor de su congregación, con
perfil "Acceso total". Un pastor tiene autoridad total sobre su propia
congregación por diseño (igual que en la web) -- el cargo específico
nunca fue lo que se lo permitía.

### Corrección (confirmada con el usuario: el pastor conserva su
### autoridad total; solo se restringe a quien NO es pastor)

Nuevo script en el proyecto web, **`supabase/rls_cargo_pwa.sql`**
(ningún archivo de código de React se tocó -- es una corrección de datos
de seguridad en el backend compartido, igual categoría que
`sembrar_modulo_obra_carcelaria.sql`). Agrega policies RLS NUEVAS y
aditivas (ninguna existente se reemplaza ni se toca):

- Lectura de catálogo (congregación propia, módulos, zonas, categorías,
  tipos de actividad, cargos, asignaciones propias, centros de
  reclusión) para quien tiene un cargo activo -- necesario para que la
  PWA pueda simplemente armar el formulario.
- Lectura/escritura de `registros_actividad` y `obra_carcelaria_cultos`
  para quien tiene un cargo activo, pero **solo en el módulo exacto de
  ese cargo** (verificado con funciones `security definer` nuevas:
  `tengo_cargo_activo`, `tengo_cargo_en_modulo_congregacion`,
  `tengo_cargo_obra_carcelaria`).

Quien ya tenía acceso amplio (pastor, distrital, nacional, super_admin)
lo conserva exactamente igual -- esas policies existentes no se tocaron.

### Pendiente: ejecutar en Supabase y verificar con una cuenta real solo-cargo

El usuario debe ejecutar `rls_cargo_pwa.sql` en el SQL Editor de
Supabase (después de `schema.sql`, `migracion_produccion.sql`,
`accesos.sql`, `asistencia_web.sql`, `obra_carcelaria.sql` y
`sembrar_modulo_obra_carcelaria.sql`, que ya deben estar aplicados).

No se pudo verificar el arreglo de punta a punta con una cuenta
genuinamente "solo cargo, sin rol de pastor" en esta sesión: crear una
así requiere completar una invitación real por correo (enlace mágico) o
credenciales que el usuario cree y comparta -- no hay acceso de service
role disponible para crearla directamente. Queda pendiente esa
verificación con una cuenta de prueba nueva si el usuario quiere
confirmarla.

## Verificación

`npm run build` corre limpio. Skeletons verificados visualmente con
Playwright (red ralentizada a propósito para capturar el estado de
carga) en Home, el formulario de captura y Estadísticas -- las tres
formas coinciden con el contenido real que las reemplaza. El fix de RLS
se verificó por lectura directa y razonamiento sobre las policies
existentes (confirmado, no supuesto), pero no con una prueba end-to-end
todavía (ver pendiente arriba).
