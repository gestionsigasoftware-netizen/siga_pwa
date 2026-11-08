import i18n from '../i18n'

function localeActual() {
  return i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-CO'
}

// Compartido entre Home (ultimos 5) e Historial (todo) -- un item de
// getMiHistorial() trae { tipo, nombre, cantidad, createdAt }, y cada
// tipo arma su propia etiqueta legible.
export function labelDeHistorial(item, t) {
  if (item.tipo === 'amigo') return `${t('historial.amigoNuevo')} · ${item.nombre}`
  if (item.tipo === 'interno') return `${t('historial.internoNuevo')} · ${item.nombre}`
  if (item.tipo === 'culto') return `${t('historial.cultoCarcelario')} · ${t('historial.asistentesCantidad', { count: item.cantidad ?? 0 })}`
  return `${item.nombre || t('historial.actividadGenerica')} · ${t('historial.asistentesCantidad', { count: item.cantidad ?? 0 })}`
}

export function fechaHistorial(createdAt) {
  return new Date(createdAt).toLocaleDateString(localeActual(), { day: '2-digit', month: 'short' })
}
