const MONTH_MAP = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
}

export default function MonthlyTable({ monthlyUsage }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden">
      <div className="px-6 py-6 border-b border-[var(--color-outline)]">
        <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">Monthly Breakdown</h3>
        <p className="text-sm text-[var(--color-ink)]/70 mt-1">Cost and usage per month</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50/50 text-[var(--color-ink)]/70 font-medium">
            <tr>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">Month</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Recharge</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden sm:table-cell">Rebate</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden sm:table-cell">Demand</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden md:table-cell">Rent</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden md:table-cell">VAT</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden lg:table-cell">PFC</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden lg:table-cell">Dues</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden sm:table-cell">Total Ded</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {monthlyUsage.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-[var(--color-ink)]">
                  <span className="font-medium">{MONTH_MAP[m.month] || m.month}</span>
                  <span className="text-[var(--color-ink)]/50 ml-1.5">{m.year.slice(-2)}</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-[var(--color-ink)]">৳{m.totalRecharge.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/80">৳{m.usedElectricity.toFixed(0)}</td>
                <td className="px-6 py-4 text-right">
                  <span className="px-2.5 py-1 bg-gray-100 text-[var(--color-ink)] rounded-md text-xs font-medium">{m.usedKwh}</span>
                </td>
                <td className="px-6 py-4 text-right text-green-600 hidden sm:table-cell">
                  {m.rebate < 0 ? `৳${Math.abs(m.rebate).toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden sm:table-cell">৳{m.demandCharge}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden md:table-cell">৳{m.meterRent}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden md:table-cell">৳{m.vat.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden lg:table-cell">{m.pfcCharge > 0 ? `৳${m.pfcCharge}` : '-'}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden lg:table-cell">{m.paidDues > 0 ? `৳${m.paidDues}` : '-'}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/80 hidden sm:table-cell">৳{m.totalUsage.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${m.endBalance >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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
