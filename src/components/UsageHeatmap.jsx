import { useState } from 'react'
import { motion } from 'framer-motion'

function getIntensityColor(value, min, max) {
  if (value <= 0) return 'var(--color-surface-dim)'
  const range = max - min || 1
  const ratio = (value - min) / range
  // 5 levels of green intensity
  if (ratio < 0.2) return '#d1fae5'
  if (ratio < 0.4) return '#6ee7b7'
  if (ratio < 0.6) return '#34d399'
  if (ratio < 0.8) return '#10b981'
  return '#059669'
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function UsageHeatmap({ dailyConsumption, t }) {
  const [tooltip, setTooltip] = useState(null)

  if (!dailyConsumption || dailyConsumption.length < 2) return null

  // Sort by date and compute daily diffs (values are cumulative)
  const sorted = [...dailyConsumption].sort((a, b) => a.date.localeCompare(b.date))

  const dailyData = []
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].consumedUnit - sorted[i - 1].consumedUnit
    const takaDiff = sorted[i].consumedTaka - sorted[i - 1].consumedTaka
    dailyData.push({
      date: sorted[i].date,
      kwh: Math.max(0, diff),
      taka: Math.max(0, takaDiff),
    })
  }

  // Take last 90 days
  const recent = dailyData.slice(-90)
  if (recent.length === 0) return null

  const values = recent.map(d => d.kwh).filter(v => v > 0)
  const min = values.length > 0 ? Math.min(...values) : 0
  const max = values.length > 0 ? Math.max(...values) : 1

  // Build a grid: rows = days of week (0=Sun..6=Sat), cols = weeks
  // Find the start date and pad to align to Sunday
  const startDate = new Date(recent[0].date)
  const startDay = startDate.getDay()

  // Create date map for quick lookup
  const dateMap = {}
  recent.forEach(d => { dateMap[d.date] = d })

  // Build the grid
  const grid = []
  const firstDate = new Date(startDate)
  firstDate.setDate(firstDate.getDate() - startDay) // rewind to Sunday

  const endDate = new Date(recent[recent.length - 1].date)
  const totalDays = Math.ceil((endDate - firstDate) / (1000 * 60 * 60 * 24)) + 1
  const weeks = Math.ceil(totalDays / 7)

  for (let w = 0; w < weeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(firstDate)
      cellDate.setDate(cellDate.getDate() + w * 7 + d)
      const dateStr = cellDate.toISOString().split('T')[0]
      const data = dateMap[dateStr]
      week.push({
        date: dateStr,
        kwh: data?.kwh || 0,
        taka: data?.taka || 0,
        hasData: !!data,
      })
    }
    grid.push(week)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{t('Usage Heatmap')}</h3>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          {t('Daily consumption intensity')} ({recent.length} {t('days')})
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1 pt-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[14px] flex items-center text-[10px] text-[var(--color-ink-muted)] font-medium leading-none">
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <div
                  key={`${wi}-${di}`}
                  className="w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-transform hover:scale-125"
                  style={{
                    backgroundColor: cell.hasData
                      ? getIntensityColor(cell.kwh, min, max)
                      : 'var(--color-outline)',
                    opacity: cell.hasData ? 1 : 0.3,
                  }}
                  onMouseEnter={() => setTooltip(cell)}
                  onMouseLeave={() => setTooltip(null)}
                  title={cell.hasData ? `${cell.date}: ${cell.kwh.toFixed(1)} kWh` : cell.date}
                  role="gridcell"
                  aria-label={cell.hasData ? `${cell.date}: ${cell.kwh.toFixed(1)} kWh consumed` : `${cell.date}: no data`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] text-[var(--color-ink-muted)]">{t('Less')}</span>
        {['var(--color-surface-dim)', '#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#059669'].map((color, i) => (
          <div
            key={i}
            className="w-[12px] h-[12px] rounded-[2px]"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-[var(--color-ink-muted)]">{t('More')}</span>
      </div>

      {/* Tooltip display */}
      {tooltip && tooltip.hasData && (
        <div className="mt-3 text-sm text-[var(--color-ink)]/70">
          <span className="font-medium text-[var(--color-ink)]">{tooltip.date}</span>
          : {tooltip.kwh.toFixed(2)} kWh, &#2547;{tooltip.taka.toFixed(2)}
        </div>
      )}
    </motion.div>
  )
}
