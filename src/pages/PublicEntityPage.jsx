import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entitiesApi, conversationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidCpf, maskCpf } from '../utils/masks';
import PublicPanicButton from '../components/PublicPanicButton';
import PublicShell from '../components/layout/PublicShell';

// Intervalo do polling da thread, em milissegundos.
const POLL_INTERVAL = 12000;

const storageKey = (uniqueCode) => `qrdobem_conversation_${uniqueCode}`;

// Rótulos dos campos de saúde. Espelha EntityHealthField::FIELD_KEYS.
const HEALTH_LABELS = {
  blood_type: 'Tipo sanguíneo',
  allergies: 'Alergias',
  chronic_conditions: 'Condições crônicas',
  continuous_medications: 'Medicamentos de uso contínuo',
  relevant_surgeries: 'Cirurgias relevantes',
  substance_use_risk: 'Uso de substâncias de risco',
  caregiver_name: 'Cuidador / contato de emergência',
  caregiver_contact: 'Contato do cuidador',
};

const SPECIES_LABELS = {
  dog: 'Cão',
  cat: 'Gato',
  horse: 'Cavalo',
  bird: 'Ave',
  rabbit: 'Coelho',
  reptile: 'Réptil',
  other: 'Outro',
};

const SIZE_LABELS = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };

const NEUTERED_LABELS = { yes: 'Sim', no: 'Não', unknown: 'Não sei' };

const PET_SIMPLE_FIELDS = [
  { key: 'size', label: 'Porte', map: SIZE_LABELS },
  { key: 'color', label: 'Cor' },
  { key: 'is_neutered', label: 'Castrado', map: NEUTERED_LABELS },
  { key: 'physical_description', label: 'Características' },
  { key: 'clinical_notes', label: 'Cuidados' },
  { key: 'reference_contact', label: 'Clínica de referência' },
];

const HANDLING_LABELS = [
  { key: 'handling_fragile', label: 'Frágil' },
  { key: 'handling_light_sensitive', label: 'Sensível à luz ou calor' },
  { key: 'handling_keep_refrigerated', label: 'Manter refrigerado' },
  { key: 'handling_do_not_invert', label: 'Não virar nem inverter' },
  { key: 'handling_sentimental_value', label: 'Valor sentimental alto' },
];

