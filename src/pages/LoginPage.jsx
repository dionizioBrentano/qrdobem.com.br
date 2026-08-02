import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register' || mode === 'signup') {
      setIsRegisterMode(true);
    }

    const trail = searchParams.get('trail');
    if (['pet', 'person', 'object'].includes(trail)) {
      sessionStorage.setItem('qrdobem_trail', trail);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setShowRegisterPrompt(false);
    setLoading(true);
    try {
      await login(email, password);
      
      const storedTrail = sessionStorage.getItem('qrdobem_trail');
      if (storedTrail) {
        navigate(`/painel?trail=${storedTrail}`);
      } else {
        navigate('/painel');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('invalid-login-credentials')) {
        setShowRegisterPrompt(true);
        setError('Não encontramos conta. Deseja se cadastrar com este e-mail?');
      } else {
        setError(msg || 'Erro ao autenticar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLink = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.requestRegisterLink(email);
      setSuccessMsg('Enviamos um link para seu e-mail!');
      setShowRegisterPrompt(false);
      setIsRegisterMode(false);
    } catch (err) {
      setError(err.message || 'Erro ao enviar link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-blue">QR do Bem</h1>
          <p className="text-gray-500 mt-1">
            {isRegisterMode ? 'Crie sua conta' : 'Acesse sua conta'}
          </p>
        </div>

        {error && !showRegisterPrompt && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {successMsg}
          </div>
        )}

        {showRegisterPrompt && (
          <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
            <p className="mb-2">Não encontramos conta. Deseja se cadastrar com este e-mail?</p>
            <button
              onClick={() => handleRequestLink()}
              disabled={loading}
              className="bg-brand-blue text-white px-4 py-1.5 rounded font-medium hover:brightness-90 transition disabled:opacity-50"
            >
              Sim, enviar link
            </button>
          </div>
        )}

        <form onSubmit={isRegisterMode ? handleRequestLink : handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="seu@email.com"
            />
          </div>

          {!isRegisterMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
                placeholder="••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue hover:brightness-90 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : isRegisterMode ? 'Receber link de acesso' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isRegisterMode ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
              setSuccessMsg('');
              setShowRegisterPrompt(false);
            }}
            className="text-brand-blue hover:underline font-medium"
          >
            {isRegisterMode ? 'Faça login' : 'Cadastre-se'}
          </button>
        </p>
      </div>
    </div>
  );
}
