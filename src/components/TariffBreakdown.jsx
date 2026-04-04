import { motion } from 'framer-motion'

const TARIFF_SLABS = [
  { min: 0, max: 75, rate: 4.19, label: '0-75 kWh' },
  { min: 76, max: 200, rate: 5.72, label: '76-200 kWh' },
  { min: 201, max: 300, rate: 6.00, label: '201-300 kWh' },
  { min: 301, max: 400, rate: 6.34, label: '301-400 kWh' },
  { min: 401, max: 600, rate: 9.94, label: '401-600 kWh' },
  { min: 601, max: Infinity, rate: 11.46, label: '600+ kWh' },
]

function computeSlabBreakdown(totalKwh) {
  const result = []
  let remaining = totalKwh

  for (const slab of TARIFF_SLABS) {
    if (remaining <= 0) break
    const slabRange = slab.max === Infinity ? remaining : slab.max - slab.min + 1
    const used = Math.min(remaining, slabRange)
    const cost = used * slab.rate
    result.push({
      label: slab.label,
      rate: slab.rate,
      kwh: used,
      cost,
    })
    remaining -= used
  }

  return result
}

const SLAB_COLORS = ['#10b981', '#22d3ee', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export default function TariffBreakdown({ monthlyUsage, t }) {
  const latest = monthlyUsage?.[0]
  if (!latest || !latest.usedKwh || latest.usedKwh <= 0) return null

  const breakdown = computeSlabBreakdown(latest.usedKwh)
  const totalCost = breakdown.reduce((s, b) => s + b.cost, 0)
  const totalKwh = breakdown.reduce((s, b) => s + b.kwh, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Tariff Breakdown')}</h3>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          {t('Slab-wise cost for')} {latest.usedKwh} kWh ({latest.month ? `${latest.month} ${latest.year || ''}`.trim() : t('Latest month')})
        </p>
      </div>

      {/* Stacked horizontal bar */}
      <div className="mb-6">
        <div className="h-8 rounded-full overflow-hidden flex" role="img" aria-label={t('Tariff slab distribution bar')}>
          {breakdown.map((slab, i) => {
            const pct = (slab.kwh / totalKwh) * 100
            if (pct < 1) return null
            return (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: SLAB_COLORS[i] }}
                title={`${slab.label}: ${slab.kwh} kWh`}
              >
                {pct > 10 ? `${slab.kwh}` : ''}
              </motion.div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {breakdown.map((slab, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--color-ink)]/70">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SLAB_COLORS[i] }} />
              {slab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Slab table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--color-ink-muted)] text-left">
              <th className="pb-2 font-medium">{t('Slab')}</th>
              <th className="pb-2 font-medium text-right">{t('Rate')}</th>
              <th className="pb-2 font-medium text-right">kWh</th>
              <th className="pb-2 font-medium text-right">{t('Cost')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {breakdown.map((slab, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SLAB_COLORS[i] }} />
                    <span className="text-[var(--color-ink)] font-medium">{slab.label}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right text-[var(--color-ink)]/60">&#2547;{slab.rate.toFixed(2)}</td>
                <td className="py-2.5 text-right text-[var(--color-ink)]">{slab.kwh.toFixed(1)}</td>
                <td className="py-2.5 text-right font-medium text-[var(--color-ink)]">&#2547;{slab.cost.toFixed(2)}</td>
              </motion.tr>
            ))}
            <tr className="border-t-2 border-[var(--color-outline)]">
              <td className="pt-3 font-semibold text-[var(--color-ink)]">{t('Total')}</td>
              <td className="pt-3 text-right text-[var(--color-ink)]/60">&#2547;{(totalCost / totalKwh).toFixed(2)} avg</td>
              <td className="pt-3 text-right font-semibold text-[var(--color-ink)]">{totalKwh.toFixed(1)}</td>
              <td className="pt-3 text-right font-semibold text-[var(--color-ink)]">&#2547;{totalCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
