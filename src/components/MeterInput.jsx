import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic } from '../utils/haptic'

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function MeterInput({ onSubmit, error, meters = [], onSwitchMeter, onRemoveMeter, onSetPrimary, onSetNickname, searchHistory = [], onClearHistory, t }) {
  const [meter, setMeter] = useState('')
  const [editingNickname, setEditingNickname] = useState(null)
  const [nicknameValue, setNicknameValue] = useState('')
  const nicknameInputRef = useRef(null)
  const maxLen = 12
  const validLengths = [8, 9, 10, 11, 12]
  const isValid = /^\d+$/.test(meter) && validLengths.includes(meter.length)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) {
      haptic()
      onSubmit(meter)
    }
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="w-full max-w-2xl mx-auto space-y-12"
      >
        <motion.div variants={fadeUp} className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--color-ink)]">
            {t('Check your grid')}
          </h2>
          <p className="text-base text-[var(--color-ink)]/60 font-medium">
            {t('Direct access to your prepaid electric analytics.')}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] font-medium uppercase tracking-wider">
            Provider auto-detected (NESCO / DESCO)
          </p>
        </motion.div>

        <motion.form variants={fadeUp} onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative flex items-center bg-[var(--color-surface)] rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-4 focus-within:ring-opacity-10 border-[var(--color-outline)] focus-within:border-[var(--color-nesco)] focus-within:ring-[var(--color-nesco)]"
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Account or Meter (8-12)"
              value={meter}
              onChange={(e) => setMeter(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
              className="w-full h-16 md:h-20 px-6 font-mono text-xl md:text-2xl font-semibold text-[var(--color-ink)] bg-transparent outline-none placeholder:text-[var(--color-ink-muted)] placeholder:font-sans placeholder:font-medium placeholder:text-base md:placeholder:text-lg"
              autoFocus={meters.length === 0}
              aria-label={t('Submit meter number')}
            />
            <motion.button
              type="submit"
              disabled={!isValid}
              whileHover={isValid ? { scale: 1.08 } : {}}
              whileTap={isValid ? { scale: 0.92 } : {}}
              aria-label={t('Submit meter number')}
              className={`absolute right-3 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl transition-all duration-300 ${
                isValid
                  ? 'bg-[var(--color-nesco)] text-white hover:opacity-90'
                  : 'bg-[var(--color-surface-dim)] text-[var(--color-ink-muted)] cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </motion.button>

            <AnimatePresence>
              {meter.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -bottom-8 left-6 pointer-events-none flex items-center gap-2"
                >
                  <span className={`text-xs font-mono font-medium ${isValid ? 'text-[var(--color-success)]' : 'text-[var(--color-ink-muted)]'}`}>
                    {meter.length} digits {isValid ? '✓ Valid' : '× Invalid length'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: [0, -5, 5, -5, 5, 0] }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-lg mx-auto mt-4 px-6 py-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium"
              role="alert"
              aria-live="polite"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Searches */}
        <AnimatePresence>
          {searchHistory.length > 0 && meters.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="pt-8 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {t('Recent Searches')}
                </h3>
                {onClearHistory && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                  >
                    {t('Clear')}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((s) => (
                  <motion.button
                    key={`${s.provider}:${s.number}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptic(); onSwitchMeter(s.number, s.provider || 'nesco') }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-mono font-medium bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${(s.provider || 'nesco') === 'desco' ? 'bg-[var(--color-desco)]' : 'bg-[var(--color-nesco)]'}`} />
                    {s.number}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Meters */}
        <AnimatePresence>
          {meters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="pt-16 max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {t('Recent Accounts')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {meters.map((m, i) => {
                  const meterKey = `${m.provider || 'nesco'}:${m.number}`
                  const isEditing = editingNickname === meterKey
                  return (
                    <motion.div
                      key={meterKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -3, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.08)' }}
                      whileTap={isEditing ? {} : { scale: 0.98 }}
                      className="group relative bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-2xl p-5 shadow-sm cursor-pointer"
                      onClick={() => { if (!isEditing) { haptic(); onSwitchMeter(m.number, m.provider || 'nesco') } }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (m.provider || 'nesco') === 'desco' ? 'bg-orange-50 text-[var(--color-desco)]' : 'bg-blue-50 text-[var(--color-nesco)]'
                        }`}>
                          {m.provider || 'nesco'}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit nickname button */}
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingNickname(meterKey)
                              setNicknameValue(m.nickname || '')
                              setTimeout(() => nicknameInputRef.current?.focus(), 50)
                            }}
                            className="text-[var(--color-ink-muted)] hover:text-[var(--color-nesco)] transition-colors p-1"
                            title={t('Edit nickname')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                          </motion.button>
                          {!m.primary && (
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); onSetPrimary(m.number, m.provider || 'nesco') }}
                              className="text-[var(--color-ink-muted)] hover:text-[var(--color-warning)] transition-colors p-1"
                              title={t('Set as Default')}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onRemoveMeter(m.number, m.provider || 'nesco') }}
                            className="text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] transition-colors p-1"
                            title={t('Remove')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </motion.button>
                        </div>
                      </div>
                      <div>
                        {/* Nickname display/edit */}
                        {isEditing ? (
                          <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={nicknameInputRef}
                              type="text"
                              value={nicknameValue}
                              onChange={(e) => setNicknameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onSetNickname?.(m.number, m.provider || 'nesco', nicknameValue)
                                  setEditingNickname(null)
                                } else if (e.key === 'Escape') {
                                  setEditingNickname(null)
                                }
                              }}
                              onBlur={() => {
                                onSetNickname?.(m.number, m.provider || 'nesco', nicknameValue)
                                setEditingNickname(null)
                              }}
                              placeholder={t('Set nickname')}
                              className="w-full px-2 py-1 text-sm font-medium rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-dim)] text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-nesco)]/20 placeholder:text-[var(--color-ink-muted)]"
                              maxLength={30}
                            />
                          </div>
                        ) : (
                          m.nickname && (
                            <div className="text-sm font-semibold text-[var(--color-ink)]/80 mb-1 truncate">{m.nickname}</div>
                          )
                        )}
                        <div className="font-mono text-xl font-semibold text-[var(--color-ink)] flex items-center gap-2">
                          {m.number}
                          {m.primary && (
                            <motion.span
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                              className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]"
                            />
                          )}
                        </div>
                        {m.name && <div className="text-sm font-medium text-[var(--color-ink)]/60 mt-1 truncate">{m.name}</div>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
