import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { pieData } from '../data';

const PIE_COLORS = ['#2563EB', '#7C3AED', '#10B981'];
const total = pieData.reduce((sum, d) => sum + d.value, 0);

export const UsersDonutChart: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-border h-full">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">Usuários por Perfil</h2>
        <p className="text-xs text-slate-400 mt-0.5">Distribuição de acessos</p>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {pieData.map((_entry, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800">{total}</span>
          <span className="text-xs text-slate-400 font-medium">usuários</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {pieData.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index] }} />
              <span className="text-xs text-slate-600">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-slate-700">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
