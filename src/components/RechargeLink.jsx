import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PROVIDERS = [
  { name: 'bKash', url: 'https://www.bkash.com/', color: '#E2136E' },
  { name: 'Nagad', url: 'https://nagad.com.bd/', color: '#F6921E' },
  { name: 'Rocket', url: 'https://www.dutchbanglabank.com/rocket/rocket.html', color: '#8B2F8B' },
  { name: 'Upay', url: 'https://www.upaybd.com/', color: '#00A651' },
]

export default function RechargeLink({ meterNo, t }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyMeter = async () => {
    try {
      await navigator.clipboard.writeText(String(meterNo))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-xl font-medium text-sm border border-[var(--color-success)] bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
        aria-label={t('Recharge Now')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
        {t('Recharge Now')}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl shadow-lg overflow-hidden z-50"
          >
            {/* Copy meter number */}
            <button
              onClick={copyMeter}
              className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer flex items-center justify-between border-b border-[var(--color-outline)]"
            >
              <span className="font-mono text-xs">{meterNo}</span>
              <span className="text-[10px] font-medium text-[var(--color-ink-muted)]">
                {copied ? t('Copied') : t('Copy')}
              </span>
            </button>
            {/* Payment providers */}
            {PROVIDERS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer flex items-center gap-3 border-b border-[var(--color-outline)] last:border-0"
                onClick={() => setOpen(false)}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
                <svg className="w-3 h-3 ml-auto text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
