import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic } from '../utils/haptic'

const PROVIDERS = [
  {
    name: 'bKash',
    deepLinks: { android: 'bkash://', ios: 'bkash://' },
    webUrl: 'https://www.bkash.com/en/products-services/pay-bill',
    color: '#E2136E',
  },
  {
    name: 'Nagad',
    deepLinks: { android: 'nagad://', ios: 'nagad://' },
    webUrl: 'https://nagad.com.bd/',
    color: '#F6921E',
  },
  {
    name: 'Rocket',
    deepLinks: { android: 'rocket://', ios: 'rocket://' },
    webUrl: 'https://www.dutchbanglabank.com/rocket/rocket.html',
    color: '#8B2F8B',
  },
  {
    name: 'Upay',
    deepLinks: { android: 'upay://', ios: 'upay://' },
    webUrl: 'https://www.upaybd.com/',
    color: '#00A651',
  },
]

function isLikelyMobile() {
  const ua = navigator.userAgent || ''
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /Android|iPhone|iPad|iPod/i.test(ua) || touchMac
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent || '')
}

function isIOS() {
  const ua = navigator.userAgent || ''
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPhone|iPad|iPod/i.test(ua) || touchMac
}

function getMobileDeepLink(provider) {
  if (isAndroid()) return provider.deepLinks?.android || ''
  if (isIOS()) return provider.deepLinks?.ios || ''
  return ''
}

function appendMeterQuery(url, meterNo) {
  if (!meterNo) return url
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('meter', meterNo)
    return parsed.toString()
  } catch {
    return url
  }
}

async function copyText(text) {
  if (!text) return false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to textarea fallback.
  }

  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  } catch {
    return false
  }
}

export default function RechargeLink({ meterNo, t }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const normalizedMeter = String(meterNo || '').replace(/\D/g, '')

  const copyMeter = async (value = normalizedMeter) => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    return ok
  }

  const openProvider = (provider) => {
    haptic()
    setOpen(false)

    const fallbackUrl = appendMeterQuery(provider.webUrl, normalizedMeter)
    // Keep user-gesture chain for deep-link launch; don't await clipboard.
    void copyMeter()

    if (!isLikelyMobile()) {
      const tab = window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      if (!tab) window.location.assign(fallbackUrl)
      return
    }

    const deepLink = getMobileDeepLink(provider)
    if (!deepLink) {
      window.location.assign(fallbackUrl)
      return
    }

    let fallbackTimer = null
    const clearFallback = () => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('pagehide', onPageHide)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearFallback()
      }
    }
    const onBlur = () => clearFallback()
    const onPageHide = () => clearFallback()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('pagehide', onPageHide)
    fallbackTimer = window.setTimeout(() => {
      clearFallback()
      window.location.assign(fallbackUrl)
    }, 2200)

    try {
      window.location.assign(deepLink)
    } catch {
      clearFallback()
      window.location.assign(fallbackUrl)
    }
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { haptic(); setOpen(!open) }}
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
            className="absolute top-full mt-2 left-0 w-56 max-w-[calc(100vw-1.5rem)] sm:left-auto sm:right-0 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl shadow-lg overflow-hidden z-[70]"
          >
            {/* Copy meter number */}
            <button
              onClick={() => { haptic(); copyMeter() }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer flex items-center justify-between border-b border-[var(--color-outline)]"
            >
              <span className="font-mono text-xs">{meterNo}</span>
              <span className="text-[10px] font-medium text-[var(--color-ink-muted)]">
                {copied ? t('Copied') : t('Copy')}
              </span>
            </button>
            <div className="px-4 py-2 text-[10px] text-[var(--color-ink-muted)] border-b border-[var(--color-outline)]">
              Meter copied automatically before opening app.
            </div>
            {PROVIDERS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] hover:translate-x-0.5 transition-all cursor-pointer flex items-center gap-3 border-b border-[var(--color-outline)] last:border-0"
                onClick={() => openProvider(p)}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
                <svg className="w-3 h-3 ml-auto text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
