import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  // Presente quando o cadastro nasceu de uma conversa no QR de outra pessoa.
  // O link de cadastro chega por e-mail sem query string, então o valor também
  // é lido da sessão, onde a página pública o guardou.
  const conversationId =
    searchParams.get('conversation_id') || sessionStorage.getItem('qrdobem_origin_conversation');
  const navigate = useNavigate();
  const { register } = useAuth(); // Supõe-se que exista register() que use createUserWithEmailAndPassword e faça o login em seguida

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Link de cadastro inválido ou ausente.');
      setLoading(false);
      return;
    }

    authApi.validateRegisterToken(token)
      .then((data) => {
        setEmail(data.email);
        // Trilha escolhida na Home antes do envio do link, devolvida pelo token.
        // `cause` e `family` entram na lista para não serem descartadas se o
        // token passar a carregá-las; hoje o backend só emite as três primeiras.
        // Quando o token não traz trilha, a que já está no sessionStorage
        // permanece — este bloco só grava, nunca limpa.
        if (['pet', 'person', 'object', 'family', 'cause'].includes(data.trail)) {
          sessionStorage.setItem('qrdobem_trail', data.trail);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Link de cadastro inválido ou expirado. Por favor, solicite um novo link no login.');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Cria usuário no Firebase
      await register(email, password);
      // Neste momento o AuthContext deve nos autenticar com Firebase e setar o token

      // 2. Chama a API para confirmar o cadastro e preencher email_verified_at
      await authApi.completeRegistration({
        token,
        ...(conversationId && { origin_conversation_id: Number(conversationId) }),
      });

      sessionStorage.removeItem('qrdobem_origin_conversation');

      // 3. Redireciona
      navigate('/painel');
    } catch (err) {
      setError(err.message || 'Erro ao concluir o cadastro.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-blue">QR do Bem</h1>
          <p className="text-gray-500 mt-1">Concluir Cadastro</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm text-center">
            <p>{error}</p>
            {!email && (
              <Link to="/login" className="text-brand-blue font-medium hover:underline mt-2 inline-block">
                Ir para Login
              </Link>
            )}
          </div>
        )}

        {loading && <p className="text-center text-gray-500">Validando link...</p>}

        {!loading && email && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criar Senha</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : 'Criar conta e Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
