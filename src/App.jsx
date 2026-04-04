import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import MeterInput from './components/MeterInput'
import useMeters from './hooks/useMeters'

const Dashboard = lazy(() => import('./components/Dashboard'))

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meterNo, setMeterNo] = useState('')
  const [provider, setProvider] = useState('nesco')
  const { meters, addMeter, removeMeter, setPrimary, getPrimary } = useMeters()
  const requestRef = useRef(0)

  useEffect(() => {
    const primary = getPrimary()
    if (primary && !data && !loading) {
      fetchData(primary.number, primary.provider || 'nesco')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async (meter, prov = provider) => {
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
      addMeter(meter, json.customerInfo?.name || '', prov)
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
  }

  const activeProvider = data?.provider || provider

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-outline)] selection:text-[var(--color-ink)] font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 bg-[var(--color-base)]/80 backdrop-blur-md border-b border-[var(--color-outline)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-3 cursor-pointer group outline-none rounded-lg focus-visible:ring-2 ring-[var(--color-outline)]">
            <div className={`w-8 h-8 flex items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105 ${activeProvider === 'desco' ? 'bg-[var(--color-desco)]' : 'bg-[var(--color-nesco)]'}`}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="text-left leading-none">
              <h1 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
                {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink)]/50">Grid Watch</p>
            </div>
          </button>

          {meters.length > 0 && (
            <div className="flex items-center gap-3">
              {data && (
                <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-[var(--color-outline)] shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                  {meterNo}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {!data && !loading && (
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
        )}
        {loading && <LoadingSkeleton provider={provider} />}
        {data && (
          <Suspense fallback={<LoadingSkeleton provider={provider} />}>
            <div className="animate-reveal">
              <Dashboard
                data={data}
                meterNo={meterNo}
                onReset={goHome}
              />
            </div>
          </Suspense>
        )}
      </main>

      <footer className="mt-auto border-t border-[var(--color-outline)] py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-medium text-[var(--color-ink)]/40">
          <p>Data sourced directly from {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}. Not an official product.</p>
          <p className="mt-2">Designed for clarity and utility.</p>
        </div>
      </footer>
    </div>
  )
}

function LoadingSkeleton({ provider }) {
  return (
    <div className="space-y-8 animate-reveal max-w-4xl mx-auto">
      <div className="text-center py-24 flex flex-col items-center justify-center gap-6 bg-white border border-[var(--color-outline)] rounded-3xl shadow-sm">
        <div className={`w-10 h-10 border-[3px] border-[var(--color-outline)] rounded-full animate-spin ${provider === 'desco' ? 'border-t-[var(--color-desco)]' : 'border-t-[var(--color-nesco)]'}`} />
        <span className="font-medium text-sm text-[var(--color-ink)]/50 tracking-wide">Retrieving grid data...</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-[var(--color-outline)] rounded-2xl h-32 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  )
}

export default App
