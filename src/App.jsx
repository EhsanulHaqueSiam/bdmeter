import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MeterInput from './components/MeterInput'
import PullToRefresh from './components/PullToRefresh'
import useMeters from './hooks/useMeters'
import useLanguage from './hooks/useLanguage'

const Dashboard = lazy(() => import('./components/Dashboard'))

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}

// --- Dark mode helpers ---
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

function applyThemeClass(pref) {
  const isDark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meterNo, setMeterNo] = useState('')
  const [provider, setProvider] = useState('nesco')
  const { meters, addMeter, removeMeter, setPrimary, getPrimary } = useMeters()
  const { lang, setLang, t } = useLanguage()
  const requestRef = useRef(0)

  // Dark mode state
  const [theme, setThemeState] = useState(getInitialTheme)

  // Online/offline
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Auto-refresh "last updated" timestamp
  const [lastUpdated, setLastUpdated] = useState(null)
  const autoRefreshRef = useRef(null)

  // Apply theme on mount and when changed
  useEffect(() => {
    applyThemeClass(theme)
    try { localStorage.setItem('theme', theme) } catch {}
    // Listen for system preference changes when in system mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyThemeClass('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const cycleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    // Check URL params first (shared link)
    const params = new URLSearchParams(window.location.search)
    const urlMeter = params.get('meter')
    const urlProvider = params.get('provider')
    if (urlMeter && /^\d{8,12}$/.test(urlMeter)) {
      fetchData(urlMeter, urlProvider === 'desco' ? 'desco' : 'nesco', { save: false })
      return
    }
    // Otherwise load primary meter
    const primary = getPrimary()
    if (primary && !data && !loading) {
      fetchData(primary.number, primary.provider || 'nesco')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async (meter, prov = provider, { save = true } = {}) => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    setMeterNo(meter)
    setProvider(prov)
    try {
      const apiUrl = prov === 'desco'
        ? `/api/desco?account=${meter}&meter=${meter}`
        : `/api/nesco?meter=${meter}`
      const res = await fetch(apiUrl)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch data')
      if (!json.rechargeHistory?.length && !json.monthlyUsage?.length) {
        throw new Error('No data found. Please check your number and try again.')
      }
      if (requestId !== requestRef.current) return
      setData({ ...json, provider: prov })
      setLastUpdated(new Date())
      if (save) addMeter(meter, json.customerInfo?.name || '', prov)
      // Update URL with meter info for sharing
      const url = new URL(window.location)
      url.searchParams.set('meter', meter)
      url.searchParams.set('provider', prov)
      window.history.replaceState({}, '', url)
    } catch (err) {
      if (requestId !== requestRef.current) return
      setError(err.message)
      setData(null)
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
      }
    }
  }

  const switchMeter = (meter, prov) => {
    setData(null)
    setError(null)
    fetchData(meter, prov)
  }

  const goHome = () => {
    setData(null)
    setError(null)
    setMeterNo('')
    setLastUpdated(null)
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname)
  }

  // Keyboard shortcuts: Escape to go home
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && data) {
        goHome()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 5 minutes when dashboard is open
  useEffect(() => {
    if (data && meterNo) {
      autoRefreshRef.current = setInterval(() => {
        fetchData(meterNo, data.provider || provider, { save: false })
      }, 5 * 60 * 1000)
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [data, meterNo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pull-to-refresh handler
  const handlePullRefresh = useCallback(() => {
    if (data && meterNo) {
      return fetchData(meterNo, data.provider || provider, { save: false })
    }
  }, [data, meterNo, provider]) // eslint-disable-line react-hooks/exhaustive-deps

  // Format "Updated X min ago"
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!lastUpdated) return
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  const getUpdatedAgo = () => {
    if (!lastUpdated) return null
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins === 1) return '1 min ago'
    return `${mins} min ago`
  }

  const activeProvider = data?.provider || provider

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-outline)] selection:text-[var(--color-ink)] font-sans antialiased flex flex-col">
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-amber-500 text-white text-center text-xs font-medium py-1.5 px-4 overflow-hidden"
          >
            {t("You're offline — showing cached data")}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 bg-[var(--color-base)]/80 backdrop-blur-md border-b border-[var(--color-outline)]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-3 cursor-pointer group outline-none rounded-lg focus-visible:ring-2 ring-[var(--color-outline)]">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`w-8 h-8 flex items-center justify-center rounded-xl shadow-sm ${activeProvider === 'desco' ? 'bg-[var(--color-desco)]' : 'bg-[var(--color-nesco)]'}`}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </motion.div>
            <div className="text-left leading-none">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={activeProvider}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-bold tracking-tight text-[var(--color-ink)]"
                >
                  {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}
                </motion.h1>
              </AnimatePresence>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink)]/50">{t('Grid Watch')}</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Updated ago text */}
            {data && lastUpdated && (
              <span className="hidden sm:inline text-[10px] font-medium text-[var(--color-ink)]/40 mr-1">
                {getUpdatedAgo()}
              </span>
            )}

            {/* Language toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)] text-xs font-bold cursor-pointer hover:bg-[var(--color-surface-dim)] transition-colors"
              title={lang === 'en' ? 'Switch to Bengali' : 'Switch to English'}
            >
              {lang === 'en' ? 'বা' : 'EN'}
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={cycleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)] cursor-pointer hover:bg-[var(--color-surface-dim)] transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                </svg>
              )}
            </motion.button>

            {/* Meter badge */}
            <AnimatePresence>
              {data && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden sm:flex items-center gap-2 font-mono text-xs font-medium bg-[var(--color-surface)] px-3 py-1.5 rounded-full border border-[var(--color-outline)] shadow-sm"
                >
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"
                  />
                  {meterNo}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <PullToRefresh onRefresh={handlePullRefresh}>
          <AnimatePresence mode="wait">
            {!data && !loading && (
              <motion.div key="input" {...pageTransition}>
                <MeterInput
                  onSubmit={fetchData}
                  error={error}
                  meters={meters}
                  onSwitchMeter={switchMeter}
                  onRemoveMeter={removeMeter}
                  onSetPrimary={setPrimary}
                  provider={provider}
                  onProviderChange={setProvider}
                  t={t}
                />
              </motion.div>
            )}
            {loading && (
              <motion.div key="loading" {...pageTransition}>
                <LoadingSkeleton provider={provider} t={t} />
              </motion.div>
            )}
            {data && (
              <motion.div key="dashboard" {...pageTransition}>
                <Suspense fallback={<LoadingSkeleton provider={provider} t={t} />}>
                  <Dashboard
                    data={data}
                    meterNo={meterNo}
                    onReset={goHome}
                    isSaved={meters.some(m => m.number === meterNo && (m.provider || 'nesco') === (data?.provider || provider))}
                    onSave={() => addMeter(meterNo, data?.customerInfo?.name || '', data?.provider || provider)}
                    t={t}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </PullToRefresh>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-auto border-t border-[var(--color-outline)] py-12 bg-[var(--color-surface)]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-medium text-[var(--color-ink)]/40">
          <p>Data sourced directly from {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}. Not an official product.</p>
          <p className="mt-2">Designed for clarity and utility.</p>
          {data && lastUpdated && (
            <p className="mt-2 text-[var(--color-ink)]/30">Updated {getUpdatedAgo()}</p>
          )}
        </div>
      </motion.footer>
    </div>
  )
}

function LoadingSkeleton({ provider, t }) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-24 flex flex-col items-center justify-center gap-6 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-3xl shadow-sm"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`w-10 h-10 border-[3px] border-[var(--color-outline)] rounded-full ${provider === 'desco' ? 'border-t-[var(--color-desco)]' : 'border-t-[var(--color-nesco)]'}`}
        />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-medium text-sm text-[var(--color-ink)]/50 tracking-wide"
        >
          {t('Retrieving grid data...')}
        </motion.span>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-2xl h-32 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

export default App
