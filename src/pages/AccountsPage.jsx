import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link2, AlertCircle, Check } from 'lucide-react';
import { meApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * AccountsPage — "Minhas contas e vínculos".
 *
 * Fase 0, entrega 0.11 do PLANO_TRILHAS_2026-08.md
 * (requisitos TX-R02, TX-R03, TX-R04).
 *
 * Responde duas perguntas que o painel não respondia:
 *   1. Quais contas são minhas? (mesmo CPF, e-mails diferentes)
 *   2. Onde meu CPF está vinculado? (famílias, causas, empresas, doações)
 *
 * O usuário NÃO digita CPF em lugar nenhum desta tela — e isso é
 * proposital. As contas aparecem porque cada uma comprovou a posse do
 * próprio CPF no Gate 1. CPF não é segredo; se digitar CPF revelasse
 * vínculos, a tela seria um consultor de vínculos de qualquer pessoa.
 */

const TYPE_LABELS = {
  family: 'Família',
  cause: 'Causa',
  company: 'Empresa',
  donation: 'Doação',
};

const ROLE_LABELS = {
  owner: 'Dono',
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
};

export default function AccountsPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [links, setLinks] = useState([]);
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Em paralelo: são independentes e a tela só renderiza com as duas.
        const [accountsData, linksData] = await Promise.all([
          meApi.accounts(),
          meApi.links(),
        ]);

        if (cancelled) return;

        setAccounts(accountsData.accounts || []);
        setLinked(Boolean(accountsData.linked));
        setLinks(linksData.links || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Não foi possível carregar suas contas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /**
   * Troca de conta.
   * O backend valida que a conta de destino é da mesma pessoa e devolve
   * method: 'reauth' — ele não emite token do Firebase (ver MeController).
   * Levamos o usuário ao login com o e-mail de destino já preenchido, para
   * ele não precisar lembrar em qual conta estava.
   */
  const handleSwitch = async (targetId) => {
    setSwitching(targetId);
    setError('');

    try {
      const result = await meApi.switchAccount(targetId);

      if (result.method === 'reauth') {
        navigate(`/login?email=${encodeURIComponent(result.target.email || '')}&switch=1`);
        return;
      }

      setError('Método de troca não reconhecido. Atualize o aplicativo.');
    } catch (err) {
      setError(err.message || 'Não foi possível trocar de conta.');
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500 py-8">Carregando suas contas...</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Minhas contas e vínculos
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Contas suas agrupadas pelo mesmo CPF, e onde elas aparecem no sistema.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Contas */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Contas ({accounts.length})
        </h2>

        {!linked && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 text-sm mb-3">
            Esta conta ainda não tem CPF verificado, então não há como agrupá-la
            com outras contas suas.{' '}
            <button
              onClick={() => navigate('/profile')}
              className="underline font-bold"
            >
              Completar perfil
            </button>
          </div>
        )}

        <div className="grid gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 ${
                account.is_current
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="min-w-0">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  {account.nickname || account.name}
                  {account.is_current && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Conta atual
                    </span>
                  )}
                </div>
                {/* O e-mail é o que distingue uma conta da outra. */}
                <div className="text-sm text-gray-600 truncate">{account.email}</div>
                {account.profile_status !== 'active' && (
                  <div className="text-xs text-amber-700 mt-1">Perfil incompleto</div>
                )}
              </div>

              {!account.is_current && (
                <button
                  onClick={() => handleSwitch(account.id)}
                  disabled={switching === account.id}
                  className="bg-brand-accent hover:bg-brand-accent-strong text-white text-sm font-bold px-4 py-2 rounded transition disabled:opacity-50"
                >
                  {switching === account.id ? 'Trocando...' : 'Usar esta conta'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Vínculos */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Vínculos ({links.length})
        </h2>

        {links.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum vínculo ainda. Espaços de família, causas e empresas
            aparecerão aqui conforme forem criados.
          </p>
        ) : (
          <div className="grid gap-3">
            {links.map((link) => (
              <div
                key={`${link.space_id}-${link.through_account.id}`}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-900">{link.space_name}</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[link.space_type] || link.space_type}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[link.role] || link.role}
                  </span>
                  {link.pending && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Convite pendente
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  pela conta {link.through_account.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-400 border-t border-gray-200 pt-4">
        Estes vínculos são apenas seus. O sistema não permite consultar
        vínculos de outra pessoa a partir de um CPF.
        {tenant?.email ? ` Conta ativa: ${tenant.email}.` : ''}
      </p>
    </div>
  );
}
