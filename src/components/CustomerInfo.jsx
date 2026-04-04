export default function CustomerInfo({ data, meterNo, onReset }) {
  const { customerInfo } = data

  const fields = [
    { label: 'Consumer No', value: customerInfo?.consumerNo || meterNo },
    { label: 'Meter No', value: customerInfo?.meterNo || '-' },
    { label: 'Tariff', value: customerInfo?.tariff || '-' },
    { label: 'Load', value: customerInfo?.approvedLoad ? `${customerInfo.approvedLoad} kW` : '-' },
    { label: 'Meter Type', value: customerInfo?.meterType || '-' },
    { label: 'Status', value: customerInfo?.meterStatus || '-' },
    { label: 'Office', value: customerInfo?.office || '-' },
    { label: 'Feeder', value: customerInfo?.feeder || '-' },
    { label: 'Installed', value: customerInfo?.installDate || '-' },
    { label: 'Min Recharge', value: customerInfo?.minRecharge ? `৳${customerInfo.minRecharge}` : '-' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{customerInfo?.name || 'Customer'}</h3>
            <p className="text-xs text-slate-400">{customerInfo?.address || 'NESCO Prepaid Customer'}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Change Meter
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-slate-100">
        {fields.map((f, i) => (
          <div key={i} className="px-4 py-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{f.label}</div>
            <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