export default function PublicEntityPage() {
  const { uniqueCode } = useParams();
  const { tenant } = useAuth() || {};

  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [conversation, setConversation] = useState(null);
  const [startForm, setStartForm] = useState({
    benefactor_nickname: '',
    message: '',
    recovery_code: '',
  });
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const [showRecover, setShowRecover] = useState(false);
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverError, setRecoverError] = useState('');

  // Guarda o envio bloqueado pela detecção de contato, para reenviar com confirm_risk.
  const [riskWarning, setRiskWarning] = useState(null);

  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyCpf, setEmergencyCpf] = useState('');
  const [emergencyError, setEmergencyError] = useState('');
  const [declaring, setDeclaring] = useState(false);

  const nicknamePrefilled = useRef(false);

  useEffect(() => {
    loadEntity();
  }, [uniqueCode]);

  // Retoma a conversa salva numa visita anterior neste aparelho.
  useEffect(() => {
    const savedId = localStorage.getItem(storageKey(uniqueCode));
    if (!savedId) return;

    conversationsApi
      .get(uniqueCode, savedId)
      .then(setConversation)
      .catch(() => localStorage.removeItem(storageKey(uniqueCode)));
  }, [uniqueCode]);

  // Tenant autenticado que escaneia o QR de outra pessoa continua sendo um
  // benfeitor comum: só ganha o apelido pré-preenchido, e pode trocá-lo.
  useEffect(() => {
    if (nicknamePrefilled.current || !tenant) return;

    const suggested = tenant.nickname || (tenant.name || '').split(' ')[0] || '';
    if (!suggested) return;

    nicknamePrefilled.current = true;
    setStartForm((prev) => (prev.benefactor_nickname ? prev : { ...prev, benefactor_nickname: suggested }));
  }, [tenant]);

  // Polling enquanto a thread estiver aberta, para ver respostas do responsável.
  useEffect(() => {
    if (!conversation?.id) return undefined;

    const timer = setInterval(() => {
      conversationsApi.get(uniqueCode, conversation.id).then(setConversation).catch(() => {});
    }, POLL_INTERVAL);

    return () => clearInterval(timer);
  }, [uniqueCode, conversation?.id]);

  const loadEntity = async () => {
    try {
      const data = await entitiesApi.show(uniqueCode);
      setEntity(data);
    } catch (err) {
      setError(err.status === 404 ? 'Registro não encontrado ou inativo.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const captureLocation = async () => {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      // Localização é opcional
      return { latitude: null, longitude: null };
    }
  };

  const persistConversation = (data) => {
    setConversation(data);
    localStorage.setItem(storageKey(uniqueCode), data.id);
  };

  // Ponto único de envio: usado no primeiro contato, nas respostas seguintes e
  // no reenvio depois do aviso de risco.
  const submit = async (payload, { confirmRisk = false } = {}) => {
    setSending(true);
    setSendError('');
    try {
      const body = confirmRisk ? { ...payload.body, confirm_risk: true } : payload.body;

      const data = payload.conversationId
        ? await conversationsApi.reply(uniqueCode, payload.conversationId, body)
        : await conversationsApi.create(uniqueCode, body);

      persistConversation(data);
      setRiskWarning(null);
      if (payload.conversationId) {
        setReply('');
      } else {
        setStartForm((prev) => ({ ...prev, message: '', recovery_code: '' }));
      }
    } catch (err) {
      if (err.data?.code === 'CONTACT_DETECTED') {
        setRiskWarning({ payload, message: err.data.error });
      } else {
        setSendError(err.data?.error || err.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    const { latitude, longitude } = await captureLocation();
    submit({
      conversationId: null,
      body: {
        message: startForm.message,
        benefactor_nickname: startForm.benefactor_nickname || null,
        recovery_code: startForm.recovery_code || null,
        latitude,
        longitude,
      },
    });
  };

  const handleReply = (e) => {
    e.preventDefault();
    submit({ conversationId: conversation.id, body: { message: reply } });
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setRecoverError('');
    try {
      const data = await conversationsApi.recover(uniqueCode, recoverCode);
      persistConversation(data);
      setShowRecover(false);
      setRecoverCode('');
    } catch (err) {
      setRecoverError(
        err.status === 404 ? 'Nenhuma conversa encontrada com este código.' : err.message
      );
    }
  };

  const handleDeclareEmergency = async (e) => {
    e.preventDefault();
    if (!isValidCpf(emergencyCpf)) {
      setEmergencyError('CPF inválido. Confira os números.');
      return;
    }

    setDeclaring(true);
    setEmergencyError('');
    try {
      await entitiesApi.declareEmergency(uniqueCode, emergencyCpf.replace(/\D/g, ''));
      setShowEmergency(false);
      setEmergencyCpf('');
      // Recarrega para exibir os campos ampliados liberados pela emergência.
      await loadEntity();
    } catch (err) {
      setEmergencyError(err.data?.error || err.message);
    } finally {
      setDeclaring(false);
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent"></div>
            <p className="mt-4 font-bold text-brand-blue text-lg">Carregando...</p>
          </div>
        </div>
      </PublicShell>
    );
  }

  if (error && !entity) {
    return (
      <PublicShell>
        <div className="bg-gray-50 flex-1 flex items-center justify-center p-4 w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <div className="text-5xl mb-4">😔</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Registro não encontrado</h1>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </PublicShell>
    );
  }

  const typeLabels = { person: 'Pessoa', pet: 'Pet', object: 'Objeto' };

  const bubbleClasses = (senderType) => {
    if (senderType === 'system') return 'bg-gray-100 text-gray-500 text-xs mx-auto text-center';
    if (senderType === 'tenant') return 'bg-brand-blue text-white ml-auto';
    return 'bg-gray-50 text-gray-800 border border-gray-200 mr-auto';
  };

  return (
    <PublicShell>
      <div 
        ref={(el) => el && el.focus()} 
        tabIndex="-1" 
        className="bg-gray-50 flex-1 p-4 w-full outline-none"
      >
      <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* White-label / patrocínio (Fase 5, T3-R02/T3-R03).
            Fica no topo, acima do conteúdo, e some quando não há marca —
            sem espaço vazio na interface. */}
        {entity.branding && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-3">
            {entity.branding.logo_url && (
              <img
                src={entity.branding.logo_url}
                alt={entity.branding.name}
                className="h-10 object-contain"
              />
            )}
            <div className="text-center">
              {entity.branding.sponsor_label && (
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {entity.branding.sponsor_label}
                </p>
              )}
              {entity.branding.sponsor_url ? (
                <a
                  href={entity.branding.sponsor_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm font-bold underline"
                  style={entity.branding.primary_color ? { color: entity.branding.primary_color } : undefined}
                >
                  {entity.branding.name}
                </a>
              ) : (
                <p
                  className="text-sm font-bold text-gray-700"
                  style={entity.branding.primary_color ? { color: entity.branding.primary_color } : undefined}
                >
                  {entity.branding.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="inline-block bg-brand-blue/20 text-brand-blue text-xs font-medium px-3 py-1 rounded-full mb-3">
            {typeLabels[entity.type] || entity.type}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{entity.name}</h1>
          <p className="text-gray-500 text-sm">{entity.organization}</p>
        </div>

        {/* Botão de Pânico público (T1-R07): quem encontrou a pessoa avisa
            a família na hora. Só para pessoa — objeto perdido não é
            emergência, e o alarme perderia o sentido se aparecesse sempre. */}
        {entity.type === 'person' && <PublicPanicButton uniqueCode={uniqueCode} />}

        {/* Objeto: texto público em destaque + avisos de manuseio */}
        {entity.type === 'object' && entity.object_info && (
          <>
            {entity.object_info.public_label && (
              <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <p className="text-gray-900 font-medium">{entity.object_info.public_label}</p>
              </div>
            )}

            {(HANDLING_LABELS.some(({ key }) => entity.object_info[key]) ||
              entity.object_info.handling_notes_extra) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-amber-900 mb-2">Cuidados no manuseio</h3>
                <ul className="space-y-1 text-sm text-amber-800">
                  {HANDLING_LABELS.filter(({ key }) => entity.object_info[key]).map(({ key, label }) => (
                    <li key={key}>&bull; {label}</li>
                  ))}
                </ul>
                {entity.object_info.handling_notes_extra && (
                  <p className="text-sm text-amber-800 mt-2">
                    {entity.object_info.handling_notes_extra}
                  </p>
                )}
              </div>
            )}

            {entity.object_info.description && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Descrição</h3>
                <p className="text-gray-700 text-sm">{entity.object_info.description}</p>
              </div>
            )}
          </>
        )}

        {/* Pet: espécie sempre, o resto conforme a API liberar */}
        {entity.type === 'pet' && entity.pet_info && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Sobre o pet</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Espécie</dt>
                <dd className="text-gray-900 font-medium text-right">
                  {entity.pet_info.species === 'other'
                    ? entity.pet_info.species_other_description || 'Outro'
                    : SPECIES_LABELS[entity.pet_info.species] || entity.pet_info.species}
                </dd>
              </div>
              {PET_SIMPLE_FIELDS.filter(({ key }) => entity.pet_info[key]).map(({ key, label, map }) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-gray-900 font-medium text-right">
                    {map ? map[entity.pet_info[key]] || entity.pet_info[key] : entity.pet_info[key]}
                  </dd>
                </div>
              ))}
            </dl>

            {entity.pet_info.vaccinations?.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Vacinas</h4>
                <ul className="space-y-1 text-sm">
                  {entity.pet_info.vaccinations.map((v, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span className="text-gray-500">{v.vaccine_name}</span>
                      <span className="text-gray-900">
                        {new Date(v.applied_at + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Declaração de emergência — só faz sentido na trilha Pessoa */}
        {entity.type === 'person' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <button
              type="button"
              onClick={() => setShowEmergency(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition"
            >
              Declarar Emergência
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Use apenas em situação real de emergência com esta pessoa.
            </p>
          </div>
        )}

        {/* Saúde — a API já entrega só o que pode ser exibido */}
        {entity.health_info && Object.keys(entity.health_info).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-medium text-red-600 mb-2">Informações de Saúde</h3>
            <dl className="space-y-1 text-sm">
              {Object.entries(entity.health_info).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{HEALTH_LABELS[key] || key}</dt>
                  <dd className="text-gray-900 font-medium text-right">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Informações */}
        {entity.additional_info && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Informações Adicionais</h3>
            <p className="text-gray-700 text-sm">{entity.additional_info}</p>
          </div>
        )}

        {/* Atributos customizados */}
        {entity.custom_attributes && Object.keys(entity.custom_attributes).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Detalhes</h3>
            <dl className="space-y-1 text-sm">
              {Object.entries(entity.custom_attributes).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500 capitalize">{key}</dt>
                  <dd className="text-gray-900 font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Conversa */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {conversation ? 'Sua conversa com o responsável' : 'Falar com o responsável'}
          </h3>

          {sendError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-3">{sendError}</div>
          )}

          {riskWarning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-3 space-y-2">
              <p>{riskWarning.message}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => submit(riskWarning.payload, { confirmRisk: true })}
                  disabled={sending}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-xs font-bold transition disabled:opacity-50"
                >
                  Enviar mesmo assim
                </button>
                <button
                  type="button"
                  onClick={() => setRiskWarning(null)}
                  className="text-amber-800 hover:underline text-xs font-medium"
                >
                  Corrigir a mensagem
                </button>
              </div>
            </div>
          )}

          {conversation ? (
            <div className="space-y-3">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {conversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${bubbleClasses(msg.sender_type)}`}
                  >
                    {msg.sender_type === 'benefactor' && msg.sender_name && (
                      <p className="text-xs text-gray-400 mb-0.5">{msg.sender_name}</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {conversation.resolved_at ? (
                <p className="text-center text-sm text-gray-500 py-2">
                  O responsável marcou esta conversa como resolvida. Obrigado pela ajuda!
                </p>
              ) : (
                <form onSubmit={handleReply} className="space-y-2">
                  <textarea
                    placeholder="Escreva sua mensagem"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleStart} className="space-y-3">
                <input
                  type="text"
                  placeholder="Como quer ser chamado"
                  value={startForm.benefactor_nickname}
                  onChange={(e) =>
                    setStartForm({ ...startForm, benefactor_nickname: e.target.value })
                  }
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                />
                <textarea
                  placeholder="Sua mensagem *"
                  value={startForm.message}
                  onChange={(e) => setStartForm({ ...startForm, message: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                />
                <div>
                  <input
                    type="text"
                    placeholder="Código de recuperação (4 caracteres)"
                    value={startForm.recovery_code}
                    onChange={(e) => setStartForm({ ...startForm, recovery_code: e.target.value })}
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Opcional. Escolha um código para conseguir voltar a esta conversa de outro aparelho.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t">
                {showRecover ? (
                  <form onSubmit={handleRecover} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Código de 4 caracteres"
                      value={recoverCode}
                      onChange={(e) => setRecoverCode(e.target.value)}
                      maxLength={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    {recoverError && <p className="text-xs text-red-600">{recoverError}</p>}
                    <button
                      type="submit"
                      className="w-full border border-brand-accent text-brand-accent hover:bg-brand-accent/10 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Recuperar conversa
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRecover(true)}
                    className="text-sm text-brand-blue hover:underline font-medium"
                  >
                    Já conversei sobre isso antes? Informar código de recuperação
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Convite a virar tutor. Quem já é tenant não precisa ver. */}
        {conversation && !tenant && (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-sm text-gray-700">
              Quer ajudar mais vezes? Crie sua conta e ganhe um QR Code de cortesia.
            </p>
            <Link
              to={`/register?trail=benefactor&conversation_id=${conversation.id}`}
              onClick={() => {
                // O cadastro passa por um link enviado por e-mail, e a query string
                // se perde nesse caminho. Mesmo padrão já usado para 'trail'.
                sessionStorage.setItem('qrdobem_trail', 'benefactor');
                sessionStorage.setItem('qrdobem_origin_conversation', conversation.id);
              }}
              className="inline-block mt-3 border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Criar minha conta
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Protegido pelo QR do Bem &bull; qrdobem.com.br
        </p>
      </div>

      {showEmergency && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-red-700">Declarar Emergência</h2>
              <button
                onClick={() => setShowEmergency(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDeclareEmergency} className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                Isso vai expor informações de saúde sensíveis desta pessoa e notificar o
                responsável imediatamente por e-mail. Use apenas em emergência real.
              </div>

              {emergencyError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {emergencyError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu CPF</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={emergencyCpf}
                  onChange={(e) => setEmergencyCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Guardado de forma criptografada. Registra quem declarou a emergência.
                </p>
              </div>

              <button
                type="submit"
                disabled={declaring}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold transition disabled:opacity-50"
              >
                {declaring ? 'Declarando...' : 'Confirmar emergência'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </PublicShell>
  );
}
