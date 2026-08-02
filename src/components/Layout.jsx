import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = tenant?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-brand-cream">
      <nav className="w-full bg-brand-blue shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo Section */}
          <Link to="/painel" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <ShieldCheck className="w-8 h-8 text-white" />
            <span className="text-2xl font-black text-white tracking-tight">Qrdobem</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-white">
            <Link to="/painel" className="hover:text-brand-cream transition-colors">
              Painel de Controle
            </Link>
            <Link to="/messages" className="hover:text-brand-cream transition-colors">
              Mensagens
            </Link>
            <Link to="/profile" className="hover:text-brand-cream transition-colors">
              Perfil
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" className="hover:text-brand-cream transition-colors">
                Admin
              </Link>
            )}
            <span className="text-brand-cream opacity-90 truncate max-w-[150px]">{tenant?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded transition"
            >
              Sair
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-brand-blue border-t border-brand-blue px-6 py-4 flex flex-col gap-4 font-bold text-white shadow-xl absolute w-full">
            <span className="text-brand-cream opacity-90 pb-2 border-b border-brand-cream/20 truncate">{tenant?.name}</span>
            <Link to="/painel" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Painel de Controle
            </Link>
            <Link to="/messages" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Mensagens
            </Link>
            <Link to="/profile" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Perfil
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
                Admin
              </Link>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 mt-2 rounded transition w-full text-center"
            >
              Sair
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
