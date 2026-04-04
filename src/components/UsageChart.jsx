import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, Bar,
} from 'recharts'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MONTH_MAP = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-white rounded-lg border border-[var(--color-outline)] shadow-sm p-3 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)] mb-2 border-b border-[var(--color-outline)] pb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-6 py-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--color-ink)]/70">{p.name}:</span>
          </div>
          <span className="font-medium text-[var(--color-ink)]">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </motion.div>
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
    { key: 'cost', label: 'Cost' },
    { key: 'kwh', label: 'Energy (kWh)' },
    { key: 'rate', label: 'Rate' },
    { key: 'balance', label: 'Balance' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">Usage Analytics</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">
            Electricity consumption
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {views.map((v) => (
            <motion.button
              key={v.key}
              onClick={() => setView(v.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
                view === v.key
                  ? 'text-white shadow-sm'
                  : 'bg-white text-[var(--color-ink)]/70 border border-[var(--color-outline)] hover:bg-gray-50'
              }`}
            >
              {view === v.key && (
                <motion.span
                  layoutId="chart-tab"
                  className="absolute inset-0 bg-[var(--color-ink)] rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{v.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            {view === 'cost' ? (
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500', paddingTop: '16px' }} />
                <Area type="monotone" dataKey="electricity" name="Electricity" fill="#eff6ff" fillOpacity={1} stroke="#3b82f6" strokeWidth={2} />
                <Bar dataKey="vat" name="VAT" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="extra" />
                <Bar dataKey="demandCharge" name="Demand" fill="#8b5cf6" radius={[2, 2, 0, 0]} stackId="extra" />
                <Bar dataKey="meterRent" name="Meter Rent" fill="#94a3b8" radius={[2, 2, 0, 0]} stackId="extra" />
                <Line type="monotone" dataKey="totalRecharge" name="Recharge" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} />
              </ComposedChart>
            ) : view === 'kwh' ? (
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500', paddingTop: '16px' }} />
                <Area type="monotone" dataKey="kwh" name="Energy (kWh)" fill="#fef3c7" fillOpacity={1} stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="electricity" name="Cost" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }} />
              </ComposedChart>
            ) : view === 'rate' ? (
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500', paddingTop: '16px' }} />
                <Area type="monotone" dataKey="rate" name="Rate (৳/kWh)" fill="#ede9fe" fillOpacity={1} stroke="#8b5cf6" strokeWidth={2} />
              </ComposedChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" name="Balance" fill="#d1fae5" fillOpacity={1} stroke="#10b981" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
