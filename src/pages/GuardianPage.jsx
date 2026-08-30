import { useEffect, useState } from 'react';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { entitiesApi, spacesApi } from '../services/api';
import { WELLNESS_REASON_TEXT } from '../constants/adventure';

export default function GuardianPage() {
  const [spaceId, setSpaceId] = useState(null);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSpace() {
      try {
        const res = await entitiesApi.list();
        if (cancelled) return;

        if (!res.active_space_id) {
          setError('Nenhum espaço ativo.');
          setLoading(false);
          return;
        }

        setSpaceId(res.active_space_id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Não foi possível carregar o espaço.');
          setLoading(false);
        }
      }
    }

    loadSpace();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    loadChecks();
  }, [spaceId, statusFilter]);

  const loadChecks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await spacesApi.wellnessChecks(spaceId, statusFilter ? { status: statusFilter } : {});
      setChecks(res.data || []);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os desvios.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleString('pt-BR');
  };

  const translateStatus = (st) => {
    if (st === 'pending') return 'Pendente';
    if (st === 'ok') return 'Confirmado';
    if (st === 'escalated') return 'Escalado';
    return st;
  };

  if (loading && !checks.length) {
    return <div className="text-gray-500 py-8">Carregando desvios...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            Painel de Proteção
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Desvios de rotina detectados neste espaço.
          </p>
        </div>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="ok">Confirmado</option>
          <option value="escalated">Escalado</option>
        </select>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && checks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded p-4 text-sm">
          Nenhum desvio registrado.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Hora do Pedido</th>
                  <th className="px-4 py-3 font-bold">Pessoa</th>
                  <th className="px-4 py-3 font-bold">Motivo</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Hora da Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {checks.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">{formatDate(c.requested_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.entity?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{WELLNESS_REASON_TEXT[c.reason] || c.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'ok' ? 'bg-green-100 text-green-800' :
                        c.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'escalated' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {translateStatus(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.responded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
