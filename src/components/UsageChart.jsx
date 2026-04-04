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
    <div className="bg-slate-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl border border-slate-700">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
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
    { key: 'cost', label: 'Cost Breakdown' },
    { key: 'kwh', label: 'Energy (kWh)' },
    { key: 'rate', label: 'Unit Rate' },
    { key: 'balance', label: 'Balance' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Monthly Usage Analytics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Your electricity consumption over time</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === v.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
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
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="electricityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="electricity" name="Electricity (৳)" fill="url(#electricityGrad)" stroke="#3b82f6" strokeWidth={2.5} />
              <Bar dataKey="vat" name="VAT (৳)" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={14} stackId="extra" />
              <Bar dataKey="demandCharge" name="Demand (৳)" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={14} stackId="extra" />
              <Bar dataKey="meterRent" name="Meter Rent (৳)" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={14} stackId="extra" />
              <Line type="monotone" dataKey="totalRecharge" name="Recharge (৳)" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
            </ComposedChart>
          ) : view === 'kwh' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="kwh" name="Energy (kWh)" fill="url(#kwhGrad)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
              <Line type="monotone" dataKey="electricity" name="Cost (৳)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </ComposedChart>
          ) : view === 'rate' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="rate" name="Rate (৳/kWh)" fill="url(#rateGrad)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" name="Balance (৳)" fill="url(#balGrad)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
