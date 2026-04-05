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

function formatDecimal(value, decimals = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return n.toFixed(decimals)
}

function formatMonthLabel(row) {
  const month = MONTH_MAP[row.month] || row.month || '-'
  const yy = row.year ? String(row.year).slice(-2) : '--'
  return `${month} ${yy}`
}

export default function MonthlyTable({ monthlyUsage, provider, t, descoInsights }) {
  const isDesco = provider === 'desco'

  if (isDesco) {
    const summary = descoInsights?.summary || {}
    const monthlyComparisonByKey = new Map(
      (descoInsights?.monthlyComparison || []).map((row) => [row.monthKey, row]),
    )
    const summaryItems = [
      { label: 'Last Recharge', value: summary.lastRechargeAmount ? formatMoney(summary.lastRechargeAmount, { decimals: 2 }) : 'N/A', sub: summary.lastRechargeTime || '-' },
      { label: 'Remaining Balance', value: formatMoney(summary.remainingBalance || 0, { decimals: 2 }), sub: summary.readingTime || '-' },
      { label: 'Used This Month', value: `${formatDecimal(summary.usedThisMonthBdt || 0, 2)} BDT`, sub: summary.usedThisMonthKwh != null ? `${formatDecimal(summary.usedThisMonthKwh, 2)} kWh` : 'kWh unavailable' },
      { label: 'Recharged This Month', value: summary.rechargedThisMonth != null ? formatMoney(summary.rechargedThisMonth, { decimals: 2 }) : 'N/A', sub: `Year: ${formatMoney(summary.rechargedThisYear || 0, { decimals: 2 })}` },
      { label: 'Max Load (Last Month)', value: summary.maxLoadLastMonth ? `${formatDecimal(summary.maxLoadLastMonth, 2)} kW` : 'N/A', sub: `Year max: ${formatDecimal(summary.maxLoadLastYear || 0, 2)} kW` },
    ]

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
      >
        <div className="px-6 py-6 border-b border-[var(--color-outline)]">
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Monthly Breakdown')}</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">DESCO monthly, recharge, and previous-year comparison</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaryItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-dim)]/40 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)]">{item.label}</div>
                <div className="text-sm font-semibold text-[var(--color-ink)] mt-0.5">{item.value}</div>
                <div className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[var(--color-surface-dim)]/50 text-[var(--color-ink-muted)] font-medium">
              <tr>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium">Month</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Recharge</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Consumption (BDT)</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Prev Year (BDT)</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Prev Year (kWh)</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Net</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Max Demand</th>
                <th className="px-4 py-3 border-b border-[var(--color-outline)] font-medium text-right">Balance</th>
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
                  {(() => {
                    const cmp = monthlyComparisonByKey.get(m.monthKey) || {}
                    const prevBdt = Number(cmp.previousBdt)
                    const prevKwh = Number(cmp.previousKwh)
                    const net = (Number(m.totalRecharge) || 0) - (Number(m.usedElectricity) || 0)
                    return (
                      <>
                        <td className="px-4 py-3 text-[var(--color-ink)] font-medium">{formatMonthLabel(m)}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink)]/70">{formatMoney(m.totalRecharge, { decimals: 2 })}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink)]/70">{formatMoney(m.usedElectricity, { decimals: 2 })}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink)]/60">{Number.isFinite(prevBdt) && prevBdt > 0 ? formatMoney(prevBdt, { decimals: 2 }) : '-'}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink)]">{formatDecimal(m.usedKwh, 2)}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink)]/60">{Number.isFinite(prevKwh) && prevKwh > 0 ? formatDecimal(prevKwh, 2) : '-'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatMoney(net, { decimals: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink)]/60">
                          {Number(m.maxDemand) > 0 ? `${Number(m.maxDemand).toFixed(2)} kW` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${m.endBalance >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {formatMoney(m.endBalance, { decimals: 2 })}
                          </span>
                        </td>
                      </>
                    )
                  })()}
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
                  <span className="px-2 py-1 bg-[var(--color-surface-dim)] text-[var(--color-ink)] rounded-md text-xs font-medium">
                    {formatDecimal(m.usedKwh, 2)}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-green-600">
                  {m.rebate < 0 ? `৳${Math.abs(m.rebate).toFixed(2)}` : '-'}
                </td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.demandCharge, { zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.meterRent, { zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.vat, { decimals: 2, zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.pfcCharge, { decimals: 2, zeroAsDash: true })}</td>
                <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">{formatMoney(m.paidDues, { decimals: 2, zeroAsDash: true })}</td>
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
