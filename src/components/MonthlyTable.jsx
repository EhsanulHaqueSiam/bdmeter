import { motion } from 'framer-motion'

const MONTH_MAP = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
}

function formatMoney(value, { decimals = 0, zeroAsDash = false } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  if (zeroAsDash && n === 0) return '-'
  return `৳${n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function formatMonthLabel(row) {
  const month = MONTH_MAP[row.month] || row.month || '-'
  const yy = row.year ? String(row.year).slice(-2) : '--'
  return `${month} ${yy}`
}

export default function MonthlyTable({ monthlyUsage, provider, t }) {
  const isDesco = provider === 'desco'

  if (isDesco) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
      >
        <div className="px-6 py-6 border-b border-[var(--color-outline)]">
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Monthly Breakdown')}</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">DESCO monthly consumption summary</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[var(--color-surface-dim)]/50 text-[var(--color-ink-muted)] font-medium">
              <tr>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium">Month</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Max Demand</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Avg Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline)]">
              {monthlyUsage.map((m, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                  className="hover:bg-[var(--color-surface-dim)]/50 transition-colors"
                >
                  <td className="px-4 py-3 text-[var(--color-ink)] font-medium">{formatMonthLabel(m)}</td>
                  <td className="px-4 py-3 text-right text-[var(--color-ink)]/70">{formatMoney(m.usedElectricity)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-1 bg-[var(--color-surface-dim)] text-[var(--color-ink)] rounded-md text-xs font-medium">
                      {Number.isFinite(Number(m.usedKwh)) ? Number(m.usedKwh).toFixed(2) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-ink)]/60">
                    {Number(m.maxDemand) > 0 ? `${Number(m.maxDemand).toFixed(2)} kW` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-ink)]/60">
                    {Number(m.usedKwh) > 0
                      ? `৳${(Number(m.usedElectricity) / Number(m.usedKwh)).toFixed(2)}`
                      : '-'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
    >
      <div className="px-6 py-6 border-b border-[var(--color-outline)]">
        <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Monthly Breakdown')}</h3>
        <p className="text-sm text-[var(--color-ink)]/70 mt-1">{t('Cost and usage per month')}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-[var(--color-surface-dim)]/50 text-[var(--color-ink-muted)] font-medium">
            <tr>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium">Month</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Recharge</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Rebate</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Demand</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Rent</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">VAT</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">PFC</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Dues</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Total Ded</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {monthlyUsage.map((m, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                className="hover:bg-[var(--color-surface-dim)]/50 transition-colors"
              >
                <td className="px-3 py-3 text-[var(--color-ink)]">
                  <span className="font-medium">{MONTH_MAP[m.month] || m.month || '-'}</span>
                  <span className="text-[var(--color-ink-muted)] ml-1">{m.year ? String(m.year).slice(-2) : '--'}</span>
                </td>
                <td className="px-3 py-3 text-right font-medium text-[var(--color-ink)]">{formatMoney(m.totalRecharge, { zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink)]/60">{formatMoney(m.usedElectricity)}</td>
                <td className="px-3 py-3 text-right">
                  <span className="px-2 py-1 bg-[var(--color-surface-dim)] text-[var(--color-ink)] rounded-md text-xs font-medium">{m.usedKwh}</span>
                </td>
                <td className="px-3 py-3 text-right text-green-600">
                  {m.rebate < 0 ? `৳${Math.abs(m.rebate).toFixed(2)}` : '-'}
                </td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.demandCharge, { zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.meterRent, { zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.vat, { decimals: 2, zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{m.pfcCharge > 0 ? `৳${m.pfcCharge}` : '-'}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{m.paidDues > 0 ? `৳${m.paidDues}` : '-'}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink)]/70">{formatMoney(m.totalUsage, { zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${m.endBalance >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {formatMoney(m.endBalance, { decimals: 2 })}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
