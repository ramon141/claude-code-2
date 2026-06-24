import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import useDimensions from '../../hooks/useDimensions';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { width } = useDimensions();
  const isMobile = width < 640;

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-[#F2F2F2] p-4 box-border">
      <div className={`flex flex-col items-center justify-center bg-white text-center w-full max-w-[500px] shadow-[0px_8px_24px_rgba(0,0,0,0.15)] ${isMobile ? 'p-8 rounded-2xl' : 'p-12 rounded-3xl'}`}>

        <p className={`font-bold text-[#3F5A75] leading-none mb-4 ${isMobile ? 'text-[80px]' : 'text-[120px]'}`}>
          404
        </p>

        <div className={`text-[#64748b] mb-6 ${isMobile ? 'text-[48px]' : 'text-[64px]'}`}>
          <Search className="inline" style={{ width: 'inherit', height: 'inherit' }} />
        </div>

        <h1 className={`font-bold text-[#1e293b] mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          Página Não Encontrada
        </h1>

        <p className="text-[#64748b] leading-relaxed mb-8 max-w-[400px] text-sm">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>

        <div className={`flex gap-3 justify-center flex-wrap mt-8 ${isMobile ? 'flex-col gap-2' : ''}`}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-[#2D3D4D] hover:bg-[#1B2A38] text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all hover:-translate-y-px"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 border-2 border-[#2D3D4D] text-[#2D3D4D] hover:bg-[#2D3D4D] hover:text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all hover:-translate-y-px"
          >
            <Home className="w-4 h-4" /> Início
          </button>
        </div>

        <div className={`mt-8 bg-[rgba(45,61,77,0.1)] rounded-2xl text-[#475569] text-sm ${isMobile ? 'p-3 rounded-xl text-xs' : 'p-4'}`}>
          <p className="mb-2 font-semibold">💡 Dica: Verifique se o endereço está correto ou tente navegar pelo menu.</p>
          <p className="text-[#64748b] text-xs">Se o problema persistir, entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
