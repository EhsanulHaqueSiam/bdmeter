import { motion } from 'framer-motion'
import AnimatedNumber from './AnimatedNumber'
import Sparkline from './Sparkline'

function computeForecast(data) {
  const { customerInfo, monthlyUsage, dailyConsumption, rechargeHistory } = data

  const balance = customerInfo?.balance
    ? parseFloat(customerInfo.balance.replace(/[^\d.-]/g, ''))
    : monthlyUsage?.[0]?.endBalance || 0

  if (balance <= 0) return null

  let dailyTaka = 0
  let dailyKwh = 0
  let dataSource = ''
  let dataPoints = 0

  // Try daily consumption (DESCO) — values are cumulative, compute diffs
  if (dailyConsumption?.length >= 2) {
    const sorted = [...dailyConsumption].sort((a, b) => a.date.localeCompare(b.date))
    // Take last 8 entries to get 7 days of diffs
    const recent = sorted.slice(-8)
    if (recent.length >= 2) {
      const first = recent[0]
      const last = recent[recent.length - 1]
      const days = recent.length - 1
      const takaDiff = last.consumedTaka - first.consumedTaka
      const kwhDiff = last.consumedUnit - first.consumedUnit

      if (takaDiff > 0 && days > 0) {
        dailyTaka = takaDiff / days
        dailyKwh = kwhDiff / days
        dataSource = `Last ${days}d avg`
        dataPoints = days
      }
    }
  }

  // Fallback: estimate from latest month
  if (dailyTaka <= 0 && monthlyUsage?.length > 0) {
    const latest = monthlyUsage[0]
    if (latest.usedElectricity > 0) {
      // Estimate days in the month from the data
      const daysInMonth = 30
      dailyTaka = latest.usedElectricity / daysInMonth
      dailyKwh = latest.usedKwh / daysInMonth
      dataSource = 'Monthly avg'
      dataPoints = daysInMonth
    }
  }

  // Second fallback: estimate from recharge frequency
  if (dailyTaka <= 0 && rechargeHistory?.length >= 2) {
    const dates = rechargeHistory
      .map(r => new Date(r.date.replace(/(\d{2})-([A-Z]{3})-(\d{4})/, '$3-$2-$1')))
      .filter(d => !isNaN(d))
    if (dates.length >= 2) {
      const newest = dates[0]
      const oldest = dates[Math.min(dates.length - 1, 9)]
      const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24)
      const totalSpent = rechargeHistory.slice(0, Math.min(rechargeHistory.length, 10)).reduce((s, r) => s + r.rechargeAmount, 0)
      if (daySpan > 0) {
        dailyTaka = totalSpent / daySpan
        dataSource = 'Recharge pattern'
        dataPoints = Math.min(rechargeHistory.length, 10)
      }
    }
  }

  if (dailyTaka <= 0) return null

  const daysLeft = Math.floor(balance / dailyTaka)
  const depletionDate = new Date()
  depletionDate.setDate(depletionDate.getDate() + daysLeft)

  const effectiveRate = dailyKwh > 0 ? dailyTaka / dailyKwh : 0

  return {
    daysLeft,
    dailyTaka,
    dailyKwh,
    effectiveRate,
    depletionDate,
    dataSource,
    dataPoints,
    balance,
  }
}

