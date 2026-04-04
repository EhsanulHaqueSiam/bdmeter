import { motion } from 'framer-motion'
import StatsCards from './StatsCards'
import CustomerInfo from './CustomerInfo'
import UsageChart from './UsageChart'
import RechargeInsights from './RechargeInsights'
import RechargeHistory from './RechargeHistory'
import MonthlyTable from './MonthlyTable'

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function Dashboard({ data, meterNo, onReset }) {
  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <CustomerInfo data={data} meterNo={meterNo} onReset={onReset} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <StatsCards data={data} />
      </motion.div>
      {data.monthlyUsage?.length > 0 && (
        <motion.div variants={fadeUp}>
          <UsageChart monthlyUsage={data.monthlyUsage} />
        </motion.div>
      )}
      {data.rechargeHistory?.length > 0 && (
        <motion.div variants={fadeUp}>
          <RechargeInsights rechargeHistory={data.rechargeHistory} provider={data.provider} />
        </motion.div>
      )}
      {data.rechargeHistory?.length > 0 && (
        <motion.div variants={fadeUp}>
          <RechargeHistory rechargeHistory={data.rechargeHistory} provider={data.provider} />
        </motion.div>
      )}
      {data.monthlyUsage?.length > 0 && (
        <motion.div variants={fadeUp}>
          <MonthlyTable monthlyUsage={data.monthlyUsage} provider={data.provider} />
        </motion.div>
      )}
    </motion.div>
  )
}
