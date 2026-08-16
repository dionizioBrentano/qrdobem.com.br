import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { entitiesApi, profileApi, spacesApi } from '../services/api';
import EntityFormModal from '../components/EntityFormModal';
import QrCodeModal from '../components/QrCodeModal';
import CheckoutModal from '../components/CheckoutModal';
import CompleteRegistrationBlock from '../components/CompleteRegistrationBlock';
import SpaceSelector from '../components/SpaceSelector';
import PanicButton from '../components/PanicButton';

// CTA de conversão por trilha de origem. A trilha chega via ?trail= ou
// sessionStorage (ver LoginPage/RegisterPage) e define o texto do botão principal.
const TRAIL_CTA = {
  person: {
    title: 'Proteja quem você ama',
    subtitle: 'Crie um QR Code de identificação e emergência em poucos minutos.',
    button: 'Proteja quem você ama',
  },
  aventura: {
    title: 'Identidade de Emergência',
    subtitle: 'Proteção ativa para quem vive em movimento.',
    button: 'Criar identidade',
  },
  pet: {
    title: 'Proteja seu Pet',
    subtitle: 'Quem encontrar seu pet fala com você na hora, pelo QR Code da coleira.',
    button: 'Proteja seu Pet',
  },
  object: {
    title: 'Rastreie um objeto',
    subtitle: 'Cole o QR Code no que é seu e receba o contato de quem encontrar.',
    button: 'Rastreie um objeto',
  },
};

