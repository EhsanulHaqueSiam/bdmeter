const DAY_MS = 24 * 60 * 60 * 1000

const RECENT_WINDOW_OPTIONS = [7, 9, 12, 14]
const MIN_ACTIVE_DAYS = 3
const ACTIVE_MEDIAN_RATIO = 0.35
const MIN_ACTIVE_TAKA = 1
const MIN_ACTIVE_KWH = 0.05
const RECHARGE_WINDOW = 10

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function quantile(sortedAsc, q) {
  if (!sortedAsc.length) return 0
  if (sortedAsc.length === 1) return sortedAsc[0]
  const pos = (sortedAsc.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const left = sortedAsc[base]
  const right = sortedAsc[Math.min(sortedAsc.length - 1, base + 1)]
  return left + (right - left) * rest
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

function stdDev(values) {
  if (values.length < 2) return 0
  const avg = average(values)
  const variance = values.reduce((sum, n) => {
    const d = n - avg
    return sum + (d * d)
  }, 0) / values.length
  return Math.sqrt(variance)
}

function coeffVariation(values) {
  const avg = average(values)
  if (!(avg > 0)) return 0
  return stdDev(values) / avg
}

function ema(values, alpha = 0.45) {
  if (!values.length) return 0
  let acc = values[0]
  for (let i = 1; i < values.length; i += 1) {
    acc = (alpha * values[i]) + ((1 - alpha) * acc)
  }
  return acc
}

function trendSlope(values) {
  const n = values.length
  if (n < 2) return 0

  const meanX = (n - 1) / 2
  const meanY = values.reduce((sum, y) => sum + y, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX
    numerator += dx * (values[i] - meanY)
    denominator += dx * dx
  }
  if (denominator === 0) return 0
  return numerator / denominator
}

function filterOutliersIqr(values) {
  if (values.length < 4) return values
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  const lower = q1 - (1.5 * iqr)
  const upper = q3 + (1.5 * iqr)
  const kept = values.filter((v) => v >= lower && v <= upper)
  return kept.length >= 2 ? kept : values
}

function clampByQuantiles(value, samples, lowQ = 0.1, highQ = 0.9, lowPad = 0.8, highPad = 1.2) {
  if (!samples.length) return value
  const sorted = [...samples].sort((a, b) => a - b)
  const low = quantile(sorted, lowQ) * lowPad
  const high = quantile(sorted, highQ) * highPad
  const min = Math.min(low, high)
  const max = Math.max(low, high)
  return clamp(value, min, max)
}

function parseIsoDay(value) {
  const text = String(value || '').trim()
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    return Date.UTC(year, month, day)
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function parseRechargeDate(value) {
  if (!value) return null
  const normalized = String(value).replace(/(\d{2})-([A-Z]{3})-(\d{4})/, '$3-$2-$1')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthRateFromUsage(monthlyUsage = []) {
  const latest = Array.isArray(monthlyUsage) ? monthlyUsage[0] : null
  const monthTaka = toNumber(latest?.usedElectricity)
  const monthKwh = toNumber(latest?.usedKwh)
  if (monthTaka > 0 && monthKwh > 0) return monthTaka / monthKwh
  return 0
}

function selectRecentWindow(dailyRates = []) {
  if (!dailyRates.length) return 0

  const candidates = RECENT_WINDOW_OPTIONS
    .filter((size) => size <= dailyRates.length)
    .concat([Math.min(9, dailyRates.length)])

  let best = null
  for (const size of candidates) {
    const recent = dailyRates.slice(-size)
    const positives = recent.filter((row) => row.dailyTaka > 0 || row.dailyKwh > 0)
    if (positives.length < 2) continue

    const takaSeries = positives.map((row) => row.dailyTaka).filter((n) => n > 0)
    if (takaSeries.length < 2) continue

    const sortedTaka = [...takaSeries].sort((a, b) => a - b)
    const p25Taka = quantile(sortedTaka, 0.25)
    const p50Taka = quantile(sortedTaka, 0.5)
    const activeTakaThreshold = Math.max(MIN_ACTIVE_TAKA, p25Taka * 0.85, p50Taka * ACTIVE_MEDIAN_RATIO)
    const active = positives.filter((row) => row.dailyTaka >= activeTakaThreshold || row.dailyKwh >= MIN_ACTIVE_KWH)
    const activeCount = active.length

    const cv = coeffVariation(takaSeries)
    const stability = 1 - clamp(cv / 1.5, 0, 1) // lower volatility => higher stability
    const activeRatio = activeCount / size
    const sampleScore = clamp(activeCount / 6, 0, 1)
    const recencyPenalty = clamp((size - 7) / 12, 0, 1) * 0.06
    const score = (stability * 0.5) + (sampleScore * 0.35) + (activeRatio * 0.15) - recencyPenalty

    if (!best || score > best.score) {
      best = { size, score }
    }
  }

  return best?.size || Math.min(9, dailyRates.length)
}

function estimateFromDailyConsumption(dailyConsumption = [], monthlyUsage = []) {
  if (!Array.isArray(dailyConsumption) || dailyConsumption.length < 2) return null

  const sorted = [...dailyConsumption].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  const dailyRates = []

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const prevDay = parseIsoDay(prev?.date)
    const currDay = parseIsoDay(curr?.date)
    if (prevDay == null || currDay == null) continue

    const daySpan = Math.max(1, Math.round((currDay - prevDay) / DAY_MS))
    if (daySpan <= 0) continue

    const takaDiff = toNumber(curr?.consumedTaka) - toNumber(prev?.consumedTaka)
    const kwhDiff = toNumber(curr?.consumedUnit) - toNumber(prev?.consumedUnit)

    // Skip reset jumps (for example month transitions where cumulative counters restart).
    if (takaDiff < 0 || kwhDiff < 0) continue

    dailyRates.push({
      dailyTaka: takaDiff / daySpan,
      dailyKwh: kwhDiff / daySpan,
    })
  }

  if (!dailyRates.length) return null

  const selectedWindow = selectRecentWindow(dailyRates)
  const recent = dailyRates.slice(-selectedWindow)
  const positive = recent.filter((row) => row.dailyTaka > 0 || row.dailyKwh > 0)
  if (!positive.length) return null

  const takaValues = positive.map((row) => row.dailyTaka).filter((n) => n > 0).sort((a, b) => a - b)
  const kwhValues = positive.map((row) => row.dailyKwh).filter((n) => n > 0).sort((a, b) => a - b)

  const p25Taka = quantile(takaValues, 0.25)
  const medianTaka = quantile(takaValues, 0.5)
  const p25Kwh = quantile(kwhValues, 0.25)
  const medianKwh = quantile(kwhValues, 0.5)
  const activeTakaThreshold = Math.max(MIN_ACTIVE_TAKA, p25Taka * 0.85, medianTaka * ACTIVE_MEDIAN_RATIO)
  const activeKwhThreshold = Math.max(MIN_ACTIVE_KWH, p25Kwh * 0.85, medianKwh * ACTIVE_MEDIAN_RATIO)

  const active = positive.filter((row) => (
    row.dailyTaka >= activeTakaThreshold || row.dailyKwh >= activeKwhThreshold
  ))

  const selected = active.length >= Math.min(MIN_ACTIVE_DAYS, positive.length) ? active : positive
  const takaSeries = selected.map((row) => row.dailyTaka).filter((n) => n > 0)
  const kwhSeries = selected.map((row) => row.dailyKwh).filter((n) => n > 0)
  if (takaSeries.length < 2) return null

  const burnCv = coeffVariation(takaSeries)
  const burnTrendWeight = clamp(1 - (burnCv * 0.45), 0.3, 1)
  const smoothedTaka = ema(takaSeries, 0.45)
  const projectedTaka = smoothedTaka + (trendSlope(takaSeries) * burnTrendWeight)
  const trendTaka = clampByQuantiles(
    projectedTaka,
    takaSeries,
    0.1,
    0.9,
    0.75,
    1.3,
  )

  const kwhCv = coeffVariation(kwhSeries)
  const kwhTrendWeight = clamp(1 - (kwhCv * 0.45), 0.25, 1)
  const smoothedKwh = ema(kwhSeries, 0.45)
  const projectedKwh = smoothedKwh + (trendSlope(kwhSeries) * kwhTrendWeight)
  const trendKwh = kwhSeries.length
    ? clampByQuantiles(projectedKwh, kwhSeries, 0.1, 0.9, 0.75, 1.3)
    : 0

  const rateSeries = selected
    .filter((row) => row.dailyTaka > 0 && row.dailyKwh > MIN_ACTIVE_KWH)
    .map((row) => row.dailyTaka / row.dailyKwh)
    .filter((n) => Number.isFinite(n) && n > 0)

  const cleanRateSeries = filterOutliersIqr(rateSeries)
  const rateCv = coeffVariation(cleanRateSeries)
  const rateTrendWeight = clamp(1 - (rateCv * 0.5), 0.2, 1)
  const smoothedRate = ema(cleanRateSeries, 0.4)
  const projectedRate = smoothedRate + (trendSlope(cleanRateSeries) * rateTrendWeight)
  const trendRate = cleanRateSeries.length
    ? clampByQuantiles(projectedRate, cleanRateSeries, 0.1, 0.9, 0.85, 1.15)
    : 0

  const modeledTaka = trendKwh > 0 && trendRate > 0
    ? trendKwh * trendRate
    : trendTaka
  const rateTrust = clamp(1 - (rateCv * 0.5), 0.25, 0.75)
  const blendedTaka = ((1 - rateTrust) * trendTaka) + (rateTrust * modeledTaka)
  const dailyTaka = clampByQuantiles(blendedTaka, takaSeries, 0.1, 0.9, 0.75, 1.35)
  if (!(dailyTaka > 0)) return null

  const monthRate = monthRateFromUsage(monthlyUsage)
  const trendRateWeight = clamp(1 - (rateCv * 0.45), 0.35, 0.8)
  const blendedRate = trendRate > 0 && monthRate > 0
    ? (trendRateWeight * trendRate) + ((1 - trendRateWeight) * monthRate)
    : trendRate || monthRate || 0
  const dailyKwh = trendKwh > 0
    ? trendKwh
    : blendedRate > 0
      ? dailyTaka / blendedRate
      : 0
  const effectiveRate = dailyKwh > MIN_ACTIVE_KWH
    ? (dailyTaka / dailyKwh)
    : blendedRate

  return {
    dailyTaka,
    dailyKwh,
    effectiveRate,
    dataSource: `Active-day trend (last ${recent.length}d)`,
    dataPoints: selected.length,
    windowDays: recent.length,
    activeDays: selected.length,
    confidence: clamp(1 - ((burnCv * 0.35) + (rateCv * 0.25)), 0.2, 0.95),
  }
}

function estimateFromMonthlyUsage(monthlyUsage = []) {
  if (!Array.isArray(monthlyUsage) || !monthlyUsage.length) return null

  const latest = monthlyUsage[0]
  const monthTaka = toNumber(latest?.usedElectricity)
  const monthKwh = toNumber(latest?.usedKwh)
  if (!(monthTaka > 0)) return null

  const daysInMonth = 30
  const effectiveRate = monthKwh > 0 ? monthTaka / monthKwh : 0
  return {
    dailyTaka: monthTaka / daysInMonth,
    dailyKwh: monthKwh > 0 ? monthKwh / daysInMonth : 0,
    effectiveRate,
    dataSource: 'Monthly avg',
    dataPoints: daysInMonth,
    windowDays: daysInMonth,
    activeDays: daysInMonth,
    confidence: 0.45,
  }
}

function estimateFromRechargeHistory(rechargeHistory = []) {
  if (!Array.isArray(rechargeHistory) || rechargeHistory.length < 2) return null

  const rows = rechargeHistory
    .map((row) => ({
      amount: toNumber(row?.rechargeAmount),
      date: parseRechargeDate(row?.date),
    }))
    .filter((row) => row.date && row.amount > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, RECHARGE_WINDOW)

  if (rows.length < 2) return null

  const newest = rows[0].date
  const oldest = rows[rows.length - 1].date
  const daySpan = (newest - oldest) / DAY_MS
  if (!(daySpan > 0)) return null

  const totalSpent = rows.reduce((sum, row) => sum + row.amount, 0)
  if (!(totalSpent > 0)) return null

  return {
    dailyTaka: totalSpent / daySpan,
    dailyKwh: 0,
    effectiveRate: 0,
    dataSource: 'Recharge pattern',
    dataPoints: rows.length,
    windowDays: Math.round(daySpan),
    activeDays: rows.length,
    confidence: 0.3,
  }
}

export function estimateDailyBurn({ dailyConsumption, monthlyUsage, rechargeHistory }) {
  return (
    estimateFromDailyConsumption(dailyConsumption, monthlyUsage) ||
    estimateFromMonthlyUsage(monthlyUsage) ||
    estimateFromRechargeHistory(rechargeHistory) ||
    null
  )
}
