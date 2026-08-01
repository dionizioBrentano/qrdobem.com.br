import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { entitiesApi, profileApi } from '../services/api';
import EntityFormModal from '../components/EntityFormModal';
import QrCodeModal from '../components/QrCodeModal';

const FIELD_LABELS = {
  email_verified: 'verificar o e-mail',
  cpf: 'informar o CPF',
  phone: 'informar o telefone',
  address: 'completar o endereço',
};

const describe = (missing = []) =>
  missing.map((m) => FIELD_LABELS[m] || m).join(', ');

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [qrEntity, setQrEntity] = useState(null);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [activeTrail, setActiveTrail] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const queryTrail = searchParams.get('trail');
    const storedTrail = sessionStorage.getItem('qrdobem_trail');
    const trail = queryTrail || storedTrail;
    
    if (['pet', 'person', 'object'].includes(trail)) {
      setActiveTrail(trail);
    }
  }, [searchParams]);

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

  // O perfil diz o que falta para cada gate. Se falhar, o dashboard continua
  // funcionando — só perde os avisos específicos.
  const loadProfile = async () => {
    try {
      setProfile(await profileApi.get());
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    loadEntities();
    loadProfile();
  }, []);

  const handleEntityCreated = () => {
    setShowForm(false);
    sessionStorage.removeItem('qrdobem_trail');
    setActiveTrail(null);
    if (searchParams.has('trail')) {
      searchParams.delete('trail');
      setSearchParams(searchParams, { replace: true });
    }
    loadEntities(activeOrgId);
    loadProfile();
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

  // Na dúvida (perfil não carregou), libera o botão e deixa o backend decidir.
  const canCreate = profile ? profile.can_create_entity : true;
  const missingForEntity = profile?.missing_for_entity || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-right">
          <button
            onClick={() => setShowForm(true)}
            disabled={!canCreate}
            title={canCreate ? '' : 'Complete o perfil para liberar'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Novo QR Code
          </button>
        </div>
      </div>

      {/* Banner de Trilha Ativa */}
      {activeTrail && canCreate && (
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-emerald-900 font-bold">
              Trilha em andamento: QR de {activeTrail === 'person' ? 'Pessoa' : activeTrail === 'pet' ? 'Pet' : 'Objeto'}
            </p>
            <p className="text-sm text-emerald-800">Finalize a criação do seu código.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium transition shadow-sm whitespace-nowrap shrink-0"
          >
            Criar meu QR de {activeTrail === 'person' ? 'Pessoa' : activeTrail === 'pet' ? 'Pet' : 'Objeto'}
          </button>
        </div>
      )}

      {/* Aviso específico do que falta, em vez do genérico "perfil incompleto" */}
      {profile && !canCreate && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start justify-between gap-4">
          <p>
            Para criar QR Codes falta: <strong>{describe(missingForEntity)}</strong>.
          </p>
          <Link
            to="/profile"
            className="underline font-medium whitespace-nowrap hover:text-amber-900"
          >
            Completar perfil
          </Link>
        </div>
      )}

      {profile?.can_create_entity && !profile?.can_purchase && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          Para comprar créditos falta: <strong>{describe(profile.missing_for_purchase)}</strong>.
        </div>
      )}

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
            {data?.entities?.filter((e) => e.status === 'active').length ?? 0}
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">QR Code</th>
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
            {data?.entities?.map((entity) => {
              const isActive = entity.status ? entity.status === 'active' : entity.is_active;

              return (
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
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      isActive ? 'bg-emerald-500' :
                      entity.status === 'suspended' ? 'bg-red-400' : 'bg-gray-300'
                    }`} />
                    {isActive ? 'Ativo' : entity.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQrEntity(entity)}
                        className="text-emerald-600 hover:underline text-xs font-medium"
                      >
                        Ver QR
                      </button>
                      <a
                        href={entity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-emerald-600 text-xs"
                      >
                        Abrir link
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <EntityFormModal
          organizationId={activeOrgId}
          initialType={activeTrail || 'person'}
          onClose={() => setShowForm(false)}
          onCreated={handleEntityCreated}
        />
      )}

      {qrEntity && (
        <QrCodeModal entity={qrEntity} onClose={() => setQrEntity(null)} />
      )}
    </div>
  );
}
