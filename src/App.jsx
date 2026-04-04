import { useState } from 'react'
import MeterInput from './components/MeterInput'
import Dashboard from './components/Dashboard'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meterNo, setMeterNo] = useState('')

  const fetchData = async (meter) => {
    setLoading(true)
    setError(null)
    setMeterNo(meter)
    try {
      const res = await fetch(`/api/nesco?meter=${meter}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch data')
      if (!json.rechargeHistory?.length && !json.monthlyUsage?.length) {
        throw new Error('No data found for this meter number. Please check and try again.')
      }
      setData(json)
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">NESCO Meter</h1>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">Prepaid Dashboard</p>
            </div>
          </div>
          {data && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Meter {meterNo}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data && !loading && (
          <MeterInput onSubmit={fetchData} error={error} />
        )}
        {loading && <LoadingSkeleton />}
        {data && (
          <Dashboard
            data={data}
            meterNo={meterNo}
            onReset={() => { setData(null); setError(null); setMeterNo('') }}
          />
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-400">
        Data sourced from NESCO Customer Portal. Not an official NESCO product.
      </footer>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg shadow-slate-200/50">
          <div className="w-6 h-6 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-slate-600 font-medium">Fetching meter data from NESCO...</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 h-32 shadow-sm" />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 h-80 shadow-sm" />
    </div>
  )
}

export default App
