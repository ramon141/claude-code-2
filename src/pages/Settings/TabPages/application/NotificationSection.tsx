import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Switch } from '../../../../components/ui/Switch'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigureNotifications } from '../../../../api/generated/api'

interface NotificationSectionProps {
  notificationsEnabled: boolean
  notificationPhones: string[]
}

const PHONE_SEPARATOR = '\n'

const NotificationSection: React.FC<NotificationSectionProps> = ({
  notificationsEnabled,
  notificationPhones,
}) => {
  const [enabled, setEnabled] = useState(notificationsEnabled)
  const [phones, setPhones] = useState(notificationPhones.join(PHONE_SEPARATOR))
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const { mutateAsync, isPending } = useSetupControllerConfigureNotifications()

  const onSave = async () => {
    setApiError('')
    setSaved(false)
    const list = phones.split(PHONE_SEPARATOR).map((p) => p.trim()).filter((p) => p.length > 0)
    try {
      await mutateAsync({ data: { enabled, phones: list } })
      setSaved(true)
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  return (
    <SectionCard
      title="Notificações WhatsApp"
      description="Envia uma mensagem quando um prompt finaliza. Um número por linha (ex: 11999998888)."
      icon={<Bell className="w-5 h-5" />}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#F5F5F5] text-sm">Ativar notificações ao finalizar prompt</span>
        <Switch checked={enabled} onChange={setEnabled} />
      </div>

      <textarea
        value={phones}
        onChange={(e) => setPhones(e.target.value)}
        rows={4}
        spellCheck={false}
        placeholder="11999998888"
        disabled={!enabled}
        className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#F5F5F5] text-sm font-mono outline-none focus:border-[#D97757] transition-colors placeholder:text-[#6A6A6A] resize-y disabled:opacity-40"
      />

      <p className="text-[#9A9A9A] text-xs">
        Mensagem enviada: <span className="font-mono text-[#D97757]">O Chat *nome* finalizou o prompt: texto…</span>
      </p>

      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
      {saved && <p className="text-green-400 text-sm">Configuração salva.</p>}

      <Button type="button" onClick={onSave} loading={isPending} className="self-end">
        Salvar
      </Button>
    </SectionCard>
  )
}

export default NotificationSection
