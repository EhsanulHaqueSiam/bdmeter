export default function CustomerInfo({ data, meterNo, onReset }) {
  const { customerInfo } = data

  const fields = [
    { label: 'CONSUMER NO', value: customerInfo?.consumerNo || meterNo },
    { label: 'METER NO', value: customerInfo?.meterNo || '-' },
    { label: 'TARIFF', value: customerInfo?.tariff || '-' },
    { label: 'LOAD', value: customerInfo?.approvedLoad ? `${customerInfo.approvedLoad} kW` : '-' },
    { label: 'TYPE', value: customerInfo?.meterType || '-' },
    { label: 'STATUS', value: customerInfo?.meterStatus || '-' },
    { label: 'OFFICE', value: customerInfo?.office || '-' },
    { label: 'FEEDER', value: customerInfo?.feeder || '-' },
    { label: 'INSTALLED', value: customerInfo?.installDate || '-' },
    { label: 'MIN RECHARGE', value: customerInfo?.minRecharge ? `৳${customerInfo.minRecharge}` : '-' },
  ]

  return (
    <div className="brutal-card">
      <div className="px-6 py-5 brutal-border-b flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-[var(--color-surface-dim)]">
        <div>
          <h3 className="font-black text-2xl uppercase tracking-tighter">{customerInfo?.name || 'CUSTOMER'}</h3>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mt-1">
            {customerInfo?.address || 'NESCO PREPAID CUSTOMER'}
          </p>
        </div>
        <button
          onClick={onReset}
          className="brutal-btn bg-[var(--color-ink)] text-[var(--color-surface)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap"
        >
          CHANGE METER
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {fields.map((f, i) => (
          <div key={i} className="p-4 border-r-2 border-b-2 border-[var(--color-ink)]">
            <div className="font-mono text-[10px] font-bold text-[var(--color-ink)] opacity-60 uppercase tracking-widest mb-1">{f.label}</div>
            <div className="font-bold text-sm uppercase truncate">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
