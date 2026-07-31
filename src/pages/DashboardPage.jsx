import { useState, useEffect } from 'react';
import { entitiesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EntityFormModal from '../components/EntityFormModal';

export default function DashboardPage() {
  const { tenant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(null);

  const loadEntities = async (orgId) => {
    setLoading(true);
    setError('');
    try {
      const res = await entitiesApi.list(orgId);
      setData(res);
      setActiveOrgId(res.active_org_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, []);

  const handleEntityCreated = () => {
    setShowForm(false);
    loadEntities(activeOrgId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {data?.profile_status === 'incomplete' && (
            <p className="text-amber-600 text-sm mt-1">
              Perfil incompleto — complete seus dados para gerar QR codes.
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          + Novo QR Code
        </button>
      </div>

      {/* Seletor de organização */}
      {data?.organizations?.length > 1 && (
        <select
          value={activeOrgId || ''}
          onChange={(e) => loadEntities(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {data.organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Créditos disponíveis</p>
          <p className="text-3xl font-bold text-emerald-600">{data?.quota ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">QR Codes ativos</p>
          <p className="text-3xl font-bold text-gray-900">
            {data?.entities?.filter((e) => e.is_active).length ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total registrados</p>
          <p className="text-3xl font-bold text-gray-900">{data?.entities?.length ?? 0}</p>
        </div>
      </div>

      {/* Tabela de entidades */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Criado em</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.entities?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  Nenhum QR Code registrado ainda.
                </td>
              </tr>
            )}
            {data?.entities?.map((entity) => (
              <tr key={entity.unique_code} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{entity.name}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    entity.type === 'person' ? 'bg-blue-100 text-blue-700' :
                    entity.type === 'pet' ? 'bg-amber-100 text-amber-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {entity.type === 'person' ? 'Pessoa' : entity.type === 'pet' ? 'Pet' : 'Objeto'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{entity.created_at}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${entity.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {entity.is_active ? 'Ativo' : 'Inativo'}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={entity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-xs"
                  >
                    Abrir
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <EntityFormModal
          organizationId={activeOrgId}
          onClose={() => setShowForm(false)}
          onCreated={handleEntityCreated}
        />
      )}
    </div>
  );
}
