import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { entitiesApi } from '../services/api';

export default function ChallengePage() {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const initChallenge = async (coords = null) => {
      try {
        const payload = coords
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : {};
          
        const res = await entitiesApi.adventure.createChallenge(uniqueCode, payload);
        if (mounted) {
          if (!res || !res.challenge_id) {
            setError('Erro ao iniciar a verificação. Tente novamente.');
          } else {
            setChallengeId(res.challenge_id);
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError('Erro ao iniciar a verificação. Tente novamente.');
          setLoading(false);
        }
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          initChallenge(position.coords);
        },
        () => {
          // Fallback se negado ou erro
          initChallenge();
        },
        { timeout: 5000 }
      );
    } else {
      initChallenge();
    }

    return () => {
      mounted = false;
    };
  }, [uniqueCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    
    try {
      await entitiesApi.adventure.silentTrigger(uniqueCode, {
        challenge_id: challengeId,
        password,
      });
    } catch (err) {
      // Independente de erro (ex: senha errada), sempre mostramos sucesso na UI
      console.error('Submit result handled silently');
    } finally {
      setSubmitted(true);
      setSubmitting(false);
      
      // Redireciona pro painel após 2.5s
      setTimeout(() => {
        navigate('/painel');
      }, 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4" />
          <p className="text-gray-600">Iniciando verificação de rotina...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/painel')}
            className="text-brand-blue hover:underline text-sm font-medium"
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full">
        {submitted ? (
          <div className="text-center py-6">
            <h2 className="text-xl font-medium text-gray-800 mb-2">Verificação registrada.</h2>
            <p className="text-gray-500 text-sm">Redirecionando...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmação de rotina</h1>
              <p className="text-gray-600 text-sm">
                Você parece estar fora do seu padrão habitual. Confirme com sua senha para continuar.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                  autoFocus
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting || !password || !challengeId}
                className="w-full bg-brand-blue hover:bg-brand-blue-strong text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Confirmando...' : 'Confirmar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
