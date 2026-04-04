import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const METERS_KEY = 'nesco_meters'

function exportData() {
  try {
    const meters = JSON.parse(localStorage.getItem(METERS_KEY) || '[]')
    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      meters,
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bdmeter-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

function validateImport(data) {
  if (!data || typeof data !== 'object') return false
  if (!Array.isArray(data.meters)) return false
  return data.meters.every(m =>
    m && typeof m.number === 'string' && m.number.length >= 8
  )
}

function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!validateImport(data)) {
          reject(new Error('Invalid backup file format'))
          return
        }
        // Merge with existing meters
        const existing = JSON.parse(localStorage.getItem(METERS_KEY) || '[]')
        const existingSet = new Set(existing.map(m => `${m.provider || 'nesco'}:${m.number}`))
        const newMeters = data.meters.filter(m => !existingSet.has(`${m.provider || 'nesco'}:${m.number}`))
        const merged = [...existing, ...newMeters]
        localStorage.setItem(METERS_KEY, JSON.stringify(merged))
        resolve(newMeters.length)
      } catch {
        reject(new Error('Could not parse file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export default function DataManager({ t }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const fileRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = () => {
    const ok = exportData()
    setStatus(ok ? t('Data exported') : t('Export failed'))
    setTimeout(() => setStatus(null), 2000)
    setOpen(false)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const count = await importData(file)
      setStatus(`${t('Imported')} ${count} ${t('meters')}`)
      setTimeout(() => { setStatus(null); window.location.reload() }, 1500)
    } catch (err) {
      setStatus(err.message)
      setTimeout(() => setStatus(null), 3000)
    }
    e.target.value = ''
    setOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface)] text-[var(--color-ink)] cursor-pointer hover:bg-[var(--color-surface-dim)] transition-colors"
        aria-label={t('Settings')}
        title={t('Settings')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-xl shadow-lg overflow-hidden z-50"
          >
            <button
              onClick={handleExport}
              className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {t('Export Data')}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)] transition-colors cursor-pointer border-t border-[var(--color-outline)] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {t('Import Data')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
        aria-label={t('Import backup file')}
      />

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-lg shadow-lg text-xs font-medium text-[var(--color-ink)] whitespace-nowrap z-50"
            role="status"
            aria-live="polite"
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
