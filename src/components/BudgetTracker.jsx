import { useState } from 'react'
import { motion } from 'framer-motion'
import { haptic } from '../utils/haptic'

const STORAGE_KEY = 'monthly_budget'

function getBudget() {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    return val ? parseFloat(val) : 0
  } catch { return 0 }
}

function saveBudget(val) {
  try { localStorage.setItem(STORAGE_KEY, String(val)) } catch {}
}

export default function BudgetTracker({ data, t }) {
  const [budget, setBudget] = useState(getBudget)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const latestMonth = data.monthlyUsage?.[0]
  const spent = latestMonth?.totalUsage || latestMonth?.usedElectricity || 0

  const handleSave = () => {
    const val = parseFloat(inputVal) || 0
    setBudget(val)
    saveBudget(val)
    setEditing(false)
  }

  // Days calculations
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysLeft = daysInMonth - dayOfMonth

  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const remaining = budget > 0 ? Math.max(budget - spent, 0) : 0

  const getColor = () => {
    if (percentage >= 90) return { bar: 'bg-red-500', text: 'text-red-600', ring: 'text-red-500' }
    if (percentage >= 70) return { bar: 'bg-amber-500', text: 'text-amber-600', ring: 'text-amber-500' }
    return { bar: 'bg-green-500', text: 'text-green-600', ring: 'text-green-500' }
  }
  const colors = getColor()

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Budget Tracker')}</h3>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            {t('Monthly spending vs budget')}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            haptic()
            if (!editing) {
              setInputVal(budget > 0 ? String(budget) : '')
            }
            setEditing(!editing)
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)]/70 hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer"
          aria-label={t('Set Budget')}
        >
          {budget > 0 ? t('Edit') : t('Set Budget')}
        </motion.button>
      </div>

      {editing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 flex items-center gap-3"
        >
          <div className="relative flex-1 max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--color-ink-muted)]">&#2547;</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="2000"
              className="w-full h-10 pl-8 pr-3 text-sm font-mono font-medium text-[var(--color-ink)] bg-[var(--color-surface-dim)]/50 border border-[var(--color-outline)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-nesco)]/20 transition-all placeholder:text-[var(--color-ink-muted)]"
              aria-label={t('Monthly budget amount')}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { haptic(); handleSave() }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-ink)] text-[var(--color-canvas)] cursor-pointer"
          >
            {t('Save')}
          </motion.button>
        </motion.div>
      )}

      {budget > 0 ? (
        <div>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-medium text-[var(--color-ink-muted)] mb-2">
              <span>&#2547;0</span>
              <span>&#2547;{budget.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-[var(--color-surface-dim)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${colors.bar}`}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-3">
              <div className="text-xs text-[var(--color-ink-muted)] mb-1">{t('Budget')}</div>
              <div className="text-lg font-semibold text-[var(--color-ink)]">&#2547;{budget.toLocaleString()}</div>
            </div>
            <div className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-3">
              <div className="text-xs text-[var(--color-ink-muted)] mb-1">{t('Spent')}</div>
              <div className={`text-lg font-semibold ${colors.text}`}>&#2547;{spent.toFixed(0)}</div>
            </div>
            <div className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-3">
              <div className="text-xs text-[var(--color-ink-muted)] mb-1">{t('Remaining')}</div>
              <div className="text-lg font-semibold text-[var(--color-ink)]">&#2547;{remaining.toFixed(0)}</div>
            </div>
            <div className="bg-[var(--color-surface-dim)]/50 rounded-xl border border-[var(--color-outline)] p-3">
              <div className="text-xs text-[var(--color-ink-muted)] mb-1">{t('Days Left')}</div>
              <div className="text-lg font-semibold text-[var(--color-ink)]">{daysLeft}</div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)] py-4 text-center">
          {t('Set a monthly budget to track your spending')}
        </p>
      )}
    </motion.div>
  )
}
