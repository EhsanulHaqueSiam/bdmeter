import StatsCards from './StatsCards'
import CustomerInfo from './CustomerInfo'
import UsageChart from './UsageChart'
import RechargeInsights from './RechargeInsights'
import RechargeHistory from './RechargeHistory'
import MonthlyTable from './MonthlyTable'

export default function Dashboard({ data, meterNo, onReset }) {
  return (
    <div className="space-y-6">
      <CustomerInfo data={data} meterNo={meterNo} onReset={onReset} />
      <StatsCards data={data} />
      {data.monthlyUsage?.length > 0 && (
        <UsageChart monthlyUsage={data.monthlyUsage} />
      )}
      {data.rechargeHistory?.length > 0 && (
        <RechargeInsights rechargeHistory={data.rechargeHistory} provider={data.provider} />
      )}
      {data.rechargeHistory?.length > 0 && (
        <RechargeHistory rechargeHistory={data.rechargeHistory} />
      )}
      {data.monthlyUsage?.length > 0 && (
        <MonthlyTable monthlyUsage={data.monthlyUsage} />
      )}
    </div>
  )
}
