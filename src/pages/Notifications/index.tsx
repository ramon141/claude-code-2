import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/Button'
import { NotificationItem } from './components/NotificationItem'
import type { NotificationData } from './components/NotificationItem'

const MOCK: NotificationData[] = [
  { id: 1, type: 'success', title: 'EPI cadastrado com sucesso', description: 'O EPI "Capacete de Segurança" foi registrado no sistema.', time: 'Agora', read: false },
  { id: 2, type: 'warning', title: 'Estoque crítico', description: 'O item "Luva de Proteção" está abaixo do estoque mínimo definido.', time: '15 min', read: false },
  { id: 3, type: 'info', title: 'Novo usuário adicionado', description: 'O usuário "João Silva" foi adicionado à equipe com perfil Operador.', time: '1 hora', read: false },
  { id: 4, type: 'error', title: 'Falha na sincronização', description: 'Não foi possível sincronizar os dados com o servidor externo. Tente novamente.', time: '3 horas', read: true },
  { id: 5, type: 'success', title: 'Relatório gerado', description: 'O relatório mensal de EPIs está disponível para download.', time: 'Ontem', read: true },
  { id: 6, type: 'info', title: 'Manutenção programada', description: 'O sistema ficará indisponível no dia 05/04 das 02h às 04h para manutenção.', time: '2 dias', read: true },
]

const TABS = ['Todas', 'Não lidas', 'Lidas'] as const
type TabType = typeof TABS[number]

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>(MOCK)
  const [activeTab, setActiveTab] = useState<TabType>('Todas')

  const markAsRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = notifications.filter((n) => {
    if (activeTab === 'Não lidas') return !n.read
    if (activeTab === 'Lidas') return n.read
    return true
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-heading text-slate-800">Notificações</h1>
          {unreadCount > 0 && <p className="text-caption text-muted mt-0.5">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="flex gap-1 px-4 pt-3 border-b border-border">
          {TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-2 text-body font-medium rounded-t-lg transition-all border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-slate-700',
              )}
            >
              {tab}
              {tab === 'Não lidas' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {filtered.length === 0
            ? <p className="px-5 py-10 text-center text-body text-muted">Nenhuma notificação</p>
            : filtered.map((n) => <NotificationItem key={n.id} notification={n} onRead={markAsRead} />)
          }
        </div>
      </div>
    </div>
  )
}
