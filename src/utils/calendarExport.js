function formatICSDate(dateStr) {
  // Handle formats like "01-JAN-2025" or "2025-01-15 10:30:00"
  let d
  if (/^\d{2}-[A-Z]{3}-\d{4}/.test(dateStr)) {
    d = new Date(dateStr.replace(/(\d{2})-([A-Z]{3})-(\d{4})/, '$3-$2-$1'))
  } else {
    d = new Date(dateStr)
  }
  if (isNaN(d.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function escapeICS(text) {
  return String(text || '').replace(/[,;\\]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}

export function exportRechargesAsICS(rechargeHistory, provider = 'nesco') {
  const events = rechargeHistory
    .map((r) => {
      const dateStr = formatICSDate(r.date)
      if (!dateStr) return null
      const summary = `Recharge ৳${r.rechargeAmount} - ${(provider || 'nesco').toUpperCase()}`
      const description = [
        `Amount: ৳${r.rechargeAmount}`,
        `Electricity: ৳${r.electricity || 0}`,
        `kWh: ${r.probableKwh || 0}`,
        `Token: ${r.tokenNo || 'N/A'}`,
        `Status: ${r.status || 'Unknown'}`,
        `Medium: ${r.medium || 'Unknown'}`,
      ].join('\\n')

      return [
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:${escapeICS(summary)}`,
        `DESCRIPTION:${description}`,
        `UID:recharge-${r.serial || Math.random()}-${dateStr}@meter-dashboard`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .filter(Boolean)

  if (events.length === 0) return

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meter Dashboard//Recharge History//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recharges-${provider}.ics`
  link.click()
  URL.revokeObjectURL(url)
}
