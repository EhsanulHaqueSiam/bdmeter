import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { exportRechargesAsICS } from '../utils/calendarExport'
import { haptic } from '../utils/haptic'

function isSuccessStatus(status) {
  return ['Success', 'Successful'].includes(status)
}

function CopyButton({ text }) {
  const [status, setStatus] = useState('idle')
  const clean = String(text || '').replace(/\s/g, '')

  const copyText = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clean)
      } else {
        const el = document.createElement('textarea')
        el.value = clean
        el.setAttribute('readonly', '')
        el.style.position = 'absolute'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setStatus('copied')
    } catch {
      setStatus('failed')
    } finally {
      window.setTimeout(() => setStatus('idle'), 1500)
    }
  }

  return (
    <motion.button
      onClick={copyText}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className="ml-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--color-outline)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-dim)] text-[var(--color-ink)] text-xs font-medium transition-colors cursor-pointer"
      title="Copy Token"
      aria-label="Copy token number"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {status === 'copied' ? 'Copied' : status === 'failed' ? 'Failed' : 'Copy'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

function formatMoney(value, { decimals = 0, zeroAsDash = false } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  if (zeroAsDash && n === 0) return '-'
  return `৳${n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function formatKwh(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return '-'
  return n.toFixed(2)
}

export default function RechargeHistory({ rechargeHistory, provider, t }) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [amountFilter, setAmountFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isPrinting, setIsPrinting] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('print').matches
  })
  const isDesco = provider === 'desco'
  const lastIsSuccess = isSuccessStatus(rechargeHistory[0]?.status)

  useEffect(() => {
    const media = window.matchMedia('print')
    const sync = () => setIsPrinting(media.matches)
    const onBeforePrint = () => setIsPrinting(true)
    const onAfterPrint = () => setIsPrinting(false)

    sync()
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    media.addEventListener?.('change', sync)
    media.addListener?.(sync)

    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
      media.removeEventListener?.('change', sync)
      media.removeListener?.(sync)
    }
  }, [])

  // Apply filters
  let filtered = rechargeHistory

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(r =>
      (r.tokenNo && String(r.tokenNo).toLowerCase().includes(q)) ||
      (r.date && r.date.toLowerCase().includes(q))
    )
  }

  // Status filter
  if (statusFilter !== 'all') {
    if (isDesco) {
      filtered = filtered.filter(r => isSuccessStatus(r.status))
    } else {
      if (statusFilter === 'auto') {
        filtered = filtered.filter(r => isSuccessStatus(r.status))
      } else if (statusFilter === 'pin') {
        filtered = filtered.filter(r => !isSuccessStatus(r.status))
      }
    }
  }

  // Amount filter
  if (amountFilter === '<500') {
    filtered = filtered.filter(r => r.rechargeAmount < 500)
  } else if (amountFilter === '500-1000') {
    filtered = filtered.filter(r => r.rechargeAmount >= 500 && r.rechargeAmount <= 1000)
  } else if (amountFilter === '>1000') {
    filtered = filtered.filter(r => r.rechargeAmount > 1000)
  }

  const visible = expanded || isPrinting ? filtered : filtered.slice(0, 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
    >
      <div className="px-6 py-6 border-b border-[var(--color-outline)] flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('History')}</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">
            {filtered.length !== rechargeHistory.length
              ? `${filtered.length} / ${rechargeHistory.length}`
              : rechargeHistory.length
            } {t('Transactions')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { haptic(); exportRechargesAsICS(filtered, provider) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)]/70 hover:bg-[var(--color-surface-dim)] cursor-pointer transition-colors"
            aria-label={t('Export Calendar')}
            title={t('Export Calendar')}
          >
            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            .ics
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { haptic(); setShowFilters(!showFilters) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
              showFilters || search || statusFilter !== 'all' || amountFilter !== 'all'
                ? 'border-[var(--color-nesco)] bg-blue-50 text-[var(--color-nesco)]'
                : 'border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)]/70 hover:bg-[var(--color-surface-dim)]'
            }`}
            aria-label="Toggle search and filters"
            aria-expanded={showFilters}
          >
            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filter
          </motion.button>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center"
          >
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              lastIsSuccess
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className={`w-2 h-2 rounded-full ${
                  lastIsSuccess ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              Last: {isDesco ? (rechargeHistory[0]?.status || 'Unknown') : (lastIsSuccess ? 'Auto' : 'PIN')}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Search and Filter bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-[var(--color-outline)]"
          >
            <div className="px-6 py-4 flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Search token or date...')}
                  className="w-full h-9 pl-9 pr-3 text-sm text-[var(--color-ink)] bg-[var(--color-surface-dim)]/50 border border-[var(--color-outline)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-nesco)]/20 transition-all placeholder:text-[var(--color-ink-muted)]"
                  aria-label={t('Search token or date...')}
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[var(--color-ink-muted)] uppercase">Status:</span>
                {(isDesco
                  ? [{ key: 'all', label: t('All') }, { key: 'successful', label: t('Successful') }]
                  : [{ key: 'all', label: t('All') }, { key: 'auto', label: t('Auto') }, { key: 'pin', label: t('PIN') }]
                ).map((opt) => (
                  <motion.button
                    key={opt.key}
                    onClick={() => { haptic(); setStatusFilter(opt.key) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      statusFilter === opt.key
                        ? 'bg-[var(--color-ink)] text-[var(--color-canvas)]'
                        : 'bg-[var(--color-surface-dim)] text-[var(--color-ink)]/60 hover:bg-[var(--color-outline)]'
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>

              {/* Amount filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[var(--color-ink-muted)] uppercase">{t('Amount')}:</span>
                {[
                  { key: 'all', label: t('All') },
                  { key: '<500', label: '<500' },
                  { key: '500-1000', label: '500-1K' },
                  { key: '>1000', label: '>1K' },
                ].map((opt) => (
                  <motion.button
                    key={opt.key}
                    onClick={() => { haptic(); setAmountFilter(opt.key) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      amountFilter === opt.key
                        ? 'bg-[var(--color-ink)] text-[var(--color-canvas)]'
                        : 'bg-[var(--color-surface-dim)] text-[var(--color-ink)]/60 hover:bg-[var(--color-outline)]'
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-[var(--color-surface-dim)]/50 text-[var(--color-ink)]/70 font-medium">
            <tr>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">#</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">Date & Token</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Amount</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">VAT</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Demand</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Rebate</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-center">Medium</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {visible.map((r, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="hover:bg-[var(--color-surface-dim)]/50 transition-colors"
              >
                <td className="px-6 py-4 text-[var(--color-ink)]/70">{r.serial}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-[var(--color-ink)]">{r.date}</div>
                  <div className="flex items-center mt-1">
                    <span className="text-[var(--color-ink)]/60 truncate max-w-[150px]" title={r.tokenNo}>{r.tokenNo}</span>
                    {!isDesco && r.status === 'Failed' && <CopyButton text={r.tokenNo} />}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-[var(--color-ink)]">{formatMoney(r.rechargeAmount)}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/80">{formatMoney(r.electricity)}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]">{formatKwh(r.probableKwh)}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60">{formatMoney(r.vat, { zeroAsDash: true })}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60">{formatMoney(r.demandCharge, { zeroAsDash: true })}</td>
                <td className="px-6 py-4 text-right text-green-600">{r.rebate < 0 ? `৳${Math.abs(r.rebate).toFixed(0)}` : '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface-dim)] text-[var(--color-ink)]/80 text-xs font-medium">{r.medium}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isSuccessStatus(r.status)
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isDesco ? (r.status || 'Unknown') : (isSuccessStatus(r.status) ? 'Auto' : 'PIN')}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
          No matching transactions found
        </div>
      )}

      <AnimatePresence>
        {filtered.length > 10 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { haptic(); setExpanded(!expanded) }}
            className="w-full py-4 text-sm font-medium text-[var(--color-ink)] transition-colors border-t border-[var(--color-outline)] cursor-pointer"
          >
            {expanded ? 'Show Less' : `Show All ${filtered.length} Transactions`}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
