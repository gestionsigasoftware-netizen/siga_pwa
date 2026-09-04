import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Usa las MISMAS credenciales que el proyecto web siga-nacional — es el mismo backend.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Trae las asignaciones de cargo ACTIVAS de la persona logueada, con su
 * módulo, congregación y zona — esto decide qué formulario(s) ve al entrar.
 * Es exactamente la misma tabla `asignaciones_cargo` que ya usa la web.
 */
export async function getMisAsignaciones() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { data: [], error: new Error('No autenticado') }

  const { data, error } = await supabase
    .from('asignaciones_cargo')
    .select(
      `
      id,
      persona_id,
      zona_id,
      zonas ( id, nombre ),
      cargos (
        id,
        nombre_cargo,
        modulos ( id, nombre_modulo, alcance, requiere_zona, congregacion_id, congregaciones ( id, nombre ) )
      )
    `
    )
    .eq('persona_id', (await supabase.from('personas').select('id').eq('auth_user_id', userData.user.id).single()).data?.id)
    .is('fecha_fin', null)

  return { data: data ?? [], error }
}

export async function getCategorias(congregacionId) {
  return supabase.from('categorias_demograficas').select('id, nombre').eq('congregacion_id', congregacionId).order('orden')
}

export async function getTiposActividad(moduloId) {
  return supabase.from('tipos_actividad').select('id, nombre, caracter').eq('modulo_id', moduloId).eq('activo', true)
}

/**
 * Catálogo de "caracter" de culto (Enseñanza, Alabanza, Evangelismo...),
 * administrado desde la web (Modulos.jsx) -- se elige al capturar para que
 * el mismo tipo de culto recurrente pueda variar de caracter cada vez.
 */
export async function getCaracteresCulto(congregacionId) {
  return supabase.from('caracteres_culto').select('id, nombre').eq('congregacion_id', congregacionId).eq('activo', true).order('nombre')
}

export async function getMisRegistros() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { data: [], error: new Error('No autenticado') }
  const { data: person } = await supabase.from('personas').select('id').eq('auth_user_id', userData.user.id).single()
  if (!person) return { data: [], error: new Error('Persona no vinculada') }
  return supabase.from('registros_actividad').select('id, fecha, total_asistentes, modulo_id, tipo_actividad_id, nombre_actividad, tipos_actividad(nombre)').eq('capturado_por', userData.user.id).order('fecha', { ascending: false }).limit(500)
}

export async function getResumenCongregacion(congregacionId, desde) {
  return supabase.rpc('resumen_asistencia_movil', {
    p_congregacion_id: congregacionId,
    p_desde: desde,
  })
}

export async function findDuplicateActivity({ moduloId, tipoActividadId, nombreActividad, zonaId, fecha }) {
  let query = supabase.from('registros_actividad').select('id').eq('modulo_id', moduloId).eq('fecha', fecha).limit(1)
  query = tipoActividadId ? query.eq('tipo_actividad_id', tipoActividadId) : query.is('tipo_actividad_id', null)
  query = nombreActividad ? query.eq('nombre_actividad', nombreActividad) : query.is('nombre_actividad', null)
  query = zonaId ? query.eq('zona_id', zonaId) : query.is('zona_id', null)
  return query.maybeSingle()
}

/**
 * Inserta un registro de actividad — misma tabla `registros_actividad` que
 * consulta el Dashboard web y sus vistas de tendencia/alertas. capturado_por
 * se llena solo (default auth.uid() en el esquema).
 */
export async function registrarActividad({ congregacionId, moduloId, tipoActividadId, nombreActividad, zonaId, responsablePersonaId, caracterId, fecha, desglose, novedades }) {
  return supabase.from('registros_actividad').insert({
    congregacion_id: congregacionId,
    modulo_id: moduloId,
    tipo_actividad_id: tipoActividadId,
    nombre_actividad: nombreActividad || null,
    zona_id: zonaId ?? null,
    responsable_persona_id: responsablePersonaId,
    caracter_id: caracterId || null,
    fecha,
    desglose: desglose ?? {},
    novedades: novedades ?? null,
  })
}

/**
 * Obra Carcelaria no participa del motor genérico (módulo + tipo de
 * actividad + desglose) — tiene su propio esquema en obra_carcelaria.sql.
 * El centro de reclusión se filtra por el distrito de la congregación
 * (centros_reclusion.distrito_id), no por congregación directamente.
 */
export async function getCentrosReclusion(congregacionId) {
  const { data: congregacion, error: congregacionError } = await supabase
    .from('congregaciones')
    .select('distrito_id')
    .eq('id', congregacionId)
    .single()
  if (congregacionError || !congregacion) return { data: [], error: congregacionError }
  return supabase
    .from('centros_reclusion')
    .select('id, nombre, tipo, ciudad')
    .eq('distrito_id', congregacion.distrito_id)
    .eq('activo', true)
    .order('nombre')
}

export async function findDuplicateCultoCarcelaria({ congregacionId, centroId, fecha, patio }) {
  let query = supabase.from('obra_carcelaria_cultos').select('id').eq('congregacion_id', congregacionId).eq('fecha', fecha).limit(1)
  query = centroId ? query.eq('centro_id', centroId) : query.is('centro_id', null)
  query = patio ? query.eq('patio', patio) : query.is('patio', null)
  return query.maybeSingle()
}

export async function registrarCultoCarcelaria({ congregacionId, centroId, fecha, patio, asistentesTotal, estudiosBiblicosEntregados, responsablePersonaId, notas }) {
  return supabase.from('obra_carcelaria_cultos').insert({
    congregacion_id: congregacionId,
    centro_id: centroId || null,
    fecha,
    patio: patio || null,
    asistentes_total: asistentesTotal,
    estudios_biblicos_entregados: estudiosBiblicosEntregados,
    responsable_persona_id: responsablePersonaId || null,
    notas: notas || null,
  })
}

/**
 * Obra Carcelaria no tiene columna `capturado_por` (a diferencia de
 * registros_actividad) -- "mis cultos" se identifica por
 * responsable_persona_id, que el formulario llena con quien captura.
 * Se normaliza a la misma forma que getMisRegistros() para que
 * Estadisticas.jsx pueda mezclarlos sin lógica adicional.
 */
export async function getMisCultosCarcelaria() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { data: [], error: new Error('No autenticado') }
  const { data: person } = await supabase.from('personas').select('id').eq('auth_user_id', userData.user.id).single()
  if (!person) return { data: [], error: new Error('Persona no vinculada') }
  const { data, error } = await supabase.from('obra_carcelaria_cultos').select('id, fecha, asistentes_total').eq('responsable_persona_id', person.id).order('fecha', { ascending: false }).limit(500)
  return { data: (data ?? []).map((row) => ({ id: row.id, fecha: row.fecha, total_asistentes: row.asistentes_total, nombre_actividad: 'Culto carcelario' })), error }
}

export async function getCultosCarcelariaCongregacion(congregacionId, desde) {
  const { data, error } = await supabase.from('obra_carcelaria_cultos').select('id, fecha, asistentes_total').eq('congregacion_id', congregacionId).gte('fecha', desde).order('fecha', { ascending: false })
  return { data: (data ?? []).map((row) => ({ id: row.id, fecha: row.fecha, total_asistentes: row.asistentes_total, nombre_actividad: 'Culto carcelario' })), error }
}
