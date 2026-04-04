import { motion } from 'framer-motion'

export default function StatsCards({ data }) {
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

  const cards = [
    {
      label: 'Balance',
      value: `৳${balance.toFixed(2)}`,
      sub: customerInfo?.balanceTime ? `As of ${customerInfo.balanceTime}` : 'Latest',
    },
    {
      label: 'Last Recharge',
      value: lastRecharge ? `৳${lastRecharge.rechargeAmount}` : 'N/A',
      sub: lastRecharge ? `${lastRecharge.date}` : '',
      badge: lastRecharge ? lastRecharge.status : null,
    },
    {
      label: 'Month Usage',
      value: latestMonth ? `${latestMonth.usedKwh} kWh` : 'N/A',
      sub: latestMonth ? `৳${latestMonth.usedElectricity.toFixed(0)} elec cost` : '',
      change: kwhChange,
    },
    {
      label: 'Cost / kWh',
      value: costPerKwh > 0 ? `৳${costPerKwh.toFixed(2)}` : 'N/A',
      sub: `Avg spend ৳${avgMonthly.toFixed(0)}`,
      change: spendChange,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, boxShadow: '0 10px 30px -8px rgba(0,0,0,0.08)' }}
          className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm p-6 flex flex-col justify-between"
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

          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              className="text-3xl font-semibold text-[var(--color-ink)] mb-1 tracking-tight"
            >
              {card.value}
            </motion.div>
            <div className="text-sm text-[var(--color-ink)]/70">{card.sub}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
