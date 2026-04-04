import { motion } from 'framer-motion'

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-[var(--color-outline)] shadow-sm overflow-hidden"
    >
      <div className="px-6 py-6 border-b border-[var(--color-outline)] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">{customerInfo?.name || 'Customer'}</h3>
          <p className="text-sm text-[var(--color-ink)]/70 mt-1">
            {customerInfo?.address || 'Nesco Prepaid Customer'}
          </p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="px-4 py-2 rounded-xl font-medium text-sm bg-[var(--color-ink)] text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          Change Meter
        </motion.button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--color-outline)]">
        {fields.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="p-5 bg-white"
          >
            <div className="text-sm text-gray-500 mb-1">{f.label}</div>
            <div className="text-base font-semibold text-gray-900 break-words">{f.value}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
