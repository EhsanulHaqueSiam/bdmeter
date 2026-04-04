import { useState } from 'react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const clean = text.replace(/\s/g, '')
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(clean); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors cursor-pointer"
      title="Copy token number"
    >
      {copied ? (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Copied</>
      ) : (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg> PIN</>
      )}
    </button>
  )
}

export default function RechargeHistory({ rechargeHistory }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rechargeHistory : rechargeHistory.slice(0, 10)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Recharge History</h3>
          <p className="text-xs text-slate-400 mt-0.5">{rechargeHistory.length} transactions</p>
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
            Last: {rechargeHistory[0]?.status === 'Success' ? 'Auto-applied' : 'Enter PIN'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date & Token</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Electricity</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">kWh</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">VAT</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Demand</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Rebate</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Medium</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Remote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-slate-400 font-medium">{r.serial}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-700 text-xs">{r.date}</div>
                  <div className="flex items-center">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]" title={r.tokenNo}>{r.tokenNo}</span>
                    {r.status === 'Failed' && <CopyButton text={r.tokenNo} />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-slate-900">৳{r.rechargeAmount}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">৳{r.electricity.toFixed(0)}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{r.probableKwh}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">৳{r.vat.toFixed(0)}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell">৳{r.demandCharge}</td>
                <td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell">{r.rebate < 0 ? `৳${Math.abs(r.rebate).toFixed(0)}` : '-'}</td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">{r.medium}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    r.status === 'Success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {r.status === 'Success' ? (
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Auto</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> PIN</>
                    )}
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
