export default function StatsCards({ data }) {
  const { rechargeHistory, monthlyUsage, customerInfo } = data

  const lastRecharge = rechargeHistory[0]
  const latestMonth = monthlyUsage[0]
  const prevMonth = monthlyUsage[1]

  const avgMonthly = monthlyUsage.length > 0
    ? monthlyUsage.reduce((s, m) => s + m.totalRecharge, 0) / monthlyUsage.length
    : 0

  const balance = customerInfo?.balance
    ? parseFloat(customerInfo.balance.replace(/[^\d.-]/g, ''))
    : latestMonth?.endBalance || 0

  const costPerKwh = latestMonth && latestMonth.usedKwh > 0
    ? latestMonth.usedElectricity / latestMonth.usedKwh
    : 0

  // Month-over-month changes
  const kwhChange = latestMonth && prevMonth && prevMonth.usedKwh > 0
    ? ((latestMonth.usedKwh - prevMonth.usedKwh) / prevMonth.usedKwh * 100)
    : null

  const spendChange = latestMonth && prevMonth && prevMonth.totalRecharge > 0
    ? ((latestMonth.totalRecharge - prevMonth.totalRecharge) / prevMonth.totalRecharge * 100)
    : null

  const cards = [
    {
      label: 'BALANCE',
      value: `৳${balance.toFixed(2)}`,
      sub: customerInfo?.balanceTime ? `AS OF ${customerInfo.balanceTime}` : 'LATEST',
      bg: 'bg-[var(--color-success)]',
      text: 'text-[var(--color-ink)]'
    },
    {
      label: 'LAST RECHARGE',
      value: lastRecharge ? `৳${lastRecharge.rechargeAmount}` : 'N/A',
      sub: lastRecharge ? `${lastRecharge.date.toUpperCase()}` : '',
      badge: lastRecharge ? lastRecharge.status : null,
      bg: 'bg-[var(--color-nesco)]',
      text: 'text-white'
    },
    {
      label: 'MONTH USAGE',
      value: latestMonth ? `${latestMonth.usedKwh} kWh` : 'N/A',
      sub: latestMonth ? `৳${latestMonth.usedElectricity.toFixed(0)} ELEC COST` : '',
      change: kwhChange,
      bg: 'bg-[var(--color-warning)]',
      text: 'text-[var(--color-ink)]'
    },
    {
      label: 'COST / KWH',
      value: costPerKwh > 0 ? `৳${costPerKwh.toFixed(2)}` : 'N/A',
      sub: `AVG SPEND ৳${avgMonthly.toFixed(0)}`,
      change: spendChange,
      bg: 'bg-[var(--color-surface)]',
      text: 'text-[var(--color-ink)]'
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className={`brutal-card ${card.bg} ${card.text} flex flex-col justify-between p-6 hover:-translate-y-1 transition-transform`}>
          <div className="flex items-start justify-between mb-8">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 brutal-border bg-[var(--color-surface)] text-[var(--color-ink)]">
              {card.label}
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {card.badge && (
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 brutal-border text-[10px] font-bold font-mono uppercase bg-[var(--color-surface)] ${
                  card.badge === 'Success' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'
                }`}>
                  {card.badge === 'Success' ? 'AUTO' : 'PIN REQ'}
                </span>
              )}
              {card.change !== undefined && card.change !== null && (
                <span className={`inline-flex items-center gap-0.5 px-2 py-1 brutal-border text-[10px] font-bold font-mono bg-[var(--color-surface)] ${
                  card.change <= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                }`}>
                  {card.change <= 0 ? '↓' : '↑'} {Math.abs(card.change).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-mono text-3xl xl:text-4xl font-bold tracking-tighter mb-2">{card.value}</div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">{card.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
