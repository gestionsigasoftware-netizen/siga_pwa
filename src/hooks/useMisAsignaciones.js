import { useState, useEffect } from 'react'
import { getMisAsignaciones } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMisAsignaciones() {
  const { user, loading: authLoading } = useAuth()
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mientras useAuth todavia no resuelve la sesion, `user` vale null igual
    // que cuando de verdad no hay sesion -- sin este freno, ese primer
    // instante se confunde con "sin usuario" y se alcanza a mostrar "sin
    // asignacion" un momento antes de que la sesion real cargue.
    if (authLoading) return undefined
    if (!user) { setAsignaciones([]); setLoading(false); return undefined }
    let active = true
    setLoading(true)
    getMisAsignaciones().then(({ data }) => {
      if (!active) return
      setAsignaciones(data)
      setLoading(false)
    })
    return () => { active = false }
  }, [user, authLoading])

  return { asignaciones, loading: authLoading || loading }
}
