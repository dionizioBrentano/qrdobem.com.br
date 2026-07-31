import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = tenant?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">
            QR do Bem
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="hover:text-emerald-200 transition">
              Dashboard
            </Link>
            <Link to="/messages" className="hover:text-emerald-200 transition">
              Mensagens
            </Link>
            <Link to="/profile" className="hover:text-emerald-200 transition">
              Perfil
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" className="hover:text-emerald-200 transition">
                Admin
              </Link>
            )}
            <span className="text-emerald-200">{tenant?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded transition"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
