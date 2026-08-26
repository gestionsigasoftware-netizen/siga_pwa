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
      zona_id,
      zonas ( id, nombre ),
      cargos (
        id,
        nombre_cargo,
        modulos ( id, nombre_modulo, alcance, requiere_zona, congregacion_id )
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
 * Inserta un registro de actividad — misma tabla `registros_actividad` que
 * consulta el Dashboard web y sus vistas de tendencia/alertas. capturado_por
 * se llena solo (default auth.uid() en el esquema).
 */
export async function registrarActividad({ congregacionId, moduloId, tipoActividadId, zonaId, responsablePersonaId, desglose, novedades }) {
  return supabase.from('registros_actividad').insert({
    congregacion_id: congregacionId,
    modulo_id: moduloId,
    tipo_actividad_id: tipoActividadId,
    zona_id: zonaId ?? null,
    responsable_persona_id: responsablePersonaId,
    desglose: desglose ?? {},
    novedades: novedades ?? null,
  })
}
