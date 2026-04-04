import { useState, useEffect, useRef } from 'react'

export default function LazySection({ children, height = 320, className = '' }) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('print').matches
  })
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)

    const onBeforePrint = () => setVisible(true)
    window.addEventListener('beforeprint', onBeforePrint)

    return () => {
      observer.disconnect()
      window.removeEventListener('beforeprint', onBeforePrint)
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
