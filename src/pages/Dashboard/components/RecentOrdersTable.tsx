import React, { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/Badge';
import type { BadgeProps } from '../../../components/ui/Badge';
import { recentOrdersData } from '../data';
import type { RecentOrder } from '../data';

const STATUS_BADGE: Record<RecentOrder['status'], BadgeProps['variant']> = {
  'Concluído':    'success',
  'Em andamento': 'info',
  'Pendente':     'warning',
  'Cancelado':    'danger',
};

const ALL_STATUSES: Array<RecentOrder['status'] | 'Todos'> = ['Todos', 'Concluído', 'Em andamento', 'Pendente', 'Cancelado'];
const PAGE_SIZE = 5;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const RecentOrdersTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecentOrder['status'] | 'Todos'>('Todos');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return recentOrdersData.filter((o) => {
      const matchSearch = !term || o.cliente.toLowerCase().includes(term) || o.servico.toLowerCase().includes(term) || o.id.toLowerCase().includes(term);
      const matchStatus = statusFilter === 'Todos' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (s: RecentOrder['status'] | 'Todos') => { setStatusFilter(s); setPage(1); };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border">
        <div>
          <h2 className="text-subhead text-slate-800">Ordens de Serviço Recentes</h2>
          <p className="text-caption text-muted mt-0.5">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={handleSearchChange}
            className="w-full h-8 pl-8 pr-3 bg-white border border-border rounded-lg text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-slate-300 transition-all placeholder:text-muted"
          />
        </div>
      </div>

      <div className="px-5 py-2.5 flex flex-wrap gap-1.5 border-b border-border">
        {ALL_STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => handleFilterChange(s)}
            className={cn(
              'px-3 py-1 rounded-lg text-label transition-all',
              statusFilter === s ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['OS', 'Cliente', 'Serviço', 'Valor', 'Status', 'Data'].map((h) => (
                <th key={h} className="text-left px-5 h-9 text-label text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted text-body">Nenhum resultado encontrado</td></tr>
            ) : paginated.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-slate-50/80 transition-colors">
                <td className="px-5 h-12 text-caption font-semibold text-primary">{order.id}</td>
                <td className="px-5 h-12 text-body text-slate-700 font-medium">{order.cliente}</td>
                <td className="px-5 h-12 text-body text-muted">{order.servico}</td>
                <td className="px-5 h-12 text-body font-semibold text-slate-700">{formatCurrency(order.valor)}</td>
                <td className="px-5 h-12">
                  <Badge variant={STATUS_BADGE[order.status]}>{order.status}</Badge>
                </td>
                <td className="px-5 h-12 text-caption text-muted">{new Date(order.data).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 flex items-center justify-end gap-2 border-t border-border">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-caption text-slate-500 font-medium min-w-[60px] text-center">{page} / {totalPages}</span>
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
