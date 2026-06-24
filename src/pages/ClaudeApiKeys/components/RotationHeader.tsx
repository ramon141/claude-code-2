import { Repeat } from 'lucide-react'
import { Switch } from '../../../components/ui/Switch'
import { useAccountRotation } from '../hooks/useAccountRotation'

export default function RotationHeader() {
  const { enabled, isLoading, isUpdating, setEnabled } = useAccountRotation()

  return (
    <div className="flex items-center justify-between gap-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center flex-shrink-0">
          <Repeat className="w-3.5 h-3.5 text-[#D97757]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#F5F5F5]">Alternar entre contas</p>
          <p className="text-xs text-[#9A9A9A]">
            Reveza os prompts entre as contas marcadas no rodízio, pulando as que estão em rate limit.
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        disabled={isLoading || isUpdating}
        onChange={(next) => void setEnabled(next)}
        label="Alternar entre contas"
      />
    </div>
  )
}
