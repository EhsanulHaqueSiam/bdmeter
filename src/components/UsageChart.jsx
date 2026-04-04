import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, Bar,
} from 'recharts'
import { useState } from 'react'

const MONTH_MAP = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-ink)] brutal-border brutal-shadow-sm p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 border-b-2 border-[var(--color-ink)] pb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-1 font-mono text-xs font-bold uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 brutal-border" style={{ background: p.color }} />
            <span>{p.name}:</span>
          </div>
          <span>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function UsageChart({ monthlyUsage }) {
  const [view, setView] = useState('cost')

  const chartData = [...monthlyUsage].reverse().map((m) => ({
    month: `${MONTH_MAP[m.month] || m.month} ${m.year.slice(-2)}`,
    totalRecharge: m.totalRecharge,
    electricity: m.usedElectricity,
    kwh: m.usedKwh,
    balance: m.endBalance,
    vat: m.vat,
    demandCharge: m.demandCharge,
    meterRent: m.meterRent,
    rate: m.usedKwh > 0 ? +(m.usedElectricity / m.usedKwh).toFixed(2) : 0,
    totalUsage: m.totalUsage,
  }))

  const views = [
    { key: 'cost', label: 'COST' },
    { key: 'kwh', label: 'ENERGY (KWH)' },
    { key: 'rate', label: 'RATE' },
    { key: 'balance', label: 'BALANCE' },
  ]

  return (
    <div className="brutal-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="font-black text-2xl uppercase tracking-tighter">USAGE ANALYTICS</h3>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">
            ELECTRICITY CONSUMPTION
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer brutal-border ${
                view === v.key
                  ? 'bg-[var(--color-ink)] text-[var(--color-surface)] brutal-shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'cost' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={12} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '16px' }} />
              <Area type="step" dataKey="electricity" name="ELECTRICITY" fill="var(--color-nesco-light)" fillOpacity={1} stroke="var(--color-ink)" strokeWidth={2} />
              <Bar dataKey="vat" name="VAT" fill="var(--color-warning)" stroke="var(--color-ink)" strokeWidth={2} stackId="extra" />
              <Bar dataKey="demandCharge" name="DEMAND" fill="var(--color-accent-purple)" stroke="var(--color-ink)" strokeWidth={2} stackId="extra" />
              <Bar dataKey="meterRent" name="METER RENT" fill="var(--color-surface-dim)" stroke="var(--color-ink)" strokeWidth={2} stackId="extra" />
              <Line type="step" dataKey="totalRecharge" name="RECHARGE" stroke="var(--color-success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-success)', stroke: 'var(--color-ink)', strokeWidth: 2 }} />
            </ComposedChart>
          ) : view === 'kwh' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={12} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '16px' }} />
              <Area type="step" dataKey="kwh" name="ENERGY (KWH)" fill="var(--color-warning)" fillOpacity={1} stroke="var(--color-ink)" strokeWidth={2} />
              <Line type="step" dataKey="electricity" name="COST" stroke="var(--color-nesco)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-nesco)', stroke: 'var(--color-ink)', strokeWidth: 2 }} />
            </ComposedChart>
          ) : view === 'rate' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={12} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '16px' }} />
              <Area type="step" dataKey="rate" name="RATE (৳/KWH)" fill="var(--color-accent-purple)" fillOpacity={1} stroke="var(--color-ink)" strokeWidth={2} />
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="step" dataKey="balance" name="BALANCE" fill="var(--color-success)" fillOpacity={1} stroke="var(--color-ink)" strokeWidth={2} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
