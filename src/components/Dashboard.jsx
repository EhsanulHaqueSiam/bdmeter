import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatsCards from './StatsCards'
import CustomerInfo from './CustomerInfo'
import UsageChart from './UsageChart'
import RechargeInsights from './RechargeInsights'
import RechargeHistory from './RechargeHistory'
import MonthlyTable from './MonthlyTable'
import RechargeCalculator from './RechargeCalculator'

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportRechargesCSV(rechargeHistory) {
  const headers = ['Serial', 'Date', 'Token', 'Amount', 'Electricity', 'kWh', 'VAT', 'Demand Charge', 'Rebate', 'Medium', 'Status']
  const rows = rechargeHistory.map((r) => [
    r.serial, r.date, r.tokenNo, r.rechargeAmount, r.electricity, r.probableKwh,
    r.vat, r.demandCharge, r.rebate, r.medium, r.status,
  ])
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  downloadCSV('recharges.csv', csv)
}

function exportMonthlyCSV(monthlyUsage) {
  const headers = ['Month', 'Year', 'Recharge', 'Electricity', 'kWh', 'Rebate', 'Demand', 'Rent', 'VAT', 'Total Usage', 'Balance']
  const rows = monthlyUsage.map((m) => [
    m.month, m.year, m.totalRecharge, m.usedElectricity, m.usedKwh,
    m.rebate, m.demandCharge, m.meterRent, m.vat, m.totalUsage, m.endBalance,
  ])
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  downloadCSV('monthly-usage.csv', csv)
}

function ExportDropdown({ data, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-xl font-medium text-sm border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {t('Export')}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl shadow-lg overflow-hidden z-50"
          >
            {data.rechargeHistory?.length > 0 && (
              <button
                onClick={() => { exportRechargesCSV(data.rechargeHistory); setOpen(false) }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer"
              >
                {t('Export Recharges CSV')}
              </button>
            )}
            {data.monthlyUsage?.length > 0 && (
              <button
                onClick={() => { exportMonthlyCSV(data.monthlyUsage); setOpen(false) }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer border-t border-[var(--color-outline)]"
              >
                {t('Export Monthly CSV')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Dashboard({ data, meterNo, onReset, isSaved, onSave, t }) {
  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-end gap-3">
        <ExportDropdown data={data} t={t} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <CustomerInfo data={data} meterNo={meterNo} onReset={onReset} isSaved={isSaved} onSave={onSave} t={t} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <StatsCards data={data} t={t} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <RechargeCalculator data={data} t={t} />
      </motion.div>
      {data.monthlyUsage?.length > 0 && (
        <motion.div variants={fadeUp}>
          <UsageChart monthlyUsage={data.monthlyUsage} t={t} />
        </motion.div>
      )}
      {data.rechargeHistory?.length > 0 && (
        <motion.div variants={fadeUp}>
          <RechargeInsights rechargeHistory={data.rechargeHistory} provider={data.provider} t={t} />
        </motion.div>
      )}
      {data.rechargeHistory?.length > 0 && (
        <motion.div variants={fadeUp}>
          <RechargeHistory rechargeHistory={data.rechargeHistory} provider={data.provider} t={t} />
        </motion.div>
      )}
      {data.monthlyUsage?.length > 0 && (
        <motion.div variants={fadeUp}>
          <MonthlyTable monthlyUsage={data.monthlyUsage} provider={data.provider} t={t} />
        </motion.div>
      )}
    </motion.div>
  )
}