// Padrão único de todos os CTAs, igual aos botões do menu ("Entrar"/"Doe e
// Ajude"): fundo dourado (brand-accent), texto branco, hover clareando
// (brand-accent-strong). Só o fundo é dourado — o texto continua branco.
const CTA_BASE_CLASS =
  'bg-brand-accent text-white hover:bg-brand-accent-strong text-base font-bold px-6 py-3 rounded-lg shadow-sm transition whitespace-nowrap cursor-pointer';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntityCode, setEditingEntityCode] = useState(null);
  const [qrEntity, setQrEntity] = useState(null);
  const [activeOrgId, setActiveOrgId] = useState(null);
  // Espaço de trilha ativo (F1). Fica null enquanto a API antiga não
  // devolver `active_space_id` — o painel funciona igual nesse caso.
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  const [activeTrail, setActiveTrail] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  // Criação do espaço família — opcional e só oferecida quando não existe um.
  const [familyName, setFamilyName] = useState('Minha família');
  const [familyBusy, setFamilyBusy] = useState(false);
  const [familyError, setFamilyError] = useState('');
  const [familyProfileBlocked, setFamilyProfileBlocked] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const queryTrail = searchParams.get('trail');
    const storedTrail = sessionStorage.getItem('qrdobem_trail');
    const trail = queryTrail || storedTrail;

    if (['pet', 'person', 'object', 'family', 'cause', 'aventura'].includes(trail)) {
      setActiveTrail(trail);
    }
  }, [searchParams]);

  // A causa não é um QR Code: não passa por crédito nem por EntityFormModal.
  // O painel só reconhece a trilha e encaminha para /causa, que é onde o
  // espaço é criado.
  const isCauseTrail = activeTrail === 'cause';

  const clearTrail = () => {
    sessionStorage.removeItem('qrdobem_trail');
    setActiveTrail(null);
    if (searchParams.has('trail')) {
      searchParams.delete('trail');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleCauseCta = () => {
    clearTrail();
    navigate('/causa');
  };

  const loadEntities = async (orgId, spaceId) => {
    setLoading(true);
    setError('');
    try {
      const res = await entitiesApi.list(orgId, spaceId);
      setData(res);
      setActiveOrgId(res.active_org_id);
      // `?? null` e não `|| null`: id 0 não existe, mas manter a semântica
      // evita surpresa se a API mudar.
      setActiveSpaceId(res.active_space_id ?? null);
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
    clearTrail();
    loadEntities(activeOrgId);
    loadProfile();
  };

  const handleDeleteEntity = async (entity) => {
    const confirmMessage = `Tem certeza que deseja excluir "${entity.name}"?\n\nO QR Code deixará de funcionar publicamente, mas os dados básicos serão preservados internamente para fins de auditoria.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await entitiesApi.destroy(entity.unique_code);
      alert('Entidade excluída com sucesso.');
      loadEntities(activeOrgId);
    } catch (err) {
      if (err.status === 403 || err.status === 404) {
        alert('Você não tem permissão para excluir este registro ou ele não existe.');
      } else {
        alert(err.data?.error || err.message || 'Erro ao excluir.');
      }
    }
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

  // Espaço família já existente. Enquanto a API antiga não devolver `spaces`,
  // a lista vem vazia e o botão de criar simplesmente aparece — criar duas
  // vezes é impossível porque, depois do primeiro, `familySpace` existe.
  const familySpace = data?.spaces?.find((s) => s.type === 'family') || null;
  const showCreateFamily = activeTrail === 'family' && !familySpace;
  // A árvore precisa de um espaço para pendurar as pessoas.
  const showFamilyTreeLink = Boolean(familySpace || activeSpaceId);

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
      setShowBuyModal(true);
      return;
    }
    if (type) setActiveTrail(type);
    setEditingEntityCode(null);
    setShowForm(true);
  };

  // Espaço família não consome crédito nem passa pelo EntityFormModal: é só
  // o contêiner que a árvore e o botão de pânico usam depois.
  const handleCreateFamily = async () => {
    setFamilyBusy(true);
    setFamilyError('');
    setFamilyProfileBlocked(false);
    try {
      await spacesApi.create({ type: 'family', name: familyName.trim() || 'Minha família' });
      await loadEntities(activeOrgId);
    } catch (err) {
      // Mesmo Gate 1 da criação de causa (SpaceController@store).
      if (err.status === 403 && String(err.data?.code || '').startsWith('PROFILE')) {
        setFamilyProfileBlocked(true);
      }
      setFamilyError(err.message);
    } finally {
      setFamilyBusy(false);
    }
  };

  // Sem trilha não há tipo de entidade conhecido: o caminho é crédito primeiro.
  const handleGenericCta = () => {
    if (ctaStage === 'profile') {
      document
        .getElementById('completar-cadastro')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setShowBuyModal(true);
  };

  return (
    <div className="space-y-6 relative">

      {/* Bloco de CTA de conversão */}
      <div className="space-y-3">
        {isCauseTrail && (
          <div className="bg-white border border-brand-olive/40 rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-brand-dark">
                  Cadastrar minha causa
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  A causa tem painel próprio: vitrine, fotos e QR Codes em
                  lote. Não é preciso CNPJ nem crédito para começar.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  onClick={handleCauseCta}
                  className={CTA_BASE_CLASS}
                >
                  Configurar minha causa
                </button>
              </div>
            </div>
          </div>
        )}

        {!isCauseTrail && showConversionCta && (
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
                    className={CTA_BASE_CLASS}
                  >
                    QR de Pessoa
                  </button>
                  <button
                    onClick={() => handleTrailCta('pet')}
                    className={CTA_BASE_CLASS}
                  >
                    QR de Pet
                  </button>
                </>
              ) : trailCta ? (
                <button
                  onClick={() => handleTrailCta()}
                  className={CTA_BASE_CLASS}
                >
                  {trailCta.button}
                </button>
              ) : (
                <button
                  onClick={handleGenericCta}
                  className={CTA_BASE_CLASS}
                >
                  Comprar QR Code
                </button>
              )}

              {/* TODO: QR órfão/pré-pago — spec futura (EntityStatus = aguardando_resgate).
                  Quando a detecção existir, este botão substitui o CTA acima. */}
              {false && (
                <button className={CTA_BASE_CLASS}>
                  Aproveite seu QR Code
                </button>
              )}
            </div>
          </div>

          {ctaHint && (
            <p className="text-xs text-gray-500 mt-3">{ctaHint}</p>
          )}

          {/* Opcional: o espaço família só existe se a pessoa quiser. Os QR
              Codes acima funcionam sem ele. */}
          {showCreateFamily && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                Quer reunir todo mundo num espaço só? Crie a família e use a
                árvore para organizar as pessoas.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text" maxLength={255}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Minha família"
                  className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[180px]"
                />
                <button
                  onClick={handleCreateFamily}
                  disabled={familyBusy}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition"
                >
                  {familyBusy ? 'Criando...' : 'Criar espaço família'}
                </button>
              </div>

              {familyError && (
                <p className="text-xs text-red-600 mt-2">
                  {familyError}
                  {familyProfileBlocked && (
                    <>
                      {' '}
                      <Link to="/profile" className="font-bold underline">
                        Completar meu cadastro
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {/* Sempre visível, independente de trilha ou de já ter QR Codes */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            to="/ajuda"
            className="inline-block text-sm text-brand-blue hover:underline font-medium"
          >
            Como cadastrar e gerenciar os dados do seu QR Code
          </Link>

          {showFamilyTreeLink && (
            <Link
              to="/familia"
              className="inline-block text-sm text-brand-blue hover:underline font-medium"
            >
              Árvore da família
            </Link>
          )}
        </div>
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
              onClick={() => {
                setEditingEntityCode(null);
                setShowForm(true);
              }}
              disabled={!allowCreate}
              title={allowCreate ? '' : 'Complete o perfil ou adquira créditos'}
              className="w-full md:w-auto bg-brand-accent hover:bg-brand-accent-strong text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            <button onClick={() => setShowBuyModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-xs font-bold transition">Comprar Créditos</button>
          </div>
        )}

        {/* Botão de Pânico (T1-R07) — versão rústica: alarme no próprio app.
            Só aparece com espaço ativo, porque o alerta vai para os membros
            daquele espaço. */}
        {activeSpaceId && (
          <div className="mb-6">
            <PanicButton spaceId={activeSpaceId} />
          </div>
        )}

        {/* Seletor de espaço de trilha (F1, entrega 0.6).
            Só aparece quando há mais de um espaço. */}
        <SpaceSelector
          spaces={data?.spaces}
          activeSpaceId={activeSpaceId}
          onSelect={(spaceId) => loadEntities(null, spaceId)}
        />

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
            <button onClick={() => setShowBuyModal(true)} disabled={isDashboardBlocked} className="mt-4 text-brand-blue hover:text-brand-blue text-sm font-medium text-left disabled:opacity-50">
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
                      <button 
                        onClick={() => {
                          setEditingEntityCode(entity.unique_code);
                          setShowForm(true);
                        }}
                        className="text-brand-blue hover:underline text-left font-semibold"
                      >
                        {entity.name}
                      </button>
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
                        <button
                          onClick={() => handleDeleteEntity(entity)}
                          className="text-red-500 hover:text-red-700 hover:underline text-xs"
                        >
                          Excluir
                        </button>
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
          activeSpaceId={activeSpaceId}
          uniqueCode={editingEntityCode}
          activeTrail={activeTrail}
          initialType={
            ['family', 'cause', 'aventura'].includes(activeTrail) ? 'person' : (activeTrail || 'person')
          }
          onClose={() => {
            setShowForm(false);
            setEditingEntityCode(null);
          }}
          onCreated={(newCode) => {
            loadEntities(activeOrgId);
            loadProfile();
            if (activeTrail === 'aventura' && newCode && typeof newCode === 'string') {
              clearTrail();
              setEditingEntityCode(newCode);
            } else {
              setShowForm(false);
              setEditingEntityCode(null);
              clearTrail();
            }
          }}
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

      {showBuyModal && (
        <CheckoutModal 
          intent={{ type: 'credits' }} 
          onClose={(success) => {
            setShowBuyModal(false);
            if (success) window.location.reload();
          }} 
        />
      )}
    </div>
  );
}
