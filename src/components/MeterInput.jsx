import { useState } from 'react'

export default function MeterInput({ onSubmit, error, meters = [], onSwitchMeter, onRemoveMeter, onSetPrimary, provider, onProviderChange }) {
  const [meter, setMeter] = useState('')
  // NESCO: 8 (account) or 11 (meter). DESCO: 8-9 (account) or 11-12 (meter)
  const maxLen = provider === 'desco' ? 12 : 11
  const validLengths = provider === 'desco' ? [8, 9, 11, 12] : [8, 11]
  const isValid = /^\d+$/.test(meter) && validLengths.includes(meter.length)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) onSubmit(meter, provider)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-12">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            CHECK <br/>
            <span className={provider === 'desco' ? 'text-[var(--color-desco)]' : 'text-[var(--color-nesco)]'}>YOUR GRID</span>
          </h2>
          <p className="font-mono text-sm md:text-base font-bold uppercase tracking-widest max-w-sm">
            Direct access to your prepaid electric meter analytics.
          </p>
        </div>

        {/* Provider toggle */}
        <div className="flex bg-[var(--color-ink)] p-1.5 brutal-shadow mb-8">
          {[
            { key: 'nesco', label: 'NESCO', sub: 'NORTHERN' },
            { key: 'desco', label: 'DESCO', sub: 'DHAKA' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => onProviderChange(p.key)}
              className={`flex-1 py-3 px-4 text-center transition-all cursor-pointer border-2 ${
                provider === p.key
                  ? 'bg-[var(--color-base)] border-[var(--color-ink)] text-[var(--color-ink)]'
                  : 'bg-transparent border-transparent text-[var(--color-surface-dim)] hover:text-white'
              }`}
            >
              <div className="text-lg font-black tracking-tight">{p.label}</div>
              <div className="font-mono text-[10px] font-bold tracking-widest">{p.sub}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-[var(--color-ink)] opacity-0 group-focus-within:opacity-10 transition-opacity" />
            <div className="relative flex">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={provider === 'desco' ? 'ACCOUNT (8-9) OR METER (11-12)' : 'ACCOUNT (8) OR METER (11)'}
                value={meter}
                onChange={(e) => setMeter(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
                className={`w-full h-16 md:h-20 px-6 font-mono text-xl md:text-2xl font-bold bg-[var(--color-surface)] brutal-border outline-none transition-all placeholder:text-gray-400 placeholder:font-sans placeholder:text-sm placeholder:font-bold focus:shadow-[6px_6px_0_0_var(--color-ink)] ${provider === 'desco' ? 'focus:border-[var(--color-desco)]' : 'focus:border-[var(--color-nesco)]'}`}
                autoFocus={meters.length === 0}
              />
              <button
                type="submit"
                disabled={!isValid}
                className={`ml-2 w-20 md:w-32 h-16 md:h-20 flex items-center justify-center brutal-btn cursor-pointer ${
                  provider === 'desco'
                    ? 'bg-[var(--color-desco)] text-white'
                    : 'bg-[var(--color-nesco)] text-white'
                }`}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
            
            <div className="absolute right-24 md:right-36 top-1/2 -translate-y-1/2 pointer-events-none">
              {meter.length > 0 && (
                <span className={`font-mono text-[10px] font-bold px-2 py-1 brutal-border ${isValid ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-surface-dim)]'}`}>
                  LEN: {meter.length} {isValid ? '✓' : '×'}
                </span>
              )}
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 px-5 py-4 bg-[var(--color-danger)] text-white font-mono text-sm font-bold brutal-border brutal-shadow-sm uppercase">
            ERROR: {error}
          </div>
        )}

        {/* Saved meters */}
        {meters.length > 0 && (
          <div className="mt-12">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-[var(--color-ink)] pb-2 mb-4">
              SAVED IDENTIFIERS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meters.map((m) => (
                <div
                  key={`${m.provider || 'nesco'}:${m.number}`}
                  className="group flex flex-col justify-between bg-[var(--color-surface)] brutal-border p-4 brutal-shadow-sm hover:brutal-shadow cursor-pointer transition-all hover:-translate-y-1"
                  onClick={() => onSwitchMeter(m.number, m.provider || 'nesco')}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2 py-0.5 brutal-border font-mono text-[10px] font-bold text-white ${
                      (m.provider || 'nesco') === 'desco' ? 'bg-[var(--color-desco)]' : 'bg-[var(--color-nesco)]'
                    }`}>
                      {(m.provider || 'nesco').toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!m.primary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSetPrimary(m.number, m.provider || 'nesco') }}
                          className="font-mono text-[10px] font-bold hover:underline"
                          title="Set Primary"
                        >
                          [STAR]
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveMeter(m.number, m.provider || 'nesco') }}
                        className="font-mono text-[10px] font-bold text-[var(--color-danger)] hover:underline"
                        title="Remove"
                      >
                        [DEL]
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold flex items-center gap-2">
                      {m.number}
                      {m.primary && (
                        <span className="w-2.5 h-2.5 bg-[var(--color-warning)] brutal-border rounded-none" />
                      )}
                    </div>
                    {m.name && <div className="text-sm font-bold uppercase mt-1 opacity-70 truncate">{m.name}</div>}
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
