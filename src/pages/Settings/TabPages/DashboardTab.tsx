import { Activity } from 'lucide-react'
import { useQueueStateControllerGetState } from '../../../api/generated/api'
import StatsCards from '../../QueueDashboard/components/StatsCards'

function formatLastProcessed(iso?: string): string {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Agora mesmo'
  if (minutes === 1) return '1 minuto atrás'
  if (minutes < 60) return `${minutes} minutos atrás`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? '1 hora atrás' : `${hours} horas atrás`
}

function DaemonStatus({ lastProcessed }: { lastProcessed?: string }) {
  return (
    <div className="bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] p-5">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-[#D97757]" />
        <h3 className="text-[#F5F5F5] font-semibold">Status do Daemon</h3>
      </div>
      <div className="py-2 flex items-center justify-between">
        <span className="text-[#9A9A9A] text-sm">Último processado</span>
        <span className="text-[#F5F5F5] text-sm">{formatLastProcessed(lastProcessed)}</span>
      </div>
    </div>
  )
}

export default function DashboardTab() {
  const { data: state, isLoading } = useQueueStateControllerGetState({
    query: { refetchInterval: 10000 },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-2 border-[#D97757] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!state) {
    return (
      <div className="text-center py-20">
        <p className="text-[#9A9A9A] text-sm">Não foi possível carregar os dados do daemon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <StatsCards state={state} />
      <DaemonStatus lastProcessed={state.lastProcessed} />
    </div>
  )
}
