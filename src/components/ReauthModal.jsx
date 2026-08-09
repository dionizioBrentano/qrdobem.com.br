import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { twoFactorApi } from '../services/api';

export default function ReauthModal({ onSuccess, onCancel, title, message }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(localStorage.getItem('firebase_email') || '');
  const [password, setPassword] = useState('');
  const [has2FA, setHas2FA] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking2FA, setChecking2FA] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    twoFactorApi.status()
      .then(res => setHas2FA(res?.enabled || false))
      .catch(() => {}) // ignora erro
      .finally(() => setChecking2FA(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      
      if (has2FA) {
        await twoFactorApi.verify(code);
      }
      
      onSuccess();
    } catch (err) {
      setError(err.message || 'Dados inválidos.');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title || 'Sessão Expirada'}</h2>
        <p className="text-sm text-gray-600 mb-6">
          {message || 'Por segurança, precisamos que você informe sua senha novamente para continuar.'}
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
              autoFocus={!has2FA}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>

          {!checking2FA && has2FA && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código do aplicativo (2FA)</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none font-mono tracking-widest text-center"
              />
            </div>
          )}

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
    </div>,
    document.body
  );
}
