import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ReauthModal({ onSuccess, onCancel }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(localStorage.getItem('firebase_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Senha incorreta.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sessão Expirada</h2>
        <p className="text-sm text-gray-600 mb-6">
          Por segurança, precisamos que você informe sua senha novamente para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!localStorage.getItem('firebase_email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-accent hover:bg-brand-accent-strong text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
