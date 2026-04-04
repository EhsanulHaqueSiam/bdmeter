import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const MEDIUM_COLORS = {
  BKASH: 'var(--color-accent-red)',
  NAGAD: 'var(--color-warning)',
  ROCKET: 'var(--color-accent-purple)',
  UPAY: 'var(--color-success)',
  Nesco: 'var(--color-nesco)',
}

const STATUS_COLORS = { Success: 'var(--color-success)', Failed: 'var(--color-danger)' }

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-ink)] brutal-border brutal-shadow-sm p-3">
      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest">
        <span className="w-3 h-3 brutal-border" style={{ background: d.payload.fill || d.color }} />
        <span>{d.name || d.payload.name}: {d.value}</span>
      </div>
    </div>
  )
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="var(--color-ink)" textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="monospace" fontWeight="bold" className="drop-shadow-md">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function RechargeInsights({ rechargeHistory, provider }) {
  const isNesco = provider !== 'desco'
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
    { name: 'AUTO-APPLIED', value: successCount },
    { name: 'MANUAL PIN', value: failedCount },
  ]

  // Recharge amounts over time (group by month)
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyRecharges = {}
  rechargeHistory.forEach((r) => {
    let key = null
    // NESCO format: DD-MMM-YYYY
    const nescoMatch = r.date.match(/(\d{2})-([A-Z]{3})-(\d{4})/)
    if (nescoMatch) {
      key = `${nescoMatch[2]} ${nescoMatch[3].slice(-2)}`
    }
    // DESCO format: YYYY-MM-DD HH:MM:SS
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

  // Summary stats
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0)
  const avgRecharge = totalRecharged / rechargeHistory.length
  const maxRecharge = Math.max(...rechargeHistory.map(r => r.rechargeAmount))

  return (
    <div className="brutal-card p-6">
      <div className="mb-8">
        <h3 className="font-black text-2xl uppercase tracking-tighter">RECHARGE INSIGHTS</h3>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">
          PATTERNS ACROSS {rechargeHistory.length} TRANSACTIONS
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-[var(--color-surface-dim)] brutal-border p-4">
          <div className="font-mono text-2xl font-bold tracking-tighter">৳{totalRecharged.toLocaleString()}</div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1">TOTAL RECHARGED</div>
        </div>
        <div className="bg-[var(--color-surface-dim)] brutal-border p-4">
          <div className="font-mono text-2xl font-bold tracking-tighter">৳{avgRecharge.toFixed(0)}</div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1">AVG PER RECHARGE</div>
        </div>
        <div className="bg-[var(--color-surface-dim)] brutal-border p-4">
          <div className="font-mono text-2xl font-bold tracking-tighter">৳{maxRecharge.toLocaleString()}</div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1">LARGEST RECHARGE</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment methods pie */}
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-[var(--color-ink)] pb-2 mb-4">PAYMENT METHODS</h4>
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
                  stroke="var(--color-ink)"
                  strokeWidth={2}
                >
                  {mediumData.map((entry) => (
                    <Cell key={entry.name} fill={MEDIUM_COLORS[entry.name] || 'var(--color-surface-dim)'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="square" iconSize={10}
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  formatter={(value) => (
                    <span className="text-[var(--color-ink)]">{value} ({mediumCounts[value]})</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Remote recharge rate (NESCO) or amount distribution (DESCO) */}
        <div>
          {isNesco ? (
            <>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-[var(--color-ink)] pb-2 mb-4">REMOTE RECHARGE</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" labelLine={false} label={PieLabel} stroke="var(--color-ink)" strokeWidth={2}>
                      <Cell fill={STATUS_COLORS.Success} />
                      <Cell fill={STATUS_COLORS.Failed} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} formatter={(value) => <span className="text-[var(--color-ink)]">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-[var(--color-ink)] pb-2 mb-4">AMOUNTS</h4>
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
                    })()} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" labelLine={false} label={PieLabel} stroke="var(--color-ink)" strokeWidth={2}>
                      {['var(--color-nesco)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-accent-purple)', 'var(--color-danger)', 'var(--color-surface-dim)'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} formatter={(value) => <span className="text-[var(--color-ink)]">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Monthly recharge frequency */}
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-[var(--color-ink)] pb-2 mb-4">FREQUENCY</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rechargeTimeline.slice(-12)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} interval={1} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-[var(--color-surface)] text-[var(--color-ink)] brutal-border brutal-shadow-sm p-3">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 border-b-2 border-[var(--color-ink)] pb-1">{label}</p>
                        <p className="font-mono text-xs font-bold uppercase">{payload[0].value} RECHARGES</p>
                        <p className="font-mono text-xs font-bold uppercase mt-1">৳{payload[0].payload.total.toLocaleString()} TOTAL</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" fill="var(--color-nesco)" stroke="var(--color-ink)" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
