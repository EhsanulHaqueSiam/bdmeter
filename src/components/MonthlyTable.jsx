const MONTH_MAP = {
  January: 'JAN', February: 'FEB', March: 'MAR', April: 'APR',
  May: 'MAY', June: 'JUN', July: 'JUL', August: 'AUG',
  September: 'SEP', October: 'OCT', November: 'NOV', December: 'DEC',
}

export default function MonthlyTable({ monthlyUsage }) {
  return (
    <div className="brutal-card overflow-hidden">
      <div className="px-6 py-5 brutal-border-b bg-[var(--color-surface-dim)]">
        <h3 className="font-black text-2xl uppercase tracking-tighter">MONTHLY BREAKDOWN</h3>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">COST AND USAGE PER MONTH</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono text-[11px] uppercase whitespace-nowrap">
          <thead>
            <tr className="bg-[var(--color-ink)] text-[var(--color-surface)] text-left">
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)]">MONTH</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right">RECHARGE</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right">ELEC</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right">KWH</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden sm:table-cell">REBATE</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden sm:table-cell">DEMAND</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden md:table-cell">RENT</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden md:table-cell">VAT</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden lg:table-cell">PFC</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden lg:table-cell">DUES</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden sm:table-cell">TOTAL DED</th>
              <th className="px-4 py-3 font-bold tracking-widest text-right">BALANCE</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[var(--color-ink)]">
            {monthlyUsage.map((m, i) => (
              <tr key={i} className="hover:bg-[var(--color-surface-dim)] transition-colors">
                <td className="px-4 py-3 font-bold border-r-2 border-[var(--color-ink)]">
                  <span>{MONTH_MAP[m.month] || m.month}</span>
                  <span className="opacity-50 ml-1">{m.year.slice(-2)}</span>
                </td>
                <td className="px-4 py-3 text-right font-black border-r-2 border-[var(--color-ink)]">৳{m.totalRecharge.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-bold opacity-80 border-r-2 border-[var(--color-ink)]">৳{m.usedElectricity.toFixed(0)}</td>
                <td className="px-4 py-3 text-right font-bold border-r-2 border-[var(--color-ink)]">
                  <span className="px-2 py-1 bg-[var(--color-warning)] text-[var(--color-ink)] brutal-border">{m.usedKwh}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-[var(--color-success)] border-r-2 border-[var(--color-ink)] hidden sm:table-cell">
                  {m.rebate < 0 ? `৳${Math.abs(m.rebate).toFixed(2)}` : '-'}
                </td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden sm:table-cell">৳{m.demandCharge}</td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden md:table-cell">৳{m.meterRent}</td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden md:table-cell">৳{m.vat.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden lg:table-cell">{m.pfcCharge > 0 ? `৳${m.pfcCharge}` : '-'}</td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden lg:table-cell">{m.paidDues > 0 ? `৳${m.paidDues}` : '-'}</td>
                <td className="px-4 py-3 text-right font-bold opacity-80 border-r-2 border-[var(--color-ink)] hidden sm:table-cell">৳{m.totalUsage.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-black">
                  <span className={`px-2 py-1 brutal-border ${m.endBalance >= 0 ? 'bg-[var(--color-success)] text-[var(--color-ink)]' : 'bg-[var(--color-danger)] text-white'}`}>
                    ৳{m.endBalance.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
