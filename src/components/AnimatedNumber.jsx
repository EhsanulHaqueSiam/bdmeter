import { useState, useEffect, useRef } from 'react'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 800 }) {
  const [display, setDisplay] = useState('0')
  const rafRef = useRef(null)
  const prevValueRef = useRef(0)

  // Extract numeric value from the string
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = numericValue
    const startTime = performance.now()

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    function animate(currentTime) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const current = startValue + (endValue - startValue) * easedProgress

      setDisplay(current.toFixed(decimals))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [numericValue, decimals, duration])

  return (
    <span>
      {prefix}{Number(display).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}
