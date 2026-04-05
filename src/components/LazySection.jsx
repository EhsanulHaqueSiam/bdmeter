import { useState, useEffect, useRef } from 'react'

export default function LazySection({ children, height = 320, className = '' }) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    if (typeof window.IntersectionObserver !== 'function') return true
    return window.matchMedia('print').matches
  })
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const media = window.matchMedia('print')
    const fallbackTimer = window.setTimeout(() => setVisible(true), 1800)

    if (typeof window.IntersectionObserver !== 'function') {
      window.clearTimeout(fallbackTimer)
      return () => {}
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          window.clearTimeout(fallbackTimer)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)

    const onBeforePrint = () => setVisible(true)
    const onPrintMediaChange = () => {
      if (media.matches) setVisible(true)
    }
    window.addEventListener('beforeprint', onBeforePrint)
    media.addEventListener?.('change', onPrintMediaChange)
    media.addListener?.(onPrintMediaChange)

    return () => {
      window.clearTimeout(fallbackTimer)
      observer.disconnect()
      window.removeEventListener('beforeprint', onBeforePrint)
      media.removeEventListener?.('change', onPrintMediaChange)
      media.removeListener?.(onPrintMediaChange)
    }
  }, [])

  if (visible) {
    return <div ref={ref} className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm animate-pulse ${className}`}
      style={{ minHeight: height }}
      aria-hidden="true"
    />
  )
}
