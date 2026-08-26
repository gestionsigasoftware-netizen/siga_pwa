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
  return getPendingCaptures().some(({ payload }) => payload.moduloId === moduloId
    && payload.tipoActividadId === tipoActividadId
    && payload.nombreActividad === nombreActividad
    && payload.zonaId === zonaId
    && payload.fecha === fecha)
}

export function queueCapture(payload, label) {
  const capture = { id: crypto.randomUUID(), payload, label, createdAt: new Date().toISOString(), status: 'pending' }
  write(PENDING_KEY, [...read(PENDING_KEY), capture])
  return capture
}

export function rememberCapture(capture) {
  const recent = [{ ...capture, status: 'synced' }, ...read(RECENT_KEY)].slice(0, 12)
  write(RECENT_KEY, recent)
}

export async function syncPendingCaptures(registrar) {
  const pending = read(PENDING_KEY)
  const remaining = []
  for (const capture of pending) {
    const { error } = await registrar(capture.payload)
    if (error) remaining.push(capture)
    else rememberCapture(capture)
  }
  write(PENDING_KEY, remaining)
  return { synced: pending.length - remaining.length, pending: remaining.length }
}
