import { useState, useCallback } from 'react'

const STORAGE_KEY = 'nesco_meters'
const DEFAULT_PROVIDER = 'nesco'

function normalizeMeter(entry, fallbackProvider = DEFAULT_PROVIDER) {
  if (!entry) return null
  if (typeof entry === 'string') {
    return {
      number: entry,
      name: '',
      nickname: '',
      provider: fallbackProvider,
      primary: false,
      addedAt: Date.now(),
    }
  }
  if (!entry.number) return null
  return {
    number: String(entry.number),
    name: entry.name || '',
    nickname: entry.nickname || '',
    provider: entry.provider || fallbackProvider,
    primary: Boolean(entry.primary),
    addedAt: entry.addedAt || Date.now(),
  }
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    const normalized = parsed
      .map((entry) => normalizeMeter(entry))
      .filter(Boolean)
    if (normalized.length > 0 && !normalized.some((m) => m.primary)) {
      normalized[0] = { ...normalized[0], primary: true }
    }
    return normalized
  } catch { return [] }
}

function save(meters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meters))
}

function sameMeter(a, number, provider = DEFAULT_PROVIDER) {
  return a.number === number && (a.provider || DEFAULT_PROVIDER) === (provider || DEFAULT_PROVIDER)
}

export default function useMeters() {
  const [meters, setMeters] = useState(load)

  const addMeter = useCallback((number, name, provider = DEFAULT_PROVIDER) => {
    const meterNo = String(number)
    const meterProvider = provider || DEFAULT_PROVIDER
    setMeters(prev => {
      const exists = prev.find(m => sameMeter(m, meterNo, meterProvider))
      if (exists) {
        const updated = prev.map((m) =>
          sameMeter(m, meterNo, meterProvider)
            ? { ...m, name: name || m.name, provider: meterProvider }
            : m
        )
        save(updated)
        return updated
      }
      const isPrimary = prev.length === 0
      const next = [...prev, { number: meterNo, name: name || '', nickname: '', provider: meterProvider, primary: isPrimary, addedAt: Date.now() }]
      save(next)
      return next
    })
  }, [])

  const removeMeter = useCallback((number, provider) => {
    const meterNo = String(number)
    const meterProvider = provider || null
    setMeters(prev => {
      const next = prev.filter((m) => (
        meterProvider
          ? !sameMeter(m, meterNo, meterProvider)
          : m.number !== meterNo
      ))
      // If we removed the primary, make the first one primary
      if (next.length > 0 && !next.some(m => m.primary)) {
        next[0] = { ...next[0], primary: true }
      }
      save(next)
      return next
    })
  }, [])

  const setPrimary = useCallback((number, provider) => {
    const meterNo = String(number)
    const meterProvider = provider || null
    setMeters(prev => {
      const next = prev.map((m) => ({
        ...m,
        primary: meterProvider
          ? sameMeter(m, meterNo, meterProvider)
          : m.number === meterNo,
      }))
      save(next)
      return next
    })
  }, [])

  const setNickname = useCallback((number, provider, nickname) => {
    const meterNo = String(number)
    const meterProvider = provider || DEFAULT_PROVIDER
    setMeters(prev => {
      const next = prev.map((m) =>
        sameMeter(m, meterNo, meterProvider)
          ? { ...m, nickname: nickname || '' }
          : m
      )
      save(next)
      return next
    })
  }, [])

  const getPrimary = useCallback(() => {
    return meters.find(m => m.primary) || meters[0] || null
  }, [meters])

  return { meters, addMeter, removeMeter, setPrimary, setNickname, getPrimary }
}
