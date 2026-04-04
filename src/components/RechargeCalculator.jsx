import { useState } from 'react'
import { motion } from 'framer-motion'

export default function RechargeCalculator({ data, t }) {
  const [amount, setAmount] = useState('')

  const { monthlyUsage, dailyConsumption, rechargeHistory, customerInfo } = data

  // Compute cost per kWh
  let costPerKwh = 0
  const latestMonth = monthlyUsage?.[0]
  if (latestMonth && latestMonth.usedKwh > 0) {
    costPerKwh = latestMonth.usedElectricity / latestMonth.usedKwh
  }

  // Compute daily burn in taka
  let dailyTaka = 0
  if (dailyConsumption?.length >= 2) {
    const sorted = [...dailyConsumption].sort((a, b) => a.date.localeCompare(b.date))
    const recent = sorted.slice(-8)
    if (recent.length >= 2) {
      const first = recent[0]
      const last = recent[recent.length - 1]
      const days = recent.length - 1
      const takaDiff = last.consumedTaka - first.consumedTaka
      if (takaDiff > 0 && days > 0) dailyTaka = takaDiff / days
    }
  }
  if (dailyTaka <= 0 && latestMonth) {
    if (latestMonth.usedElectricity > 0) {
      dailyTaka = latestMonth.usedElectricity / 30
    }
  }
  if (dailyTaka <= 0 && rechargeHistory?.length >= 2) {
    const dates = rechargeHistory
      .map(r => new Date(r.date.replace(/(\d{2})-([A-Z]{3})-(\d{4})/, '$3-$2-$1')))
      .filter(d => !isNaN(d))
    if (dates.length >= 2) {
      const newest = dates[0]
      const oldest = dates[Math.min(dates.length - 1, 9)]
      const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24)
      const totalSpent = rechargeHistory.slice(0, Math.min(rechargeHistory.length, 10)).reduce((s, r) => s + r.rechargeAmount, 0)
      if (daySpan > 0) dailyTaka = totalSpent / daySpan
    }
  }

  const numAmount = parseFloat(amount) || 0
  const estimatedKwh = costPerKwh > 0 ? numAmount / costPerKwh : 0
  const estimatedDays = dailyTaka > 0 ? numAmount / dailyTaka : 0

  if (costPerKwh <= 0 && dailyTaka <= 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
    >
      <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight mb-1">
        {t('Recharge Calculator')}
      </h3>
      <p className="text-sm text-[var(--color-ink-muted)] mb-6">
        {t('If I recharge')}...
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[var(--color-ink-muted)]">৳</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="500"
            className="w-full h-14 pl-10 pr-4 font-mono text-xl font-semibold text-[var(--color-ink)] bg-[var(--color-surface-dim)]/50 border border-[var(--color-outline)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-nesco)]/20 focus:border-[var(--color-nesco)] transition-all placeholder:text-[var(--color-ink-muted)]"
          />
        </div>
      </div>

      {numAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {costPerKwh > 0 && (
            <div className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-4">
              <div className="text-sm text-[var(--color-ink)]/60 mb-1">{t('Estimated kWh')}</div>
              <div className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">
                {estimatedKwh.toFixed(1)} kWh
              </div>
              <div className="text-xs text-[var(--color-ink-muted)] mt-1">
                @ ৳{costPerKwh.toFixed(2)}/kWh
              </div>
            </div>
          )}
          {dailyTaka > 0 && (
            <div className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-4">
              <div className="text-sm text-[var(--color-ink)]/60 mb-1">{t('Days it will last')}</div>
              <div className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">
                ~{Math.floor(estimatedDays)} days
              </div>
              <div className="text-xs text-[var(--color-ink-muted)] mt-1">
                @ ৳{dailyTaka.toFixed(1)}/day burn
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
