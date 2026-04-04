import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic } from '../utils/haptic'

export default function MeterComparison({ meters, t }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  // Only show when there are 2+ saved meters
  if (!meters || meters.length < 2) return null

  const handleCompare = async () => {
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      const fetches = meters.map(async (m) => {
        const prov = m.provider || 'nesco'
        const apiUrl = prov === 'desco'
          ? `/api/desco?account=${m.number}&meter=${m.number}`
          : `/api/nesco?meter=${m.number}`
        try {
          const res = await fetch(apiUrl)
          const json = await res.json()
          if (!res.ok) return { meter: m, error: true }

          const balance = json.customerInfo?.balance
            ? parseFloat(json.customerInfo.balance.replace(/[^\d.-]/g, ''))
            : json.monthlyUsage?.[0]?.endBalance || 0

          const latestMonth = json.monthlyUsage?.[0]
          const kwh = latestMonth?.usedKwh || 0
          const cost = latestMonth?.usedElectricity || 0
          const rate = kwh > 0 ? cost / kwh : 0

          return {
            meter: m,
            balance,
            kwh,
            cost,
            rate,
            name: json.customerInfo?.name || '',
            error: false,
          }
        } catch {
          return { meter: m, error: true }
        }
      })

      const all = await Promise.all(fetches)
      setResults(all)
    } catch {
      setError(t('Failed to fetch comparison data'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { haptic(); handleCompare() }}
        className="px-4 py-2 rounded-xl font-medium text-sm border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
        aria-label={t('Compare Meters')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        {t('Compare Meters')}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Compare Meters')}</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer"
                  aria-label={t('Close')}
                >
                  <svg className="w-4 h-4 text-[var(--color-ink)]/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12" role="status" aria-label={t('Loading')}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-[3px] border-[var(--color-outline)] rounded-full border-t-[var(--color-nesco)]"
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl p-4" role="alert" aria-live="polite">{error}</div>
              )}

              {!loading && results.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[var(--color-ink-muted)] text-left border-b border-[var(--color-outline)]">
                          <th className="pb-3 font-medium">{t('Meter')}</th>
                          <th className="pb-3 font-medium text-right">{t('Balance')}</th>
                          <th className="pb-3 font-medium text-right">kWh</th>
                          <th className="pb-3 font-medium text-right">{t('Cost')}</th>
                          <th className="pb-3 font-medium text-right">{t('Rate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-outline)]">
                        {results.map((r, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                          >
                            <td className="py-3">
                              <div className="font-mono font-medium text-[var(--color-ink)]">{r.meter.number}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  (r.meter.provider || 'nesco') === 'desco' ? 'bg-orange-50 text-[var(--color-desco)]' : 'bg-blue-50 text-[var(--color-nesco)]'
                                }`}>
                                  {r.meter.provider || 'nesco'}
                                </span>
                                {r.name && <span className="text-xs text-[var(--color-ink-muted)] truncate max-w-[120px]">{r.name}</span>}
                              </div>
                            </td>
                            {r.error ? (
                              <td colSpan={4} className="py-3 text-center text-[var(--color-ink-muted)] text-xs">{t('Failed')}</td>
                            ) : (
                              <>
                                <td className="py-3 text-right font-medium text-[var(--color-ink)]">&#2547;{r.balance.toFixed(2)}</td>
                                <td className="py-3 text-right text-[var(--color-ink)]">{r.kwh.toFixed(1)}</td>
                                <td className="py-3 text-right text-[var(--color-ink)]">&#2547;{r.cost.toFixed(0)}</td>
                                <td className="py-3 text-right text-[var(--color-ink)]/60">&#2547;{r.rate.toFixed(2)}</td>
                              </>
                            )}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Simple bar comparison */}
                  {results.filter(r => !r.error).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[var(--color-outline)]">
                      <h4 className="text-sm font-medium text-[var(--color-ink)]/70 mb-4">{t('Monthly kWh Comparison')}</h4>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                        className="space-y-3"
                      >
                        {(() => {
                          const valid = results.filter(r => !r.error)
                          const maxKwh = Math.max(...valid.map(r => r.kwh), 1)
                          return valid.map((r, i) => (
                            <motion.div
                              key={i}
                              variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                              transition={{ duration: 0.4 }}
                              className="flex items-center gap-3"
                            >
                              <span className="font-mono text-xs text-[var(--color-ink)]/60 w-24 truncate">{r.meter.number}</span>
                              <div className="flex-1 h-6 bg-[var(--color-surface-dim)] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(r.kwh / maxKwh) * 100}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.1 }}
                                  className={`h-full rounded-full flex items-center justify-end pr-2 text-white text-[10px] font-bold ${
                                    (r.meter.provider || 'nesco') === 'desco' ? 'bg-[var(--color-desco)]' : 'bg-[var(--color-nesco)]'
                                  }`}
                                >
                                  {r.kwh > 0 ? `${r.kwh.toFixed(0)}` : ''}
                                </motion.div>
                              </div>
                            </motion.div>
                          ))
                        })()}
                      </motion.div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
