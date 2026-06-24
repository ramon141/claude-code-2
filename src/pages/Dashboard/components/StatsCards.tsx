import { TrendingUp, TrendingDown, ClipboardList, Users, CreditCard, DollarSign } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { statsCards } from '../data';

const CARD_CONFIG = {
  revenue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    border: 'border-t-blue-500',
    icon: <DollarSign className="w-5 h-5 text-white" />,
  },
  orders: {
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    border: 'border-t-violet-500',
    icon: <ClipboardList className="w-5 h-5 text-white" />,
  },
  clients: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-t-emerald-500',
    icon: <Users className="w-5 h-5 text-white" />,
  },
  ticket: {
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    border: 'border-t-amber-500',
    icon: <CreditCard className="w-5 h-5 text-white" />,
  },
};

export const StatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statsCards.map((card) => {
        const config = CARD_CONFIG[card.icon as keyof typeof CARD_CONFIG];
        return (
          <div
            key={card.label}
            className={cn(
              'bg-white rounded-2xl p-5 shadow-card border border-border border-t-[3px] flex items-start justify-between',
              config.border
            )}
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800 leading-none">{card.value}</p>
              <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', card.positive ? 'text-emerald-600' : 'text-red-500')}>
                {card.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{card.change} vs mês anterior</span>
              </div>
            </div>
            <div className={cn('p-2.5 rounded-xl bg-gradient-to-br shadow-sm', config.gradient)}>
              {config.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
};
