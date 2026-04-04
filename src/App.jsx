import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MeterInput from './components/MeterInput'
import useMeters from './hooks/useMeters'

const Dashboard = lazy(() => import('./components/Dashboard'))

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meterNo, setMeterNo] = useState('')
  const [provider, setProvider] = useState('nesco')
  const { meters, addMeter, removeMeter, setPrimary, getPrimary } = useMeters()
  const requestRef = useRef(0)

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
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname)
  }

  const activeProvider = data?.provider || provider

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-outline)] selection:text-[var(--color-ink)] font-sans antialiased flex flex-col">
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
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink)]/50">Grid Watch</p>
            </div>
          </button>

          {meters.length > 0 && (
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {data && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden sm:flex items-center gap-2 font-mono text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-[var(--color-outline)] shadow-sm"
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
          )}
        </div>
      </motion.header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
              />
            </motion.div>
          )}
          {loading && (
            <motion.div key="loading" {...pageTransition}>
              <LoadingSkeleton provider={provider} />
            </motion.div>
          )}
          {data && (
            <motion.div key="dashboard" {...pageTransition}>
              <Suspense fallback={<LoadingSkeleton provider={provider} />}>
                <Dashboard
                  data={data}
                  meterNo={meterNo}
                  onReset={goHome}
                  isSaved={meters.some(m => m.number === meterNo && (m.provider || 'nesco') === (data?.provider || provider))}
                  onSave={() => addMeter(meterNo, data?.customerInfo?.name || '', data?.provider || provider)}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-auto border-t border-[var(--color-outline)] py-12 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-medium text-[var(--color-ink)]/40">
          <p>Data sourced directly from {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}. Not an official product.</p>
          <p className="mt-2">Designed for clarity and utility.</p>
        </div>
      </motion.footer>
    </div>
  )
}

function LoadingSkeleton({ provider }) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-24 flex flex-col items-center justify-center gap-6 bg-white border border-[var(--color-outline)] rounded-3xl shadow-sm"
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
          Retrieving grid data...
        </motion.span>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white border border-[var(--color-outline)] rounded-2xl h-32 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

export default App