export default function StatsCards({ data, t }) {
  const { rechargeHistory, monthlyUsage, customerInfo } = data

  const lastRecharge = rechargeHistory[0]
  const latestMonth = monthlyUsage[0]
  const prevMonth = monthlyUsage[1]

  const avgMonthly = monthlyUsage.length > 0
    ? monthlyUsage.reduce((s, m) => s + m.totalRecharge, 0) / monthlyUsage.length
    : 0

  const balance = customerInfo?.balance
    ? parseFloat(customerInfo.balance.replace(/[^\d.-]/g, ''))
    : latestMonth?.endBalance || 0

  const costPerKwh = latestMonth && latestMonth.usedKwh > 0
    ? latestMonth.usedElectricity / latestMonth.usedKwh
    : 0

  const kwhChange = latestMonth && prevMonth && prevMonth.usedKwh > 0
    ? ((latestMonth.usedKwh - prevMonth.usedKwh) / prevMonth.usedKwh * 100)
    : null

  const spendChange = latestMonth && prevMonth && prevMonth.totalRecharge > 0
    ? ((latestMonth.totalRecharge - prevMonth.totalRecharge) / prevMonth.totalRecharge * 100)
    : null

  const forecast = computeForecast(data)

  // Sparkline data: last 6 months (reversed so oldest first for the chart)
  const balanceSparkData = monthlyUsage.slice(0, 6).map(m => m.endBalance).reverse()
  const usageSparkData = monthlyUsage.slice(0, 6).map(m => m.usedKwh).reverse()

  const cards = [
    {
      label: t('Balance'),
      numValue: balance,
      numPrefix: '৳',
      numDecimals: 2,
      value: `৳${balance.toFixed(2)}`,
      sub: customerInfo?.balanceTime ? `As of ${customerInfo.balanceTime}` : 'Latest',
      sparkData: balanceSparkData,
      sparkColor: '#10b981',
    },
    {
      label: t('Last Recharge'),
      numValue: lastRecharge ? lastRecharge.rechargeAmount : null,
      numPrefix: '৳',
      numDecimals: 0,
      value: lastRecharge ? `৳${lastRecharge.rechargeAmount}` : 'N/A',
      sub: lastRecharge ? `${lastRecharge.date}` : '',
      badge: lastRecharge ? lastRecharge.status : null,
    },
    {
      label: t('Month Usage'),
      numValue: latestMonth ? latestMonth.usedKwh : null,
      numPrefix: '',
      numSuffix: ' kWh',
      numDecimals: 0,
      value: latestMonth ? `${latestMonth.usedKwh} kWh` : 'N/A',
      sub: latestMonth ? `৳${latestMonth.usedElectricity.toFixed(0)} elec cost` : '',
      change: kwhChange,
      sparkData: usageSparkData,
      sparkColor: '#f59e0b',
    },
    {
      label: t('Cost / kWh'),
      numValue: costPerKwh > 0 ? costPerKwh : null,
      numPrefix: '৳',
      numDecimals: 2,
      value: costPerKwh > 0 ? `৳${costPerKwh.toFixed(2)}` : 'N/A',
      sub: `Avg spend ৳${avgMonthly.toFixed(0)}/mo`,
      change: spendChange,
    },
  ]

  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, boxShadow: '0 10px 30px -8px rgba(0,0,0,0.08)' }}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="text-sm font-medium text-[var(--color-ink)]/70">
                {card.label}
              </div>

              <div className="flex flex-col items-end gap-2">
                {card.badge && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      card.badge === 'Success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {card.badge === 'Success' ? 'Auto' : 'PIN Req'}
                  </motion.span>
                )}
                {card.change !== undefined && card.change !== null && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      card.change <= 0
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {card.change <= 0 ? '↓' : '↑'} {Math.abs(card.change).toFixed(0)}%
                  </motion.span>
                )}
              </div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                className="text-3xl font-semibold text-[var(--color-ink)] mb-1 tracking-tight"
              >
                {card.numValue != null ? (
                  <AnimatedNumber
                    value={card.numValue}
                    prefix={card.numPrefix || ''}
                    suffix={card.numSuffix || ''}
                    decimals={card.numDecimals || 0}
                  />
                ) : (
                  card.value
                )}
              </motion.div>
              <div className="text-sm text-[var(--color-ink)]/70">{card.sub}</div>
              {card.sparkData && card.sparkData.length >= 2 && (
                <div className="absolute bottom-0 right-0">
                  <Sparkline data={card.sparkData} color={card.sparkColor} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Balance Forecast')}</h3>
              <p className="text-sm text-[var(--color-ink)]/50 mt-0.5">
                Based on {forecast.dataSource.toLowerCase()} ({forecast.dataPoints} data points)
              </p>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                forecast.daysLeft > 14
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : forecast.daysLeft > 5
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {forecast.daysLeft > 14 ? t('Comfortable') : forecast.daysLeft > 5 ? t('Low Soon') : t('Critical')}
            </motion.span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-4"
            >
              <div className="text-sm text-[var(--color-ink)]/60 mb-1">{t('Lasts About')}</div>
              <div className={`text-2xl font-semibold tracking-tight ${
                forecast.daysLeft > 14 ? 'text-green-600' : forecast.daysLeft > 5 ? 'text-amber-600' : 'text-red-600'
              }`}>
                ~{forecast.daysLeft}d
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-4"
            >
              <div className="text-sm text-[var(--color-ink)]/60 mb-1">{t('Daily Burn')}</div>
              <div className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">
                ৳{forecast.dailyTaka.toFixed(1)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-4"
            >
              <div className="text-sm text-[var(--color-ink)]/60 mb-1">{t('Runs Out')}</div>
              <div className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">
                {forecast.depletionDate.getDate()} {MONTH_SHORT[forecast.depletionDate.getMonth()]}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-4"
            >
              <div className="text-sm text-[var(--color-ink)]/60 mb-1">
                {forecast.dailyKwh > 0 ? t('Daily kWh') : t('Eff. Rate')}
              </div>
              <div className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">
                {forecast.dailyKwh > 0
                  ? `${forecast.dailyKwh.toFixed(1)}`
                  : forecast.effectiveRate > 0
                    ? `৳${forecast.effectiveRate.toFixed(2)}`
                    : 'N/A'}
              </div>
            </motion.div>
          </div>

          {/* Visual progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5"
          >
            <div className="flex justify-between text-xs font-medium text-[var(--color-ink)]/50 mb-2">
              <span>৳0</span>
              <span>৳{forecast.balance.toFixed(0)}</span>
            </div>
            <div className="h-2 bg-[var(--color-surface-dim)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(5, (forecast.daysLeft / 30) * 100))}%` }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${
                  forecast.daysLeft > 14 ? 'bg-green-500' : forecast.daysLeft > 5 ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
