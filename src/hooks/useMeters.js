import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'nesco_meters'
const DEFAULT_PROVIDER = 'nesco'
const AUTO_PRIMARY_MIN_OPENS = 3
const AUTO_PRIMARY_RATIO = 0.7
const HOT_CACHE_MIN_OPENS = 3

function normalizeMeter(entry, fallbackProvider = DEFAULT_PROVIDER) {
  if (!entry) return null
  if (typeof entry === 'string') {
    return {
      number: entry,
      name: '',
      nickname: '',
      provider: fallbackProvider,
      manualPrimary: false,
      openCount: 0,
      addedAt: Date.now(),
      lastOpenedAt: Date.now(),
    }
  }
  if (!entry.number) return null
  const manualPrimary = Boolean(entry.manualPrimary ?? entry.primary)
  const openCount = Number.isFinite(Number(entry.openCount)) ? Number(entry.openCount) : 0
  const addedAt = Number.isFinite(Number(entry.addedAt)) ? Number(entry.addedAt) : Date.now()
  const lastOpenedAt = Number.isFinite(Number(entry.lastOpenedAt))
    ? Number(entry.lastOpenedAt)
    : addedAt

  return {
    number: String(entry.number),
    name: entry.name || '',
    nickname: entry.nickname || '',
    provider: entry.provider || fallbackProvider,
    manualPrimary,
    openCount,
    addedAt,
    lastOpenedAt,
  }
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    const normalized = parsed
      .map((entry) => normalizeMeter(entry))
      .filter(Boolean)
    return normalized
  } catch { return [] }
}

function save(meters) {
  const serialized = meters.map((m) => ({
    number: m.number,
    name: m.name || '',
    nickname: m.nickname || '',
    provider: m.provider || DEFAULT_PROVIDER,
    manualPrimary: Boolean(m.manualPrimary),
    openCount: Number(m.openCount) || 0,
    addedAt: Number(m.addedAt) || Date.now(),
    lastOpenedAt: Number(m.lastOpenedAt) || Date.now(),
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
}

function sameMeter(a, number, provider = DEFAULT_PROVIDER) {
  return a.number === number && (a.provider || DEFAULT_PROVIDER) === (provider || DEFAULT_PROVIDER)
}

function decorateMeters(rawMeters) {
  if (!rawMeters.length) return []
  const maxOpenCount = rawMeters.reduce((max, meter) => Math.max(max, Number(meter.openCount) || 0), 0)
  const autoPrimaryThreshold = maxOpenCount >= AUTO_PRIMARY_MIN_OPENS
    ? Math.max(AUTO_PRIMARY_MIN_OPENS, Math.ceil(maxOpenCount * AUTO_PRIMARY_RATIO))
    : Infinity

  return rawMeters.map((meter) => {
    const openCount = Number(meter.openCount) || 0
    const manualPrimary = Boolean(meter.manualPrimary)
    const autoPrimary = openCount >= autoPrimaryThreshold
    const primary = manualPrimary || autoPrimary
    const hotForCache = primary || openCount >= HOT_CACHE_MIN_OPENS

    return {
      ...meter,
      manualPrimary,
      autoPrimary,
      primary,
      hotForCache,
    }
  })
}

function rankMetersForPrimary(a, b) {
  const aPriority = (a.manualPrimary ? 3 : 0) + (a.autoPrimary ? 2 : 0)
  const bPriority = (b.manualPrimary ? 3 : 0) + (b.autoPrimary ? 2 : 0)
  if (bPriority !== aPriority) return bPriority - aPriority

  const aOpen = Number(a.openCount) || 0
  const bOpen = Number(b.openCount) || 0
  if (bOpen !== aOpen) return bOpen - aOpen

  const aLastOpened = Number(a.lastOpenedAt) || 0
  const bLastOpened = Number(b.lastOpenedAt) || 0
  if (bLastOpened !== aLastOpened) return bLastOpened - aLastOpened

  return (Number(b.addedAt) || 0) - (Number(a.addedAt) || 0)
}

export default function useMeters() {
  const [storedMeters, setStoredMeters] = useState(load)
  const meters = useMemo(() => decorateMeters(storedMeters), [storedMeters])

  const addMeter = useCallback((number, name, provider = DEFAULT_PROVIDER) => {
    const meterNo = String(number)
    const meterProvider = provider || DEFAULT_PROVIDER
    const now = Date.now()

    setStoredMeters(prev => {
      const exists = prev.find(m => sameMeter(m, meterNo, meterProvider))
      if (exists) {
        const updated = prev.map((m) =>
          sameMeter(m, meterNo, meterProvider)
            ? {
              ...m,
              name: name || m.name,
              provider: meterProvider,
              openCount: (Number(m.openCount) || 0) + 1,
              lastOpenedAt: now,
            }
            : m
        )
        save(updated)
        return updated
      }
      const next = [...prev, {
        number: meterNo,
        name: name || '',
        nickname: '',
        provider: meterProvider,
        manualPrimary: false,
        openCount: 1,
        addedAt: now,
        lastOpenedAt: now,
      }]
      save(next)
      return next
    })
  }, [])

  const removeMeter = useCallback((number, provider) => {
    const meterNo = String(number)
    const meterProvider = provider || null
    setStoredMeters(prev => {
      const next = prev.filter((m) => (
        meterProvider
          ? !sameMeter(m, meterNo, meterProvider)
          : m.number !== meterNo
      ))
      save(next)
      return next
    })
  }, [])

  const setPrimary = useCallback((number, provider) => {
    const meterNo = String(number)
    const meterProvider = provider || null
    setStoredMeters(prev => {
      const next = prev.map((m) => ({
        ...m,
        manualPrimary: meterProvider
          ? sameMeter(m, meterNo, meterProvider)
            ? !m.manualPrimary
            : m.manualPrimary
          : m.number === meterNo
            ? !m.manualPrimary
            : m.manualPrimary,
      }))
      save(next)
      return next
    })
  }, [])

  const setNickname = useCallback((number, provider, nickname) => {
    const meterNo = String(number)
    const meterProvider = provider || DEFAULT_PROVIDER
    setStoredMeters(prev => {
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
    if (!meters.length) return null
    const ranked = [...meters].sort(rankMetersForPrimary)
    return ranked[0] || null
  }, [meters])

  return { meters, addMeter, removeMeter, setPrimary, setNickname, getPrimary }
}
