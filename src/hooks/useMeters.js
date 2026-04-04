import { useState, useCallback } from 'react'

const STORAGE_KEY = 'nesco_meters'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch { return [] }
}

function save(meters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meters))
}

export default function useMeters() {
  const [meters, setMeters] = useState(load)

  const addMeter = useCallback((number, name) => {
    setMeters(prev => {
      const exists = prev.find(m => m.number === number)
      if (exists) {
        // Update name if changed, keep everything else
        const updated = prev.map(m => m.number === number ? { ...m, name: name || m.name } : m)
        save(updated)
        return updated
      }
      const isPrimary = prev.length === 0
      const next = [...prev, { number, name: name || '', primary: isPrimary, addedAt: Date.now() }]
      save(next)
      return next
    })
  }, [])

  const removeMeter = useCallback((number) => {
    setMeters(prev => {
      const next = prev.filter(m => m.number !== number)
      // If we removed the primary, make the first one primary
      if (next.length > 0 && !next.some(m => m.primary)) {
        next[0].primary = true
      }
      save(next)
      return next
    })
  }, [])

  const setPrimary = useCallback((number) => {
    setMeters(prev => {
      const next = prev.map(m => ({ ...m, primary: m.number === number }))
      save(next)
      return next
    })
  }, [])

  const getPrimary = useCallback(() => {
    return meters.find(m => m.primary) || meters[0] || null
  }, [meters])

  return { meters, addMeter, removeMeter, setPrimary, getPrimary }
}
