import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

const normalizeText = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface RegisterItem {
  title: string;
  description: string;
  icon: string;
  toPage: string;
}

const REGISTER_ITEMS: RegisterItem[] = [
  { title: 'Função', description: 'Gerencie todas as funções disponíveis na sua empresa.', icon: 'mdi:worker', toPage: '/register/roles' },
  { title: 'Planos Odontológicos', description: 'Gerencie os planos odontológicos.', icon: 'mdi:tooth-outline', toPage: '/register/dental-plans' },
  { title: 'Seguro de Vida', description: 'Gerencie o seguro de vida.', icon: 'mdi:shield-account', toPage: '/register/life-insurance' },
  { title: 'Planos de Saúde', description: 'Gerencie os planos de saúde.', icon: 'mdi:heart-pulse', toPage: '/register/health-plans' },
  { title: 'Hospedagem', description: 'Gerencie os itens de hospedagem.', icon: 'mdi:bed-outline', toPage: '/register/accommodation-items' },
  { title: 'EPIs', description: 'Gerencie os Equipamentos de Proteção Individual da sua empresa.', icon: 'mdi:hard-hat', toPage: '/register/epis' },
  { title: 'Clientes', description: 'Gerencie os clientes da sua empresa.', icon: 'mdi:account-group', toPage: '/register/clients' },
  { title: 'Licitantes', description: 'Gerencie os licitantes da sua empresa.', icon: 'mdi:gavel', toPage: '/register/bidders' },
  { title: 'Filiais', description: 'Gerencie as filiais da sua empresa.', icon: 'mdi:office-building', toPage: '/register/branches' },
  { title: 'Exames', description: 'Gerencie os exames e procedimentos médicos.', icon: 'mdi:clipboard-text', toPage: '/register/exams' },
  { title: 'Treinamentos', description: 'Gerencie os treinamentos para os colaboradores.', icon: 'mdi:teach', toPage: '/register/trainings' },
  { title: 'Uniformes', description: 'Gerencie os uniformes da sua empresa.', icon: 'mdi:tshirt-crew', toPage: '/register/uniforms' },
  { title: 'Equipamentos', description: 'Gerencie os equipamentos dos orçamentos.', icon: 'mdi:crane', toPage: '/register/equipments-budget' },
  { title: 'Templates de Equipamentos', description: 'Gerencie templates de equipamentos para orçamentos.', icon: 'mdi:content-copy', toPage: '/register/equipment-templates' },
  { title: 'Itens Diversos', description: 'Gerencie os itens diversos.', icon: 'mdi:package-variant', toPage: '/register/miscellaneous' },
  { title: 'Materiais', description: 'Gerencie os materiais.', icon: 'lets-icons:materials-light', toPage: '/register/materials' },
  { title: 'Veículos', description: 'Gerencie os veículos da empresa.', icon: 'mdi:truck-outline', toPage: '/register/vehicle-options' },
  { title: 'Empresas Terceirizadas', description: 'Gerencie as empresas terceirizadas.', icon: 'mdi:domain', toPage: '/register/third-enterprise' },
  { title: 'Tipos de Serviço', description: 'Gerencie os tipos de serviço disponíveis para os orçamentos.', icon: 'mdi:tools', toPage: '/register/service-types' },
  { title: 'Clínicas de Saúde', description: 'Gerencie as clínicas de saúde disponíveis.', icon: 'mdi:hospital-building', toPage: '/register/health-clinics' },
  { title: 'Clínicas Odontológicas', description: 'Gerencie as clínicas odontológicas disponíveis.', icon: 'mdi:tooth', toPage: '/register/dental-clinics' },
  { title: 'Tipos de Tributação', description: 'Gerencie os tipos de tributação para impostos e taxas.', icon: 'mdi:calculator-variant', toPage: '/register/type-taxations' },
];

const Registers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => REGISTER_ITEMS.filter(({ title, description }) => {
      const q = normalizeText(search);
      return normalizeText(title).includes(q) || normalizeText(description).includes(q);
    }),
    [search]
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header search={search} onSearch={setSearch} total={filtered.length} />
      <Grid items={filtered} onNavigate={navigate} />
    </div>
  );
};

const Header = ({ search, onSearch, total }: { search: string; onSearch: (v: string) => void; total: number }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-display text-slate-800">Cadastros</h1>
      <p className="text-body text-muted mt-0.5">{total} módulo{total !== 1 ? 's' : ''} disponível{total !== 1 ? 'is' : ''}</p>
    </div>
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      <input
        type="text"
        placeholder="Buscar módulo..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full h-10 pl-9 pr-4 bg-white border border-border rounded-xl text-body text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-slate-300 transition-all placeholder:text-muted shadow-card"
      />
    </div>
  </div>
);

const Grid = ({ items, onNavigate }: { items: RegisterItem[]; onNavigate: (path: string) => void }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-muted" />
        </div>
        <p className="text-subhead text-slate-700">Nenhum módulo encontrado</p>
        <p className="text-body text-muted mt-1">Tente buscar com outros termos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => <RegisterCard key={item.toPage} item={item} onClick={() => onNavigate(item.toPage)} />)}
    </div>
  );
};

const RegisterCard = ({ item, onClick }: { item: RegisterItem; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col items-start gap-3 bg-white border border-border rounded-2xl p-5 text-left shadow-card hover:border-primary/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  >
    <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
      <Icon icon={item.icon} width={24} className="text-primary" style={{ color: '#2563EB' }} />
    </div>
    <div>
      <p className="text-subhead text-slate-800 leading-snug">{item.title}</p>
      <p className="text-caption text-muted mt-1 leading-relaxed line-clamp-2">{item.description}</p>
    </div>
  </button>
);

export default Registers;
