import { useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft, Home } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-base p-4">
      <div className="flex flex-col items-center justify-center bg-white text-center w-full max-w-[480px] shadow-card-md p-12 rounded-2xl">
        <p className="font-bold text-primary leading-none mb-4 text-[120px]">403</p>

        <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-5">
          <ShieldOff className="w-8 h-8 text-danger" />
        </div>

        <h1 className="text-heading text-slate-800 mb-3">Acesso Negado</h1>
        <p className="text-body text-muted leading-relaxed mb-8 max-w-sm">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador caso acredite que isso seja um erro.
        </p>

        <div className="flex gap-3 justify-center flex-wrap w-full">
          <Button variant="secondary" size="md" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4" /> Início
          </Button>
        </div>
      </div>
    </div>
  )
}
