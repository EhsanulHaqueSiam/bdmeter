import { useState } from 'react'

export default function RechargeHistory({ rechargeHistory }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rechargeHistory : rechargeHistory.slice(0, 10)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Recharge History</h3>
          <p className="text-xs text-slate-400 mt-0.5">{rechargeHistory.length} transactions found</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
            rechargeHistory[0]?.status === 'Success'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              rechargeHistory[0]?.status === 'Success' ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
            Last: {rechargeHistory[0]?.status || '-'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Electricity</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">kWh</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">VAT</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Medium</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-slate-400 font-medium">{r.serial}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-700 text-xs">{r.date}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]" title={r.tokenNo}>{r.tokenNo}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-slate-900">৳{r.rechargeAmount}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">৳{r.electricity.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{r.probableKwh}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">৳{r.vat.toFixed(2)}</td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">{r.medium}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    r.status === 'Success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : r.status === 'Failed'
                        ? 'bg-rose-50 text-rose-500'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {r.status || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rechargeHistory.length > 10 && (
        <div className="px-5 py-3 border-t border-slate-100 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
          >
            {expanded ? 'Show Less' : `Show All ${rechargeHistory.length} Transactions`}
          </button>
        </div>
      )}
    </div>
  )
}
