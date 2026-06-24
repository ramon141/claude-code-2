import React, { useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigureWebsocket } from '../../../../api/generated/api'

interface WebsocketSectionProps {
  origins: string[]
}

const ORIGIN_SEPARATOR = '\n'

const WebsocketSection: React.FC<WebsocketSectionProps> = ({ origins }) => {
  const [value, setValue] = useState(origins.join(ORIGIN_SEPARATOR))
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const { mutateAsync, isPending } = useSetupControllerConfigureWebsocket()

  const onSave = async () => {
    setApiError('')
    setSaved(false)
    const list = value.split(ORIGIN_SEPARATOR).map((o) => o.trim()).filter((o) => o.length > 0)
    try {
      await mutateAsync({ data: { origins: list } })
      setSaved(true)
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  return (
    <SectionCard
      title="Origens WebSocket permitidas"
      description="Uma origem por linha. Aplicado imediatamente nas novas conexões."
      icon={<Globe className="w-5 h-5" />}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        spellCheck={false}
        placeholder="tauri://localhost"
        className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#F5F5F5] text-sm font-mono outline-none focus:border-[#D97757] transition-colors placeholder:text-[#6A6A6A] resize-y"
      />
      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
      {saved && <p className="text-green-400 text-sm">Origens salvas.</p>}
      <Button type="button" onClick={onSave} loading={isPending} className="self-end">
        Salvar
      </Button>
    </SectionCard>
  )
}

export default WebsocketSection
