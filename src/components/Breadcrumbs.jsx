import { Link, useLocation } from 'react-router-dom';

const routeMap = {
  '/painel': null,
  '/messages': 'Mensagens',
  '/familia': 'Família',
  '/saude': 'Saúde',
  '/causa': 'Causa',
  '/doacoes': 'Doações',
  '/profile': 'Perfil',
  '/contas': 'Minhas contas',
  '/seguranca': 'Segurança',
  '/repasses': 'Repasses',
  '/admin': 'Admin',
  '/ajuda': 'Ajuda',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  if (pathname === '/painel' || pathname === '/painel/') {
    return null;
  }

  const normalizedPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  
  let currentLabel = routeMap[normalizedPath];
  
  if (normalizedPath.startsWith('/painel/qr/')) {
    currentLabel = 'Editar QR';
  } else if (currentLabel === undefined) {
    const segments = normalizedPath.split('/').filter(Boolean);
    currentLabel = segments.length > 0 ? segments[0] : '';
    if (currentLabel) {
      currentLabel = currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1);
    }
  }

  if (!currentLabel) {
    return null;
  }

  return (
    <div className="w-full text-sm text-gray-500 mb-4 flex items-center gap-2">
      <Link to="/painel" className="text-brand-blue hover:underline">
        Painel de Controle
      </Link>
      <span>/</span>
      <span className="text-gray-700 font-medium">{currentLabel}</span>
    </div>
  );
}
