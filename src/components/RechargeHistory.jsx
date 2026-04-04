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
      className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 brutal-border bg-[var(--color-surface)] hover:bg-[var(--color-ink)] hover:text-[var(--color-surface)] font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
      title="COPY TOKEN"
    >
      {status === 'copied' ? '[COPIED]' : status === 'failed' ? '[FAILED]' : '[COPY PIN]'}
    </button>
  )
}

export default function RechargeHistory({ rechargeHistory }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rechargeHistory : rechargeHistory.slice(0, 10)

  return (
    <div className="brutal-card overflow-hidden">
      <div className="px-6 py-5 brutal-border-b flex items-end justify-between bg-[var(--color-surface-dim)]">
        <div>
          <h3 className="font-black text-2xl uppercase tracking-tighter">HISTORY</h3>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{rechargeHistory.length} TRANSACTIONS</p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 brutal-border text-[10px] font-mono font-bold uppercase bg-[var(--color-surface)] ${
            rechargeHistory[0]?.status === 'Success'
              ? 'text-[var(--color-success)]'
              : 'text-[var(--color-warning)]'
          }`}>
            <span className={`w-2 h-2 brutal-border ${
              rechargeHistory[0]?.status === 'Success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'
            }`} />
            LAST: {rechargeHistory[0]?.status === 'Success' ? 'AUTO' : 'PIN'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono text-[11px] uppercase whitespace-nowrap">
          <thead>
            <tr className="bg-[var(--color-ink)] text-[var(--color-surface)] text-left">
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)]">#</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)]">DATE & TOKEN</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right">AMOUNT</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right">ELEC</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden sm:table-cell">KWH</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden md:table-cell">VAT</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden lg:table-cell">DEMAND</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-right hidden lg:table-cell">REBATE</th>
              <th className="px-4 py-3 font-bold tracking-widest border-r-2 border-[var(--color-ink)] text-center hidden sm:table-cell">MEDIUM</th>
              <th className="px-4 py-3 font-bold tracking-widest text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[var(--color-ink)]">
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--color-surface-dim)] transition-colors">
                <td className="px-4 py-3 font-bold border-r-2 border-[var(--color-ink)]">{r.serial}</td>
                <td className="px-4 py-3 border-r-2 border-[var(--color-ink)]">
                  <div className="font-bold">{r.date}</div>
                  <div className="flex items-center mt-1">
                    <span className="font-bold opacity-60 truncate max-w-[120px]" title={r.tokenNo}>{r.tokenNo}</span>
                    {r.status === 'Failed' && <CopyButton text={r.tokenNo} />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-black text-sm border-r-2 border-[var(--color-ink)]">৳{r.rechargeAmount}</td>
                <td className="px-4 py-3 text-right font-bold opacity-80 border-r-2 border-[var(--color-ink)]">৳{r.electricity.toFixed(0)}</td>
                <td className="px-4 py-3 text-right font-bold border-r-2 border-[var(--color-ink)] hidden sm:table-cell">{r.probableKwh}</td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden md:table-cell">৳{r.vat.toFixed(0)}</td>
                <td className="px-4 py-3 text-right font-bold opacity-60 border-r-2 border-[var(--color-ink)] hidden lg:table-cell">৳{r.demandCharge}</td>
                <td className="px-4 py-3 text-right font-bold text-[var(--color-success)] border-r-2 border-[var(--color-ink)] hidden lg:table-cell">{r.rebate < 0 ? `৳${Math.abs(r.rebate).toFixed(0)}` : '-'}</td>
                <td className="px-4 py-3 text-center border-r-2 border-[var(--color-ink)] hidden sm:table-cell">
                  <span className="px-2 py-1 brutal-border bg-[var(--color-surface)]">{r.medium}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-1 brutal-border font-bold ${
                    r.status === 'Success'
                      ? 'bg-[var(--color-success)] text-[var(--color-ink)]'
                      : 'bg-[var(--color-warning)] text-[var(--color-ink)]'
                  }`}>
                    {r.status === 'Success' ? 'AUTO' : 'PIN'}
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
          className="w-full py-4 text-xs font-black uppercase tracking-widest brutal-btn bg-[var(--color-ink)] text-[var(--color-surface)] border-none"
          style={{boxShadow: 'none', transform: 'none'}}
        >
          {expanded ? '[- SHOW LESS]' : `[+ SHOW ALL ${rechargeHistory.length} TRANSACTIONS]`}
        </button>
      )}
    </div>
  )
}
