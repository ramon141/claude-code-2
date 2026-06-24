import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { QueueState } from '../../../api/generated/models'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[#9A9A9A] text-sm font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-[#F5F5F5]">{value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

interface Props {
  state: QueueState
}

export default function StatsCards({ state }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Processados"
        value={state.totalProcessed ?? 0}
        icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
        color="bg-green-500/10"
      />
      <StatCard
        title="Falhas"
        value={state.failedCount ?? 0}
        icon={<XCircle className="w-5 h-5 text-red-400" />}
        color="bg-red-500/10"
      />
      <StatCard
        title="Rate Limits"
        value={state.rateLimitedCount ?? 0}
        icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
        color="bg-yellow-500/10"
      />
    </div>
  )
}
