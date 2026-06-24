import { useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function ServerErrorPage() {
  const navigate = useNavigate()

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-base p-4">
      <div className="flex flex-col items-center justify-center bg-white text-center w-full max-w-[480px] shadow-card-md p-12 rounded-2xl">
        <p className="font-bold text-slate-300 leading-none mb-4 text-[120px]">500</p>

        <div className="w-16 h-16 rounded-2xl bg-warning-light flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>

        <h1 className="text-heading text-slate-800 mb-3">Erro no Servidor</h1>
        <p className="text-body text-muted leading-relaxed mb-8 max-w-sm">
          Algo deu errado do nosso lado. Nossa equipe já foi notificada. Tente novamente em instantes.
        </p>

        <div className="flex gap-3 justify-center flex-wrap w-full">
          <Button variant="secondary" size="md" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4" /> Início
          </Button>
        </div>
      </div>
    </div>
  )
}
