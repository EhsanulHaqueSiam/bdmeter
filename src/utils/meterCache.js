const CACHE_STORAGE_KEY = 'bdm_meter_cache_v1'
const HOT_METERS_COOKIE_KEY = 'bdm_hot_meters'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const HOT_OPEN_THRESHOLD = 3
const MAX_HOT_METERS = 8
const MAX_CACHE_ENTRIES = 4

function hasBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function normalizeProvider(provider) {
  return provider === 'desco' ? 'desco' : 'nesco'
}

function normalizeMeterNumber(number) {
  return String(number || '').replace(/\D/g, '')
}

function readCookieValue(key) {
  if (!hasBrowser()) return ''
  const all = document.cookie ? document.cookie.split('; ') : []
  for (const item of all) {
    const [name, ...rest] = item.split('=')
    if (name === key) return decodeURIComponent(rest.join('='))
  }
  return ''
}

function writeCookieValue(key, value, maxAgeSec) {
  if (!hasBrowser()) return
  document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`
}

function readStore() {
  if (!hasBrowser()) return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_STORAGE_KEY) || '{}')
    if (parsed && typeof parsed === 'object') return parsed
  } catch {}
  return {}
}

function writeStore(store) {
  if (!hasBrowser()) return
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store))
  } catch {}
}

function pruneStore(store, hotSet) {
  const now = Date.now()
  const next = { ...store }

  Object.entries(next).forEach(([key, entry]) => {
    const expired = !entry?.expiresAt || Number(entry.expiresAt) <= now
    const cold = hotSet && !hotSet.has(key)
    if (expired || cold) {
      delete next[key]
    }
  })

  const ranked = Object.entries(next).sort(([, a], [, b]) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
  ranked.slice(MAX_CACHE_ENTRIES).forEach(([key]) => {
    delete next[key]
  })

  return next
}

export function meterCacheKey(number, provider = 'nesco') {
  return `${normalizeProvider(provider)}:${normalizeMeterNumber(number)}`
}

export function readHotMeterKeysFromCookie() {
  const value = readCookieValue(HOT_METERS_COOKIE_KEY)
  if (!value) return []
  return value
    .split('|')
    .map((k) => k.trim())
    .filter(Boolean)
}

export function deriveHotMeterKeys(meters = []) {
  const ranked = [...meters]
    .filter((m) => m && m.number)
    .filter((m) => Boolean(m.manualPrimary) || Boolean(m.autoPrimary) || (Number(m.openCount) || 0) >= HOT_OPEN_THRESHOLD)
    .sort((a, b) => {
      const aScore = (a.manualPrimary ? 3 : 0) + (a.autoPrimary ? 2 : 0)
      const bScore = (b.manualPrimary ? 3 : 0) + (b.autoPrimary ? 2 : 0)
      if (bScore !== aScore) return bScore - aScore
      const aOpen = Number(a.openCount) || 0
      const bOpen = Number(b.openCount) || 0
      if (bOpen !== aOpen) return bOpen - aOpen
      return (Number(b.lastOpenedAt) || 0) - (Number(a.lastOpenedAt) || 0)
    })
    .slice(0, MAX_HOT_METERS)
    .map((m) => meterCacheKey(m.number, m.provider))

  return [...new Set(ranked)]
}

export function syncHotMetersCookie(meters = []) {
  if (!hasBrowser()) return

  const hotKeys = deriveHotMeterKeys(meters)
  writeCookieValue(HOT_METERS_COOKIE_KEY, hotKeys.join('|'), Math.floor(ONE_DAY_MS / 1000))

  const hotSet = new Set(hotKeys)
  const store = readStore()
  writeStore(pruneStore(store, hotSet))
}

export function getCachedMeterData(number, provider) {
  if (!hasBrowser()) return null

  const key = meterCacheKey(number, provider)
  const hotSet = new Set(readHotMeterKeysFromCookie())
  if (!hotSet.has(key)) return null

  const store = pruneStore(readStore(), hotSet)
  writeStore(store)
  const entry = store[key]
  if (!entry?.data) return null

  return {
    key,
    provider: normalizeProvider(provider),
    updatedAt: Number(entry.updatedAt) || 0,
    data: entry.data,
  }
}

export function getCachedAutoMeterData(number) {
  const candidates = ['nesco', 'desco']
    .map((provider) => getCachedMeterData(number, provider))
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return candidates[0] || null
}

export function setCachedMeterData(number, provider, data) {
  if (!hasBrowser() || !data) return false

  const key = meterCacheKey(number, provider)
  const hotSet = new Set(readHotMeterKeysFromCookie())
  if (!hotSet.has(key)) return false

  const now = Date.now()
  const store = pruneStore(readStore(), hotSet)
  store[key] = {
    updatedAt: now,
    expiresAt: now + ONE_DAY_MS,
    data,
  }

  writeStore(pruneStore(store, hotSet))
  return true
}

export function clearCachedMeterData(number, provider) {
  if (!hasBrowser()) return
  const key = meterCacheKey(number, provider)
  const store = readStore()
  if (store[key]) {
    delete store[key]
    writeStore(store)
  }
}

export function clearAllCachedMeterData() {
  if (!hasBrowser()) return
  try {
    localStorage.removeItem(CACHE_STORAGE_KEY)
  } catch {}
}
