import { useState, useEffect } from 'react'
import { getMisAsignaciones } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMisAsignaciones() {
  const { user } = useAuth()
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let active = true
    getMisAsignaciones().then(({ data }) => {
      if (!active) return
      setAsignaciones(data)
      setLoading(false)
    })
    return () => { active = false }
  }, [user])

  return { asignaciones, loading }
}
