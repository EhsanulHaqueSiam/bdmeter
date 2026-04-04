const MONTH_MAP = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
}

export default function MonthlyTable({ monthlyUsage }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base">Monthly Breakdown</h3>
        <p className="text-xs text-slate-400 mt-0.5">Detailed cost and usage per month</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Month</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recharge</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Electricity</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">kWh</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Demand</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">VAT</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Total Deduction</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyUsage.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-700">{MONTH_MAP[m.month] || m.month}</span>
                  <span className="text-slate-400 ml-1">{m.year}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">৳{m.totalRecharge.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-600">৳{m.usedElectricity.toFixed(0)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-amber-600">{m.usedKwh}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">৳{m.demandCharge}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">৳{m.vat.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">৳{m.totalUsage.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold ${m.endBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
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
