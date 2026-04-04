import { useState } from 'react'

function CopyButton({ text }) {
  const [status, setStatus] = useState('idle')
  const clean = String(text || '').replace(/\s/g, '')

  const copyText = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clean)
      } else {
        const el = document.createElement('textarea')
        el.value = clean
        el.setAttribute('readonly', '')
        el.style.position = 'absolute'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setStatus('copied')
    } catch {
      setStatus('failed')
    } finally {
      window.setTimeout(() => setStatus('idle'), 1500)
    }
  }

  return (
    <button
      onClick={copyText}
      className="ml-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--color-outline)] bg-white hover:bg-gray-50 text-[var(--color-ink)] text-xs font-medium transition-colors cursor-pointer"
      title="Copy Token"
    >
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Failed' : 'Copy'}
    </button>
  )
}

export default function RechargeHistory({ rechargeHistory }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rechargeHistory : rechargeHistory.slice(0, 10)

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden">
      <div className="px-6 py-6 border-b border-[var(--color-outline)] flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">History</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">{rechargeHistory.length} Transactions</p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            rechargeHistory[0]?.status === 'Success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              rechargeHistory[0]?.status === 'Success' ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            Last: {rechargeHistory[0]?.status === 'Success' ? 'Auto' : 'PIN'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50/50 text-[var(--color-ink)]/70 font-medium">
            <tr>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">#</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium">Date & Token</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Amount</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right">Elec</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden sm:table-cell">kWh</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden md:table-cell">VAT</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden lg:table-cell">Demand</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-right hidden lg:table-cell">Rebate</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-center hidden sm:table-cell">Medium</th>
              <th className="px-6 py-4 border-b border-[var(--color-outline)] font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline)]">
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-[var(--color-ink)]/70">{r.serial}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-[var(--color-ink)]">{r.date}</div>
                  <div className="flex items-center mt-1">
                    <span className="text-[var(--color-ink)]/60 truncate max-w-[150px]" title={r.tokenNo}>{r.tokenNo}</span>
                    {r.status === 'Failed' && <CopyButton text={r.tokenNo} />}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-[var(--color-ink)]">৳{r.rechargeAmount}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/80">৳{r.electricity.toFixed(0)}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)] hidden sm:table-cell">{r.probableKwh}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden md:table-cell">৳{r.vat.toFixed(0)}</td>
                <td className="px-6 py-4 text-right text-[var(--color-ink)]/60 hidden lg:table-cell">৳{r.demandCharge}</td>
                <td className="px-6 py-4 text-right text-green-600 hidden lg:table-cell">{r.rebate < 0 ? `৳${Math.abs(r.rebate).toFixed(0)}` : '-'}</td>
                <td className="px-6 py-4 text-center hidden sm:table-cell">
                  <span className="px-2.5 py-1 rounded-md bg-gray-100 text-[var(--color-ink)]/80 text-xs font-medium">{r.medium}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    r.status === 'Success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {r.status === 'Success' ? 'Auto' : 'PIN'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rechargeHistory.length > 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-4 text-sm font-medium text-[var(--color-ink)] hover:bg-gray-50 transition-colors border-t border-[var(--color-outline)] cursor-pointer"
        >
          {expanded ? 'Show Less' : `Show All ${rechargeHistory.length} Transactions`}
        </button>
      )}
    </div>
  )
}
