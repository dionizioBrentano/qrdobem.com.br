import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { entitiesApi, profileApi } from '../services/api';
import EntityFormModal from '../components/EntityFormModal';
import QrCodeModal from '../components/QrCodeModal';
import PurchaseCreditsModal from '../components/PurchaseCreditsModal';
import CompleteRegistrationBlock from '../components/CompleteRegistrationBlock';

// CTA de conversão por trilha de origem. A trilha chega via ?trail= ou
// sessionStorage (ver LoginPage/RegisterPage) e define o texto do botão principal.
const TRAIL_CTA = {
  person: {
    title: 'Proteja quem você ama',
    subtitle: 'Crie um QR Code de identificação e emergência em poucos minutos.',
    button: 'Proteja quem você ama',
    color: 'bg-brand-blue',
  },
  pet: {
    title: 'Proteja seu Pet',
    subtitle: 'Quem encontrar seu pet fala com você na hora, pelo QR Code da coleira.',
    button: 'Proteja seu Pet',
    color: 'bg-brand-olive',
  },
  object: {
    title: 'Rastreie um objeto',
    subtitle: 'Cole o QR Code no que é seu e receba o contato de quem encontrar.',
    button: 'Rastreie um objeto',
    color: 'bg-brand-blue',
  },
};

const CTA_BASE_CLASS =
  'text-white text-base font-bold px-6 py-3 rounded-lg shadow-sm transition hover:brightness-90 whitespace-nowrap';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [qrEntity, setQrEntity] = useState(null);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [activeTrail, setActiveTrail] = useState(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const queryTrail = searchParams.get('trail');
    const storedTrail = sessionStorage.getItem('qrdobem_trail');
    const trail = queryTrail || storedTrail;
    
    if (['pet', 'person', 'object', 'family'].includes(trail)) {
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error && !String(error).includes('402')) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  const canCreate = profile ? profile.can_create_entity : true;
  const canPurchase = profile ? profile.can_purchase : true;
  const missingForEntity = profile?.missing_for_entity || [];
  const missingForPurchase = profile?.missing_for_purchase || [];
  const noCredits = data?.quota === 0 || String(error).includes('402');
  
  // Dashboard liberado se pode comprar ou pode criar
  const isDashboardBlocked = (!canPurchase && missingForPurchase.length > 0) || (!canCreate && missingForEntity.length > 0);
  const allowCreate = canCreate && !noCredits && !isDashboardBlocked;
  
  const creditsStatus = searchParams.get('credits');

  // O bloco de conversão fica fora da camada bloqueada: ele existe justamente
  // para converter quem ainda não tem nada no painel.
  const hasEntities = (data?.entities?.length ?? 0) > 0;
  const showConversionCta = Boolean(activeTrail) || !hasEntities;
  const trailCta = TRAIL_CTA[activeTrail] || null;

  // O CTA mantém sempre o mesmo texto de apelo, mas leva ao próximo obstáculo
  // real do usuário: pendências de cadastro -> créditos -> criação do QR.
  // A trilha continua no sessionStorage, então ao resolver cada etapa o
  // próprio CTA avança sozinho para a seguinte.
  const ctaStage = isDashboardBlocked ? 'profile' : (!canCreate || noCredits) ? 'credits' : 'create';

  const ctaHint = {
    profile: 'Falta pouco: complete seus dados no bloco abaixo para liberar a criação.',
    credits: 'Você precisa de 1 crédito para criar este QR Code.',
    create: null,
  }[ctaStage];

  const handleTrailCta = (type = null) => {
    if (ctaStage === 'profile') {
      document
        .getElementById('completar-cadastro')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (ctaStage === 'credits') {
      setShowPurchase(true);
      return;
    }
    if (type) setActiveTrail(type);
    setShowForm(true);
  };

  // Sem trilha não há tipo de entidade conhecido: o caminho é crédito primeiro.
  const handleGenericCta = () => {
    if (ctaStage === 'profile') {
      document
        .getElementById('completar-cadastro')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setShowPurchase(true);
  };

  return (
    <div className="space-y-6 relative">

      {/* Bloco de CTA de conversão */}
      <div className="space-y-3">
        {showConversionCta && (
        <div className="bg-white border border-brand-blue/30 rounded-xl shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-brand-dark">
                {activeTrail === 'family'
                  ? 'Proteja sua família'
                  : trailCta?.title || 'Comece seu primeiro QR Code'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {activeTrail === 'family'
                  ? 'Cadastre um QR por pessoa ou pet. A gestão em grupo virá depois.'
                  : trailCta?.subtitle ||
                    'Adquira um crédito e cadastre o QR Code de uma pessoa, pet ou objeto.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {activeTrail === 'family' ? (
                <>
                  <button
                    onClick={() => handleTrailCta('person')}
                    className={`${CTA_BASE_CLASS} bg-brand-blue`}
                  >
                    QR de Pessoa
                  </button>
                  <button
                    onClick={() => handleTrailCta('pet')}
                    className={`${CTA_BASE_CLASS} bg-brand-olive`}
                  >
                    QR de Pet
                  </button>
                </>
              ) : trailCta ? (
                <button
                  onClick={() => handleTrailCta()}
                  className={`${CTA_BASE_CLASS} ${trailCta.color}`}
                >
                  {trailCta.button}
                </button>
              ) : (
                <button
                  onClick={handleGenericCta}
                  className={`${CTA_BASE_CLASS} bg-brand-blue`}
                >
                  Comprar QR Code
                </button>
              )}

              {/* TODO: QR órfão/pré-pago — spec futura (EntityStatus = aguardando_resgate).
                  Quando a detecção existir, este botão substitui o CTA acima. */}
              {false && (
                <button className={`${CTA_BASE_CLASS} bg-brand-olive`}>
                  Aproveite seu QR Code
                </button>
              )}
            </div>
          </div>

          {ctaHint && (
            <p className="text-xs text-gray-500 mt-3">{ctaHint}</p>
          )}
        </div>
        )}

        {/* Sempre visível, independente de trilha ou de já ter QR Codes */}
        <Link
          to="/ajuda"
          className="inline-block text-sm text-brand-blue hover:underline font-medium"
        >
          Como cadastrar e gerenciar os dados do seu QR Code
        </Link>
      </div>

      {/* Bloco de cadastro pendente — alvo do CTA quando há pendências */}
      {isDashboardBlocked && (
        <div id="completar-cadastro" className="scroll-mt-24">
          <CompleteRegistrationBlock
            profile={profile}
            onComplete={() => {
              loadProfile();
              loadEntities(activeOrgId);
            }}
          />
        </div>
      )}

      {/* Camada de bloqueio visual para o restante do dashboard */}
      <div className={isDashboardBlocked ? 'opacity-50 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
          <div className="w-full md:w-auto text-right">
            <button
              onClick={() => setShowForm(true)}
              disabled={!allowCreate}
              title={allowCreate ? '' : 'Complete o perfil ou adquira créditos'}
              className="w-full md:w-auto bg-brand-blue hover:brightness-90 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Novo QR Code
            </button>
          </div>
        </div>

        {creditsStatus === 'success' && (
          <div className="bg-brand-blue/10 border border-brand-blue/30 text-brand-dark px-4 py-3 rounded-lg text-sm font-medium mb-6">
            Pagamento aprovado! Seus créditos já foram liberados.
          </div>
        )}
        {creditsStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm font-medium mb-6">
            Pagamento pendente. Seus créditos serão liberados assim que for confirmado.
          </div>
        )}
        {creditsStatus === 'failure' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium mb-6">
            Ocorreu um erro no pagamento ou ele foi cancelado. Tente novamente.
          </div>
        )}

        {/* Mensagem de falta de créditos */}
        {noCredits && !isDashboardBlocked && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex justify-between items-center mb-6">
            <span>Sem créditos no momento. Adquira mais para continuar criando.</span>
            <button onClick={() => setShowPurchase(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-xs font-bold transition">Comprar Créditos</button>
          </div>
        )}

        {/* Seletor de organização */}
        {data?.organizations?.length > 1 && (
          <select
            value={activeOrgId || ''}
            onChange={(e) => loadEntities(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm mb-6 block"
          >
            {data.organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        )}

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between">
            <div>
              <p className="text-sm text-gray-500">Créditos disponíveis</p>
              <p className="text-3xl font-bold text-brand-blue">{data?.quota ?? 0}</p>
            </div>
            <button onClick={() => setShowPurchase(true)} disabled={isDashboardBlocked} className="mt-4 text-brand-blue hover:text-brand-blue text-sm font-medium text-left disabled:opacity-50">
              + Comprar Créditos
            </button>
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
        <div className="bg-white rounded-xl shadow-sm border w-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
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
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {entity.name}
                      {entity.has_active_emergency && (
                        <span className="inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          EMERGÊNCIA
                        </span>
                      )}
                    </td>
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
                        isActive ? 'bg-brand-blue/100' :
                        entity.status === 'suspended' ? 'bg-red-400' : 'bg-gray-300'
                      }`} />
                      {isActive ? 'Ativo' : entity.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQrEntity(entity)}
                          className="text-brand-blue hover:underline text-xs font-medium"
                        >
                          Ver QR
                        </button>
                        <a
                          href={entity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-brand-blue text-xs"
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
        </div>
      </div>

      {showForm && (
        <EntityFormModal
          organizationId={activeOrgId}
          initialType={activeTrail === 'family' ? 'person' : (activeTrail || 'person')}
          onClose={() => setShowForm(false)}
          onCreated={handleEntityCreated}
        />
      )}

      {qrEntity && (
        <QrCodeModal
          entity={qrEntity}
          onClose={() => setQrEntity(null)}
          onUpdated={() => {
            setQrEntity(null);
            loadEntities(activeOrgId);
          }}
        />
      )}

      {showPurchase && (
        <PurchaseCreditsModal onClose={() => setShowPurchase(false)} />
      )}
    </div>
  );
}
