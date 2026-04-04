import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
      className="ml-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--color-outline)] bg-white hover:bg-gray-50 text-[var(--color-ink)] text-xs font-medium transition-colors cursor-pointer"
      title="Copy Token"
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

export default function RechargeHistory({ rechargeHistory, provider }) {
  const [expanded, setExpanded] = useState(false)
  const isDesco = provider === 'desco'
  const visible = expanded ? rechargeHistory : rechargeHistory.slice(0, 10)
  const lastIsSuccess = ['Success', 'Successful'].includes(rechargeHistory[0]?.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
    >
      <div className="px-6 py-6 border-b border-[var(--color-outline)] flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">History</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">{rechargeHistory.length} Transactions</p>
        </div>
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

      <div className="overflow-x-auto">
        <table className={isDesco ? 'min-w-[920px] w-full text-sm text-left whitespace-nowrap' : 'min-w-[1200px] w-full text-sm text-left whitespace-nowrap'}>
          <thead className="bg-gray-50/50 text-[var(--color-ink)]/70 font-medium">
            <tr>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">#</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">Date & Token</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Amount</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">VAT</th>
              {!isDesco && <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Demand</th>}
              {!isDesco && <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Rebate</th>}
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
                className="hover:bg-gray-50/50 transition-colors"
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
                {!isDesco && <td className="px-6 py-4 text-right text-[var(--color-ink)]/60">{formatMoney(r.demandCharge, { zeroAsDash: true })}</td>}
                {!isDesco && <td className="px-6 py-4 text-right text-green-600">{r.rebate < 0 ? `৳${Math.abs(r.rebate).toFixed(0)}` : '-'}</td>}
                <td className="px-6 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md bg-gray-100 text-[var(--color-ink)]/80 text-xs font-medium">{r.medium}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    ['Success', 'Successful'].includes(r.status)
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isDesco ? (r.status || 'Unknown') : (r.status === 'Success' ? 'Auto' : 'PIN')}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {rechargeHistory.length > 10 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setExpanded(!expanded)}
            className="w-full py-4 text-sm font-medium text-[var(--color-ink)] transition-colors border-t border-[var(--color-outline)] cursor-pointer"
          >
            {expanded ? 'Show Less' : `Show All ${rechargeHistory.length} Transactions`}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
