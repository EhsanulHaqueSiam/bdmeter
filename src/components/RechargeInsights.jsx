import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { motion } from 'framer-motion'

const MEDIUM_COLORS = {
  BKASH: '#f43f5e',
  NAGAD: '#f59e0b',
  ROCKET: '#8b5cf6',
  UPAY: '#10b981',
  Nesco: '#3b82f6',
}

const STATUS_COLORS = { Success: '#10b981', Failed: '#ef4444' }

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-outline)] shadow-sm p-3 text-sm"
    >
      <div className="flex items-center gap-3 font-medium text-[var(--color-ink)]">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload.fill || d.color }} />
        <span>{d.name || d.payload.name}: {d.value}</span>
      </div>
    </motion.div>
  )
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="500">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function RechargeInsights({ rechargeHistory, provider, t }) {
  const isNesco = provider !== 'desco'
  const mediumCounts = {}
  const mediumAmounts = {}
  let successCount = 0
  let failedCount = 0

  rechargeHistory.forEach((r) => {
    mediumCounts[r.medium] = (mediumCounts[r.medium] || 0) + 1
    mediumAmounts[r.medium] = (mediumAmounts[r.medium] || 0) + r.rechargeAmount
    if (r.status === 'Success') successCount++
    else failedCount++
  })

  const mediumData = Object.entries(mediumCounts)
    .map(([name, value]) => ({ name, value, amount: mediumAmounts[name] }))
    .sort((a, b) => b.value - a.value)

  const statusData = [
    { name: 'Auto-Applied', value: successCount },
    { name: 'Manual PIN', value: failedCount },
  ]

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyRecharges = {}
  rechargeHistory.forEach((r) => {
    let key = null
    const nescoMatch = r.date.match(/(\d{2})-([A-Z]{3})-(\d{4})/)
    if (nescoMatch) {
      key = `${nescoMatch[2]} ${nescoMatch[3].slice(-2)}`
    }
    if (!key) {
      const descoMatch = r.date.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (descoMatch) {
        const mi = parseInt(descoMatch[2]) - 1
        key = `${MONTH_ABBR[mi] || descoMatch[2]} ${descoMatch[1].slice(-2)}`
      }
    }
    if (key) {
      if (!monthlyRecharges[key]) monthlyRecharges[key] = { month: key, total: 0, count: 0 }
      monthlyRecharges[key].total += r.rechargeAmount
      monthlyRecharges[key].count++
    }
  })
  const rechargeTimeline = Object.values(monthlyRecharges).reverse()

  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0)
  const avgRecharge = totalRecharged / rechargeHistory.length
  const maxRecharge = Math.max(...rechargeHistory.map(r => r.rechargeAmount))

  const summaryCards = [
    { label: t('Total Recharged'), value: `৳${totalRecharged.toLocaleString()}` },
    { label: t('Avg per Recharge'), value: `৳${avgRecharge.toFixed(0)}` },
    { label: t('Largest Recharge'), value: `৳${maxRecharge.toLocaleString()}` },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
    >
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Recharge Insights')}</h3>
        <p className="text-sm text-[var(--color-ink)]/70 mt-1">
          Patterns across {rechargeHistory.length} transactions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {summaryCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -2 }}
            className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-5"
          >
            <div className="text-sm text-[var(--color-ink)]/70 mb-1">{card.label}</div>
            <div className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-sm font-medium text-[var(--color-ink)] border-b border-[var(--color-outline)] pb-2 mb-4">{t('Payment Methods')}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mediumData}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={75}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                >
                  {mediumData.map((entry) => (
                    <Cell key={entry.name} fill={MEDIUM_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: '12px', fontWeight: '500' }}
                  formatter={(value) => (
                    <span className="text-[var(--color-ink)]">{value} ({mediumCounts[value]})</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isNesco ? (
            <>
              <h4 className="text-sm font-medium text-[var(--color-ink)] border-b border-[var(--color-outline)] pb-2 mb-4">{t('Remote Recharge')}</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" labelLine={false} label={PieLabel} stroke="var(--color-surface)" strokeWidth={2}>
                      <Cell fill={STATUS_COLORS.Success} />
                      <Cell fill={STATUS_COLORS.Failed} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} formatter={(value) => <span className="text-[var(--color-ink)]">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-sm font-medium text-[var(--color-ink)] border-b border-[var(--color-outline)] pb-2 mb-4">Amounts</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(() => {
                      const buckets = {}
                      rechargeHistory.forEach(r => {
                        const label = `৳${r.rechargeAmount}`
                        buckets[label] = (buckets[label] || 0) + 1
                      })
                      return Object.entries(buckets).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
                    })()} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" labelLine={false} label={PieLabel} stroke="var(--color-surface)" strokeWidth={2}>
                      {['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#94a3b8'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} formatter={(value) => <span className="text-[var(--color-ink)]">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-sm font-medium text-[var(--color-ink)] border-b border-[var(--color-outline)] pb-2 mb-4">{t('Frequency')}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rechargeTimeline.slice(-12)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--color-outline)', opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-outline)] shadow-sm p-3 text-sm">
                        <p className="font-medium text-[var(--color-ink)] mb-2 border-b border-[var(--color-outline)] pb-1">{label}</p>
                        <p className="text-[var(--color-ink)]">{payload[0].value} Recharges</p>
                        <p className="text-[var(--color-ink)]/70 mt-0.5">৳{payload[0].payload.total.toLocaleString()} total</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
