import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic } from '../utils/haptic'

const STORAGE_KEY = 'onboarding_done'

const steps = [
  {
    titleKey: 'Enter your meter number',
    descKey: 'Type your prepaid meter number to get started. You can find it on your meter or bill.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    titleKey: 'Auto-detect provider',
    descKey: 'Just enter your account or meter number. We detect NESCO or DESCO automatically.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    titleKey: 'Save meters for quick access',
    descKey: 'Meters you look up are automatically saved. Set a default meter to load it on every visit.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
  },
  {
    titleKey: 'Install as app',
    descKey: 'For the best experience, install this as a PWA. Look for the install prompt in your browser.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
]

export default function OnboardingTour({ t }) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShow(true)
      }
    } catch {}
  }, [])

  const handleDone = () => {
    setShow(false)
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleDone()
    }
  }

  const handleSkip = () => {
    handleDone()
  }

  if (!show) return null

  const current = steps[step]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-xl p-8 max-w-sm w-full text-center"
        >
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: i === step ? 1.3 : 1 }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-[var(--color-nesco)]' : i < step ? 'bg-[var(--color-success)]' : 'bg-[var(--color-outline)]'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-surface-dim)] flex items-center justify-center text-[var(--color-ink)]"
          >
            {current.icon}
          </motion.div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2 tracking-tight">
            {t(current.titleKey)}
          </h3>
          <p className="text-sm text-[var(--color-ink)]/60 mb-8 leading-relaxed">
            {t(current.descKey)}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { haptic(); handleSkip() }}
              className="px-4 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              {t('Skip')}
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptic(); handleNext() }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-ink)] text-[var(--color-canvas)] cursor-pointer"
            >
              {step < steps.length - 1 ? t('Next') : t('Get Started')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
