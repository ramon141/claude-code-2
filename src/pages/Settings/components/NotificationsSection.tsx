import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Toggle } from '../../../components/ui/Toggle'
import FormSection from '../../../components/ui/FormSection'
import { Button } from '../../../components/ui/Button'

interface NotifPrefs {
  emailAlerts: boolean
  emailReports: boolean
  emailUpdates: boolean
  pushAlerts: boolean
  pushMessages: boolean
}

export default function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    emailAlerts: true,
    emailReports: true,
    emailUpdates: false,
    pushAlerts: true,
    pushMessages: false,
  })

  const set = (key: keyof NotifPrefs) => (val: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6">
      <FormSection icon={<Bell className="w-5 h-5" />} title="Notificações por E-mail" cols={2}>
        <div className="sm:col-span-2 space-y-4">
          <Toggle label="Alertas críticos" description="Receba alertas sobre eventos importantes na plataforma" checked={prefs.emailAlerts} onChange={set('emailAlerts')} />
          <Toggle label="Relatórios semanais" description="Resumo semanal de atividades e métricas" checked={prefs.emailReports} onChange={set('emailReports')} />
          <Toggle label="Atualizações do sistema" description="Novidades, melhorias e manutenções programadas" checked={prefs.emailUpdates} onChange={set('emailUpdates')} />
        </div>
      </FormSection>

      <FormSection icon={<Bell className="w-5 h-5" />} title="Notificações Push" cols={2}>
        <div className="sm:col-span-2 space-y-4">
          <Toggle label="Alertas em tempo real" description="Notificações imediatas para eventos urgentes" checked={prefs.pushAlerts} onChange={set('pushAlerts')} />
          <Toggle label="Mensagens" description="Notificações de novas mensagens e comentários" checked={prefs.pushMessages} onChange={set('pushMessages')} />
        </div>
      </FormSection>

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="md">Salvar preferências</Button>
      </div>
    </div>
  )
}
