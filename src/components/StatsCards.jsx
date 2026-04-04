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
      label: 'Current Balance',
      value: `৳${balance.toFixed(2)}`,
      sub: customerInfo?.balanceTime ? `as of ${customerInfo.balanceTime}` : 'latest',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Last Recharge',
      value: lastRecharge ? `৳${lastRecharge.rechargeAmount}` : 'N/A',
      sub: lastRecharge ? `${lastRecharge.date} via ${lastRecharge.medium}` : '',
      badge: lastRecharge ? lastRecharge.status : null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      label: 'This Month Usage',
      value: latestMonth ? `${latestMonth.usedKwh} kWh` : 'N/A',
      sub: latestMonth ? `৳${latestMonth.usedElectricity.toFixed(0)} electricity cost` : '',
      change: kwhChange,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Cost per kWh',
      value: costPerKwh > 0 ? `৳${costPerKwh.toFixed(2)}` : 'N/A',
      sub: `avg monthly spend ৳${avgMonthly.toFixed(0)}`,
      change: spendChange,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      ),
      gradient: 'from-rose-500 to-pink-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.04] rounded-full -translate-x-4 -translate-y-4 group-hover:opacity-[0.08] transition-opacity`} />
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg`}>
              {card.icon}
            </div>
            {card.badge && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                card.badge === 'Success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${card.badge === 'Success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {card.badge === 'Success' ? 'Auto-applied' : 'Enter PIN'}
              </span>
            )}
            {card.change !== undefined && card.change !== null && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                card.change <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
              }`}>
                {card.change <= 0 ? '↓' : '↑'} {Math.abs(card.change).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">{card.label}</div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
