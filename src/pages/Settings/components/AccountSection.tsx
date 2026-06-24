import { User, Camera } from 'lucide-react'
import { Input } from '../../../components/Input'
import FormSection from '../../../components/ui/FormSection'
import { Button } from '../../../components/ui/Button'

export default function AccountSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5 pb-6 border-b border-border">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
            U
          </div>
          <button type="button"
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-border rounded-lg flex items-center justify-center shadow-card hover:bg-slate-50 transition-colors">
            <Camera className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
        <div>
          <p className="text-subhead text-slate-800 font-semibold">Usuário</p>
          <p className="text-body text-muted">usuario@email.com</p>
        </div>
      </div>

      <FormSection icon={<User className="w-5 h-5" />} title="Informações da Conta" cols={2}>
        <Input label="Nome" defaultValue="Usuário" fullWidth />
        <Input label="E-mail" type="email" defaultValue="usuario@email.com" fullWidth />
        <Input label="Telefone" placeholder="(00) 00000-0000" fullWidth />
        <Input label="Cargo" placeholder="Ex: Gerente" fullWidth />
      </FormSection>

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="md">Salvar alterações</Button>
      </div>
    </div>
  )
}
