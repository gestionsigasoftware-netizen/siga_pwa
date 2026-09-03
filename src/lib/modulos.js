export function esModuloObraCarcelaria(nombreModulo) {
  return /carcelari/i.test(nombreModulo || '')
}

/**
 * Las 4 areas extramurales/Ujieres que captura esta PWA, siempre visibles
 * en Home aunque la cuenta no tenga acceso a todas -- el permiso se valida
 * al elegir una, no al construir la lista (ver Home.jsx).
 */
export const MODULOS_CONOCIDOS = [
  { id: 'ujieres', nombre: 'Ujieres', match: /ujier/i },
  { id: 'evangelismo', nombre: 'Misiones y Evangelismo', match: /evangel/i },
  { id: 'mision_juvenil', nombre: 'Misión Juvenil', match: /juvenil/i },
  { id: 'obra_carcelaria', nombre: 'Obra Carcelaria', match: /carcelari/i },
]

export function buscarAsignacion(asignaciones, modulo) {
  return asignaciones.find((a) => modulo.match.test(a.cargos?.modulos?.nombre_modulo || ''))
}
