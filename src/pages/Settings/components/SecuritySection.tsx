import React, { useState } from 'react'
import { Shield, Monitor, Smartphone } from 'lucide-react'
import { Toggle } from '../../../components/ui/Toggle'
import FormSection from '../../../components/ui/FormSection'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/Input'

interface Session {
  id: number
  device: string
  location: string
  lastSeen: string
  current: boolean
  icon: React.ReactNode
}

const SESSIONS: Session[] = [
  { id: 1, device: 'Chrome — Windows', location: 'São Paulo, BR', lastSeen: 'Agora', current: true, icon: <Monitor className="w-4 h-4" /> },
  { id: 2, device: 'Safari — iPhone', location: 'São Paulo, BR', lastSeen: 'Há 2 horas', current: false, icon: <Smartphone className="w-4 h-4" /> },
]

export default function SecuritySection() {
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <div className="space-y-6">
      <FormSection icon={<Shield className="w-5 h-5" />} title="Alterar Senha" cols={3}>
        <Input label="Senha atual" type="password" fullWidth />
        <Input label="Nova senha" type="password" fullWidth />
        <Input label="Confirmar nova senha" type="password" fullWidth />
        <div className="sm:col-span-3 flex justify-end">
          <Button variant="primary" size="md">Alterar senha</Button>
        </div>
      </FormSection>

      <FormSection icon={<Shield className="w-5 h-5" />} title="Autenticação em Dois Fatores" cols={2}>
        <div className="sm:col-span-2">
          <Toggle
            label="Ativar 2FA"
            description="Adicione uma camada extra de segurança usando um aplicativo autenticador"
            checked={twoFactor}
            onChange={setTwoFactor}
          />
        </div>
      </FormSection>

      <FormSection icon={<Monitor className="w-5 h-5" />} title="Sessões Ativas" cols={2}>
        <div className="sm:col-span-2 space-y-3">
          {SESSIONS.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{session.icon}</span>
                <div>
                  <p className="text-body font-medium text-slate-700">{session.device}</p>
                  <p className="text-caption text-muted">{session.location} · {session.lastSeen}</p>
                </div>
              </div>
              {session.current
                ? <span className="text-caption text-success font-medium bg-success-light px-2 py-0.5 rounded-md">Atual</span>
                : <Button variant="danger-ghost" size="sm">Encerrar</Button>
              }
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  )
}
