import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const THRESHOLD = 80

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY > 5) return
    startY.current = e.touches[0].clientY
    isPulling.current = true
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || refreshing) return
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current
    if (diff > 0 && window.scrollY <= 0) {
      const distance = Math.min(diff * 0.5, 120)
      setPullDistance(distance)
      setPulling(true)
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true)
      try {
        await onRefresh()
      } catch {}
      setRefreshing(false)
    }
    setPulling(false)
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {(pulling || refreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: refreshing ? 48 : pullDistance }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
              transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
              className={`w-6 h-6 border-2 border-[var(--color-outline)] rounded-full ${
                pullDistance >= THRESHOLD ? 'border-t-[var(--color-nesco)]' : 'border-t-[var(--color-ink)]/30'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}
