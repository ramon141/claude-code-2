export const revenueData = [
  { month: 'Jan', receita: 42000, despesas: 28000 },
  { month: 'Fev', receita: 55000, despesas: 31000 },
  { month: 'Mar', receita: 48000, despesas: 29500 },
  { month: 'Abr', receita: 63000, despesas: 35000 },
  { month: 'Mai', receita: 71000, despesas: 38000 },
  { month: 'Jun', receita: 58000, despesas: 32000 },
  { month: 'Jul', receita: 80000, despesas: 41000 },
  { month: 'Ago', receita: 76000, despesas: 39500 },
  { month: 'Set', receita: 91000, despesas: 44000 },
  { month: 'Out', receita: 87000, despesas: 42500 },
  { month: 'Nov', receita: 102000, despesas: 49000 },
  { month: 'Dez', receita: 118000, despesas: 53000 },
];

export const salesByCategoryData = [
  { name: 'Produtos', valor: 38400 },
  { name: 'Serviços', valor: 29200 },
  { name: 'Equipamentos', valor: 17800 },
  { name: 'Treinamentos', valor: 9600 },
  { name: 'Outros', valor: 5000 },
];

export const pieData = [
  { name: 'Administrador', value: 12 },
  { name: 'Orçamentista', value: 34 },
  { name: 'Visualizador', value: 18 },
];

export interface RecentOrder {
  id: string;
  cliente: string;
  servico: string;
  valor: number;
  status: 'Concluído' | 'Em andamento' | 'Pendente' | 'Cancelado';
  data: string;
}

export const recentOrdersData: RecentOrder[] = [
  { id: '#OS-001', cliente: 'Empresa Alpha Ltda', servico: 'Manutenção Preventiva', valor: 4500, status: 'Concluído', data: '2026-03-28' },
  { id: '#OS-002', cliente: 'Beta Indústrias S.A.', servico: 'Instalação de EPIs', valor: 12300, status: 'Em andamento', data: '2026-03-27' },
  { id: '#OS-003', cliente: 'Gamma Construções', servico: 'Treinamento NR-35', valor: 8200, status: 'Pendente', data: '2026-03-26' },
  { id: '#OS-004', cliente: 'Delta Logística', servico: 'Auditoria de Segurança', valor: 6700, status: 'Concluído', data: '2026-03-25' },
  { id: '#OS-005', cliente: 'Épsilon Mineração', servico: 'Consultoria Técnica', valor: 15000, status: 'Em andamento', data: '2026-03-24' },
  { id: '#OS-006', cliente: 'Zeta Serviços ME', servico: 'Fornecimento de EPIs', valor: 3200, status: 'Cancelado', data: '2026-03-23' },
  { id: '#OS-007', cliente: 'Eta Engenharia', servico: 'Laudo Técnico', valor: 5500, status: 'Concluído', data: '2026-03-22' },
  { id: '#OS-008', cliente: 'Theta Alimentos', servico: 'Treinamento NR-33', valor: 9800, status: 'Pendente', data: '2026-03-21' },
  { id: '#OS-009', cliente: 'Iota Transportes', servico: 'Manutenção Corretiva', valor: 7100, status: 'Em andamento', data: '2026-03-20' },
  { id: '#OS-010', cliente: 'Kappa Hospitalar', servico: 'Gestão de Resíduos', valor: 11400, status: 'Concluído', data: '2026-03-19' },
  { id: '#OS-011', cliente: 'Lambda Varejo', servico: 'Auditoria de Segurança', valor: 4900, status: 'Pendente', data: '2026-03-18' },
  { id: '#OS-012', cliente: 'Mu Tecnologia', servico: 'Consultoria Técnica', valor: 18600, status: 'Concluído', data: '2026-03-17' },
];

export const statsCards = [
  { label: 'Receita Total', value: 'R$ 891.000', change: '+14,2%', positive: true, icon: 'revenue' },
  { label: 'Ordens de Serviço', value: '247', change: '+8,5%', positive: true, icon: 'orders' },
  { label: 'Clientes Ativos', value: '1.438', change: '+3,1%', positive: true, icon: 'clients' },
  { label: 'Ticket Médio', value: 'R$ 3.607', change: '-2,4%', positive: false, icon: 'ticket' },
];

export const PIE_COLORS = ['#003D68', '#2d8bbf', '#5fb8e8', '#a8d8f0'];
