import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OtpVerifyPage() {
  const { user, refreshTenant } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('send'); // 'send' | 'verify'
  // Já sabemos o e-mail de quem está logado — não faz sentido pedir de novo.
  const [email, setEmail] = useState(
    () => user?.email || localStorage.getItem('firebase_email') || ''
  );
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(email, user?.uid || '');
      setMessage('Código enviado para ' + email);
      setStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.verifyOtp(user?.uid || '', code);
      setMessage('E-mail verificado com sucesso!');
      // Atualiza o tenant para o profile_status novo aparecer na navegação,
      // e volta para o perfil, onde estão os próximos campos pendentes.
      await refreshTenant();
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-emerald-700 text-center mb-2">Verificação de E-mail</h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          {step === 'send'
            ? 'Informe seu e-mail para receber o código.'
            : 'Digite o código de 6 dígitos enviado para ' + email}
        </p>

        {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>}

        {step === 'send' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-2xl tracking-widest"
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('send'); setCode(''); setError(''); setMessage(''); }}
              className="w-full text-sm text-gray-500 hover:text-emerald-600"
            >
              Reenviar código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
