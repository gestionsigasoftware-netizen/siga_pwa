const PENDING_KEY = 'siga-capturas-pendientes'
const RECENT_KEY = 'siga-capturas-recientes'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getPendingCaptures() { return read(PENDING_KEY) }
export function getRecentCaptures() { return read(RECENT_KEY) }

export function hasPendingCapture({ moduloId, tipoActividadId, nombreActividad, zonaId, fecha }) {
  return getPendingCaptures().some(({ tipo, payload }) => (tipo ?? 'actividad') === 'actividad'
    && payload.moduloId === moduloId
    && payload.tipoActividadId === tipoActividadId
    && payload.nombreActividad === nombreActividad
    && payload.zonaId === zonaId
    && payload.fecha === fecha)
}

export function hasPendingCultoCarcelaria({ centroId, fecha, patio }) {
  return getPendingCaptures().some(({ tipo, payload }) => tipo === 'obra_carcelaria'
    && (payload.centroId || null) === (centroId || null)
    && payload.fecha === fecha
    && (payload.patio || null) === (patio || null))
}

export function queueCapture(payload, label, tipo = 'actividad') {
  const capture = { id: crypto.randomUUID(), tipo, payload, label, createdAt: new Date().toISOString(), status: 'pending' }
  write(PENDING_KEY, [...read(PENDING_KEY), capture])
  return capture
}

export function rememberCapture(capture) {
  const recent = [{ ...capture, status: 'synced' }, ...read(RECENT_KEY)].slice(0, 12)
  write(RECENT_KEY, recent)
}

/**
 * `registrar` puede ser una función (compatibilidad con el único tipo
 * original, `registros_actividad`) o un mapa { tipo: registrarFn } cuando
 * hay más de un tipo de captura en la cola (ver `queueCapture`).
 */
export async function syncPendingCaptures(registrar) {
  const registrarPorTipo = typeof registrar === 'function' ? { actividad: registrar } : registrar
  const pending = read(PENDING_KEY)
  const remaining = []
  for (const capture of pending) {
    const fn = registrarPorTipo[capture.tipo ?? 'actividad']
    if (!fn) { remaining.push(capture); continue }
    const { error } = await fn(capture.payload)
    if (error) remaining.push(capture)
    else rememberCapture(capture)
  }
  write(PENDING_KEY, remaining)
  return { synced: pending.length - remaining.length, pending: remaining.length }
}
