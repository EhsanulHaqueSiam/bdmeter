import { useState, useEffect, useRef } from 'react'
import MeterInput from './components/MeterInput'
import Dashboard from './components/Dashboard'
import useMeters from './hooks/useMeters'

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
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-white">
      <header className="sticky top-0 z-50 bg-[var(--color-base)] brutal-border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-8 h-8 flex items-center justify-center brutal-border brutal-shadow-sm ${activeProvider === 'desco' ? 'bg-[var(--color-desco)]' : 'bg-[var(--color-nesco)]'}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="text-left leading-none">
              <h1 className="text-xl font-black uppercase tracking-tight">
                {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-70">Grid Watch</p>
            </div>
          </button>

          {meters.length > 0 && (
            <div className="flex items-center gap-4">
              {data && (
                <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-bold bg-[var(--color-surface)] px-2 py-1 brutal-border brutal-shadow-sm">
                  <span className="w-2 h-2 bg-[var(--color-success)] brutal-border" />
                  {meterNo}
                </div>
              )}
              {meters.length > 1 && (
                <div className="flex items-center gap-2">
                  {meters.map((m) => (
                    <button
                      key={`${m.provider || 'nesco'}:${m.number}`}
                      onClick={() => switchMeter(m.number, m.provider || 'nesco')}
                      className={`relative px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer brutal-border brutal-shadow-sm ${
                        m.number === meterNo && (m.provider || 'nesco') === activeProvider
                          ? 'bg-[var(--color-ink)] text-[var(--color-base)]'
                          : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none'
                      }`}
                      title={`${m.name || m.number} (${(m.provider || 'nesco').toUpperCase()})`}
                    >
                      {m.primary && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[var(--color-warning)] brutal-border" />
                      )}
                      <span className="hidden sm:inline">{m.name ? m.name.split(' ')[0] : m.number}</span>
                      <span className="sm:hidden">{m.number.slice(-4)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
          <Dashboard
            data={data}
            meterNo={meterNo}
            onReset={goHome}
          />
        )}
      </main>

      <footer className="border-t-2 border-[var(--color-ink)] py-8 mt-12 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-mono text-[10px] font-bold uppercase tracking-widest">
          <p>DATA SOURCED FROM {activeProvider === 'desco' ? 'DESCO' : 'NESCO'}. NOT AN OFFICIAL PRODUCT.</p>
          <p className="mt-2 opacity-50">SYSTEM DESIGNED FOR CLARITY AND SPEED.</p>
        </div>
      </footer>
    </div>
  )
}

function LoadingSkeleton({ provider }) {
  return (
    <div className="space-y-8 animate-pulse max-w-4xl mx-auto">
      <div className="text-center py-20 flex flex-col items-center justify-center gap-6 brutal-card p-12">
        <div className={`w-12 h-12 brutal-border border-4 border-t-transparent rounded-full animate-spin ${provider === 'desco' ? 'border-[var(--color-desco)]' : 'border-[var(--color-nesco)]'}`} />
        <span className="font-mono font-bold text-sm uppercase tracking-widest">CONNECTING TO GRID...</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--color-surface-dim)] brutal-border h-32" />
        ))}
      </div>
      <div className="bg-[var(--color-surface-dim)] brutal-border h-80" />
    </div>
  )
}

export default App
