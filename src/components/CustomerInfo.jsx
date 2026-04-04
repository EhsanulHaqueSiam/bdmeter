export default function CustomerInfo({ data, meterNo, onReset }) {
  const { customerInfo } = data

  const fields = [
    { label: 'Consumer No', value: customerInfo?.consumerNo || meterNo },
    { label: 'Meter No', value: customerInfo?.meterNo || '-' },
    { label: 'Tariff', value: customerInfo?.tariff || '-' },
    { label: 'Load', value: customerInfo?.approvedLoad ? `${customerInfo.approvedLoad} kW` : '-' },
    { label: 'Type', value: customerInfo?.meterType || '-' },
    { label: 'Status', value: customerInfo?.meterStatus || '-' },
    { label: 'Office', value: customerInfo?.office || '-' },
    { label: 'Feeder', value: customerInfo?.feeder || '-' },
    { label: 'Installed', value: customerInfo?.installDate || '-' },
    { label: 'Min Recharge', value: customerInfo?.minRecharge ? `৳${customerInfo.minRecharge}` : '-' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden">
      <div className="px-6 py-6 border-b border-[var(--color-outline)] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{customerInfo?.name || 'Customer'}</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">
            {customerInfo?.address || 'Nesco Prepaid Customer'}
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl font-medium text-sm bg-[var(--color-ink)] text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          Change Meter
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--color-outline)]">
        {fields.map((f, i) => (
          <div key={i} className="p-5 bg-white">
            <div className="text-sm text-gray-500 mb-1">{f.label}</div>
            <div className="text-base font-semibold text-gray-900 break-words">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
