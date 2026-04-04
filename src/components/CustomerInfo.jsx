import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic } from '../utils/haptic'

function ShareButton({ meterNo, provider, t }) {
  const [status, setStatus] = useState('idle')

  const handleShare = async () => {
    haptic()
    const url = new URL(window.location.origin)
    url.searchParams.set('meter', meterNo)
    url.searchParams.set('provider', provider || 'nesco')
    const shareUrl = url.toString()

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${(provider || 'nesco').toUpperCase()} Meter — ${meterNo}`,
          text: `Check prepaid meter ${meterNo} on BD Meter Dashboard`,
          url: shareUrl,
        })
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 2000)
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus('copied')
    } catch {
      // Last resort fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setStatus('copied')
    }
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleShare}
      className="px-4 py-2 rounded-xl font-medium text-sm border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
    >
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.span key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {t('Share')}
          </motion.span>
        ) : (
          <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[var(--color-success)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {status === 'shared' ? t('Shared') : t('Link Copied')}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default function CustomerInfo({ data, meterNo, onReset, isSaved, onSave, t }) {
  const { customerInfo } = data

  const fields = [
    { label: 'Consumer No', value: customerInfo?.consumerNo || meterNo },
    { label: 'Meter No', value: customerInfo?.meterNo || '-' },
    { label: 'Tariff', value: customerInfo?.tariff || '-' },
    { label: 'Load', value: customerInfo?.approvedLoad ? `${customerInfo.approvedLoad} kW` : '-' },
    { label: 'Type', value: customerInfo?.meterType || '-' },
    { label: 'Status', value: customerInfo?.meterStatus || '-' },
    { label: 'Office', value: customerInfo?.office || '-' },
    { label: 'Feeder', value: customerInfo?.feeder || '-' },
    { label: 'Installed', value: customerInfo?.installDate || '-' },
    { label: 'Min Recharge', value: customerInfo?.minRecharge ? `৳${customerInfo.minRecharge}` : '-' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
    >
      <div className="px-6 py-6 border-b border-[var(--color-outline)] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{customerInfo?.name || 'Customer'}</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">
            {customerInfo?.address || 'Nesco Prepaid Customer'}
          </p>
        </motion.div>
        <div className="flex items-center gap-3 flex-wrap">
          {!isSaved && onSave && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptic(); onSave() }}
              className="px-4 py-2 rounded-xl font-medium text-sm border border-[var(--color-success)] bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {t('Save Meter')}
            </motion.button>
          )}
          <ShareButton meterNo={meterNo} provider={data.provider} t={t} />
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { haptic(); onReset() }}
            className="px-4 py-2 rounded-xl font-medium text-sm bg-[var(--color-ink)] text-[var(--color-base)] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            {t('Change Meter')}
          </motion.button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--color-outline)]">
        {fields.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="p-5 bg-[var(--color-surface)]"
          >
            <div className="text-sm text-[var(--color-ink)]/50 mb-1">{f.label}</div>
            <div className="text-base font-semibold text-[var(--color-ink)] break-words">{f.value}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
