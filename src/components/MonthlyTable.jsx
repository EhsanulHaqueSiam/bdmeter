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
        <table className="min-w-[1200px] w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50/50 text-gray-500 font-medium">
            <tr>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium">Month</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Recharge</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">kWh</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Rebate</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Demand</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Rent</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">VAT</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">PFC</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Dues</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Total Ded</th>
              <th className="px-3 py-3 border-b border-[var(--color-outline)] font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {monthlyUsage.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-3 text-gray-900">
                  <span className="font-medium">{MONTH_MAP[m.month] || m.month}</span>
                  <span className="text-gray-500 ml-1">{m.year.slice(-2)}</span>
                </td>
                <td className="px-3 py-3 text-right font-medium text-gray-900">৳{m.totalRecharge.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-gray-600">৳{m.usedElectricity.toFixed(0)}</td>
                <td className="px-3 py-3 text-right">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">{m.usedKwh}</span>
                </td>
                <td className="px-3 py-3 text-right text-green-600">
                  {m.rebate < 0 ? `৳${Math.abs(m.rebate).toFixed(2)}` : '-'}
                </td>
                <td className="px-3 py-3 text-right text-gray-500">৳{m.demandCharge}</td>
                <td className="px-3 py-3 text-right text-gray-500">৳{m.meterRent}</td>
                <td className="px-3 py-3 text-right text-gray-500">৳{m.vat.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-gray-500">{m.pfcCharge > 0 ? `৳${m.pfcCharge}` : '-'}</td>
                <td className="px-3 py-3 text-right text-gray-500">{m.paidDues > 0 ? `৳${m.paidDues}` : '-'}</td>
                <td className="px-3 py-3 text-right text-gray-700">৳{m.totalUsage.toLocaleString()}</td>
                <td className="px-3 py-3 text-right">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${m.endBalance >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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
