import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const MEDIUM_COLORS = {
  BKASH: '#E2136E',
  NAGAD: '#F6921E',
  ROCKET: '#8B2D8B',
  UPAY: '#00A651',
  Nesco: '#334464',
}

const STATUS_COLORS = { Success: '#10b981', Failed: '#f59e0b' }

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl border border-slate-700">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: d.payload.fill || d.color }} />
        <span className="font-semibold">{d.name || d.payload.name}: {d.value}</span>
      </div>
    </div>
  )
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function RechargeInsights({ rechargeHistory }) {
  // Payment method breakdown
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
    { name: 'Auto-applied', value: successCount },
    { name: 'Manual PIN', value: failedCount },
  ]

  // Recharge amounts over time (group by month)
  const monthlyRecharges = {}
  rechargeHistory.forEach((r) => {
    const match = r.date.match(/(\d{2})-([A-Z]{3})-(\d{4})/)
    if (match) {
      const key = `${match[2]} ${match[3].slice(-2)}`
      if (!monthlyRecharges[key]) monthlyRecharges[key] = { month: key, total: 0, count: 0 }
      monthlyRecharges[key].total += r.rechargeAmount
      monthlyRecharges[key].count++
    }
  })
  const rechargeTimeline = Object.values(monthlyRecharges).reverse()

  // Summary stats
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0)
  const avgRecharge = totalRecharged / rechargeHistory.length
  const maxRecharge = Math.max(...rechargeHistory.map(r => r.rechargeAmount))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="mb-6">
        <h3 className="font-bold text-slate-900 text-base">Recharge Insights</h3>
        <p className="text-xs text-slate-400 mt-0.5">Payment patterns across {rechargeHistory.length} transactions</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
          <div className="text-lg font-bold text-slate-900">৳{totalRecharged.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-medium">Total Recharged</div>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
          <div className="text-lg font-bold text-slate-900">৳{avgRecharge.toFixed(0)}</div>
          <div className="text-[11px] text-slate-400 font-medium">Avg per Recharge</div>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
          <div className="text-lg font-bold text-slate-900">৳{maxRecharge.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-medium">Largest Recharge</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment methods pie */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Methods</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mediumData}
                  cx="50%" cy="50%"
                  innerRadius={35} outerRadius={70}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {mediumData.map((entry) => (
                    <Cell key={entry.name} fill={MEDIUM_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconSize={8} iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value, entry) => (
                    <span className="text-slate-600">{value} ({mediumCounts[value]})</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Remote recharge success rate */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Remote Recharge Rate</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={35} outerRadius={70}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  <Cell fill={STATUS_COLORS.Success} />
                  <Cell fill={STATUS_COLORS.Failed} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconSize={8} iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => <span className="text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-1">
            <span className="text-xs text-slate-400">
              {((successCount / rechargeHistory.length) * 100).toFixed(0)}% auto-applied
            </span>
          </div>
        </div>

        {/* Monthly recharge frequency */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recharge Frequency</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rechargeTimeline.slice(-12)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl border border-slate-700">
                        <p className="font-semibold mb-1">{label}</p>
                        <p className="text-slate-300">{payload[0].value} recharges</p>
                        <p className="text-slate-300">৳{payload[0].payload.total.toLocaleString()} total</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
