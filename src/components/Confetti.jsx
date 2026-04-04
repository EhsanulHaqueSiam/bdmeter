import { motion } from 'framer-motion'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4']
const SHAPES = ['circle', 'square']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => {
    const angle = randomBetween(0, Math.PI * 2)
    const distance = randomBetween(60, 180)
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance
    const color = COLORS[i % COLORS.length]
    const shape = SHAPES[i % SHAPES.length]
    const size = randomBetween(4, 8)
    const rotation = randomBetween(0, 720)
    const delay = randomBetween(0, 0.15)

    return { id: i, x, y, color, shape, size, rotation, delay }
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 0, rotate: p.rotation }}
          transition={{ duration: 1.2, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
