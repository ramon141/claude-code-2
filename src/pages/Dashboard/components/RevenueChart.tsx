import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { revenueData } from '../data';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

export const RevenueChart: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-border h-full">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800">Receita vs Despesas</h2>
        <p className="text-xs text-slate-400 mt-0.5">Evolução mensal em 2026</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }} width={60} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => formatCurrency(Number(v))}
            contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
          <Area type="monotone" dataKey="receita" name="Receita" stroke="#2563EB" strokeWidth={2} fill="url(#colorReceita)" dot={false} />
          <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" strokeWidth={2} fill="url(#colorDespesas)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
