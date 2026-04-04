import { useState } from 'react'

export default function MeterInput({ onSubmit, error, meters = [], onSwitchMeter, onRemoveMeter, onSetPrimary, provider, onProviderChange }) {
  const [meter, setMeter] = useState('')
  const maxLen = provider === 'desco' ? 12 : 11
  const validLengths = provider === 'desco' ? [8, 9, 11, 12] : [8, 11]
  const isValid = /^\d+$/.test(meter) && validLengths.includes(meter.length)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) onSubmit(meter, provider)
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 animate-reveal">
      <div className="w-full max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--color-ink)]">
            Check your grid
          </h2>
          <p className="text-base text-[var(--color-ink)]/60 font-medium">
            Direct access to your prepaid electric analytics.
          </p>
        </div>

        {/* Minimal Provider Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white/50 backdrop-blur-md p-1.5 rounded-full border border-[var(--color-outline)] shadow-sm">
            {[
              { key: 'nesco', label: 'NESCO', color: 'var(--color-nesco)' },
              { key: 'desco', label: 'DESCO', color: 'var(--color-desco)' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => onProviderChange(p.key)}
                className={`relative px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  provider === p.key
                    ? 'bg-white text-[var(--color-ink)] shadow-sm border border-[var(--color-outline)]'
                    : 'text-[var(--color-ink)]/50 hover:text-[var(--color-ink)] border border-transparent'
                }`}
              >
                {provider === p.key && (
                  <span 
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 1px ${p.color}`, opacity: 0.2 }}
                  />
                )}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
          <div className={`relative flex items-center bg-white rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-4 focus-within:ring-opacity-10 ${
            provider === 'desco' 
              ? 'border-[var(--color-outline)] focus-within:border-[var(--color-desco)] focus-within:ring-[var(--color-desco)]' 
              : 'border-[var(--color-outline)] focus-within:border-[var(--color-nesco)] focus-within:ring-[var(--color-nesco)]'
          }`}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={provider === 'desco' ? 'Account (8-9) or Meter (11-12)' : 'Account (8) or Meter (11)'}
              value={meter}
              onChange={(e) => setMeter(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
              className="w-full h-16 md:h-20 px-6 font-mono text-xl md:text-2xl font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-500 placeholder:font-sans placeholder:font-medium placeholder:text-base md:placeholder:text-lg"
              autoFocus={meters.length === 0}
            />
            <button
              type="submit"
              disabled={!isValid}
              className={`absolute right-3 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl transition-all duration-300 ${
                isValid 
                  ? (provider === 'desco' ? 'bg-[var(--color-desco)] text-white hover:opacity-90 hover:scale-105' : 'bg-[var(--color-nesco)] text-white hover:opacity-90 hover:scale-105')
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            
            {/* Validation Indicator */}
            {meter.length > 0 && (
              <div className="absolute -bottom-8 left-6 pointer-events-none flex items-center gap-2">
                <span className={`text-xs font-mono font-medium ${isValid ? 'text-[var(--color-success)]' : 'text-[var(--color-ink)]/50'}`}>
                  {meter.length} digits {isValid ? '✓ Valid' : '× Invalid length'}
                </span>
              </div>
            )}
          </div>
        </form>

        {error && (
          <div className="max-w-lg mx-auto mt-4 px-6 py-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium animate-reveal">
            {error}
          </div>
        )}

        {/* Saved Meters */}
        {meters.length > 0 && (
          <div className="pt-16 max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]/50">
                Recent Accounts
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meters.map((m) => (
                <div
                  key={`${m.provider || 'nesco'}:${m.number}`}
                  className="group relative bg-white border border-[var(--color-outline)] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[var(--color-ink)]/20 transition-all cursor-pointer"
                  onClick={() => onSwitchMeter(m.number, m.provider || 'nesco')}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      (m.provider || 'nesco') === 'desco' ? 'bg-orange-50 text-[var(--color-desco)]' : 'bg-blue-50 text-[var(--color-nesco)]'
                    }`}>
                      {m.provider || 'nesco'}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!m.primary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSetPrimary(m.number, m.provider || 'nesco') }}
                          className="text-[var(--color-ink)]/40 hover:text-[var(--color-warning)] transition-colors p-1"
                          title="Set as Default"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveMeter(m.number, m.provider || 'nesco') }}
                        className="text-[var(--color-ink)]/40 hover:text-[var(--color-danger)] transition-colors p-1"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-semibold text-[var(--color-ink)] flex items-center gap-2">
                      {m.number}
                      {m.primary && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
                      )}
                    </div>
                    {m.name && <div className="text-sm font-medium text-[var(--color-ink)]/60 mt-1 truncate">{m.name}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
