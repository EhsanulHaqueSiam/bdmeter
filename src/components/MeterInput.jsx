import { useState } from 'react'

export default function MeterInput({ onSubmit, error }) {
  const [meter, setMeter] = useState('')
  const isValid = /^\d{8,11}$/.test(meter)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) onSubmit(meter)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-500/30 mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">NESCO Meter Dashboard</h2>
          <p className="text-slate-500 mt-2 text-base">Enter your prepaid meter number to view recharge history, usage analytics, and more</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 8-11 digit meter number"
              value={meter}
              onChange={(e) => setMeter(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="w-full h-14 px-5 pr-14 text-lg font-medium text-slate-900 bg-white border-2 border-slate-200 rounded-2xl outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:border-slate-300"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {meter.length > 0 && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {meter.length}/8-11
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full h-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-semibold text-base rounded-2xl transition-all duration-200 shadow-lg shadow-primary-500/25 disabled:shadow-none hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            View Dashboard
          </button>
        </form>

        {error && (
          <div className="mt-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Data from NESCO
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Real-time
          </span>
        </div>
      </div>
    </div>
  )
}
