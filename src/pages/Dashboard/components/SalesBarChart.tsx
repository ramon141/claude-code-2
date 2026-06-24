import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { salesByCategoryData } from '../data';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

const BAR_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#6366F1'];

export const SalesBarChart: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-border">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800">Vendas por Categoria</h2>
        <p className="text-xs text-slate-400 mt-0.5">Comparativo entre categorias</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={salesByCategoryData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={36}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }} width={60} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => formatCurrency(Number(v))}
            contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          <Bar dataKey="valor" name="Valor" radius={[6, 6, 0, 0]}>
            {salesByCategoryData.map((_entry, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
