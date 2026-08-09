import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entitiesApi, reauthHandler } from '../services/api';
import TermAcceptance from './TermAcceptance';

const TYPES = [
  { value: 'person', label: 'Pessoa' },
  { value: 'pet', label: 'Pet' },
  { value: 'object', label: 'Objeto' },
];

// Códigos que o backend devolve quando falta dado de perfil. Nesses casos
// mandar o usuário para /profile resolve; repetir o formulário não.
const PROFILE_ERROR_CODES = ['PROFILE_INCOMPLETE', 'ADDRESS_REQUIRED'];

// Espelham os limites já validados em EntityController::store.
const MAX_CUSTOM_ATTRS = 20;
const CUSTOM_ATTR_KEY_MAX = 100;
const CUSTOM_ATTR_VALUE_MAX = 500;

// Lista fechada, espelha EntityHealthField::FIELD_KEYS no backend.
// `restricted` marca os que nunca podem virar públicos.
// NOTA: blood_type foi movido para um campo separado na interface (caixas de seleção).
const HEALTH_FIELDS = [
  { key: 'allergies', label: 'Alergias' },
  { key: 'chronic_conditions', label: 'Condições crônicas', placeholder: 'Diabetes, epilepsia...' },
  { key: 'continuous_medications', label: 'Medicamentos de uso contínuo', restricted: true },
  { key: 'relevant_surgeries', label: 'Cirurgias ou procedimentos relevantes' },
  { key: 'substance_use_risk', label: 'Uso de substâncias de risco', restricted: true },
  { key: 'caregiver_name', label: 'Nome do cuidador / contato de emergência' },
  { key: 'caregiver_contact', label: 'Contato do cuidador', emergencyOnly: true },
];

// Listas fechadas da trilha Pet, espelham as constantes de EntityPetField.
const SPECIES = [
  { value: 'dog', label: 'Cão' },
  { value: 'cat', label: 'Gato' },
  { value: 'horse', label: 'Cavalo' },
  { value: 'bird', label: 'Ave' },
  { value: 'rabbit', label: 'Coelho' },
  { value: 'reptile', label: 'Réptil' },
  { value: 'other', label: 'Outro' },
];

const SIZES = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
];

const NEUTERED_STATES = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unknown', label: 'Não sei' },
];

// Lista fechada dos 5 avisos de manuseio da trilha Objeto.
const HANDLING_FLAGS = [
  { key: 'handling_fragile', label: 'Frágil' },
  { key: 'handling_light_sensitive', label: 'Sensível à luz/calor' },
  { key: 'handling_keep_refrigerated', label: 'Manter refrigerado' },
  { key: 'handling_do_not_invert', label: 'Não virar/inverter' },
  { key: 'handling_sentimental_value', label: 'Valor sentimental alto' },
];

const PUBLIC_LABEL_MAX = 200;

const EMPTY_PET_FIELDS = {
  species: 'dog',
  species_other_description: '',
  size: '',
  size_is_public: true,
  color: '',
  color_is_public: true,
  is_neutered: '',
  is_neutered_is_public: true,
  physical_description: '',
  physical_description_is_public: true,
  clinical_notes: '',
  clinical_notes_is_public: true,
  reference_contact: '',
  reference_contact_is_public: false,
};

const EMPTY_OBJECT_FIELDS = {
  description: '',
  description_is_public: false,
  public_label: '',
  handling_fragile: false,
  handling_light_sensitive: false,
  handling_keep_refrigerated: false,
  handling_do_not_invert: false,
  handling_sentimental_value: false,
  handling_notes_extra: '',
};

export default function EntityFormModal({ organizationId, uniqueCode, initialType = 'person', onClose, onCreated }) {
  const [form, setForm] = useState({
    type: initialType,
    name: '',
    contact_phone: '',
    contact_email: '',
    additional_info: '',
  });
  const [customAttrs, setCustomAttrs] = useState([]);
  const [healthFields, setHealthFields] = useState({});
  const [bloodType, setBloodType] = useState('');
  const [bloodRh, setBloodRh] = useState('');
  const [petFields, setPetFields] = useState(EMPTY_PET_FIELDS);
  const [vaccinations, setVaccinations] = useState([]);
  const [objectFields, setObjectFields] = useState(EMPTY_OBJECT_FIELDS);
  const [acceptedTerm, setAcceptedTerm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState(null);

  const isEditing = Boolean(uniqueCode);

  useEffect(() => {
    if (!isEditing) {
       setForm((prev) => ({ ...prev, type: initialType }));
       return;
    }

    const loadEntity = async () => {
      setLoadingEdit(true);
      setError('');
      try {
        const res = await entitiesApi.getForEdit(uniqueCode);
        setForm({
          type: res.type,
          name: res.name || '',
          contact_phone: res.contact_phone || '',
          contact_email: res.contact_email || '',
          additional_info: res.additional_info || '',
        });
        
        if (res.custom_attributes) {
           setCustomAttrs(Object.entries(res.custom_attributes).map(([key, value]) => ({ key, value })));
        }
        
        if (res.health_fields) {
           const hFields = {};
           res.health_fields.forEach(hf => {
               hFields[hf.field_key] = { value: hf.field_value, is_public: hf.is_public };
               if (hf.field_key === 'blood_type') {
                   const val = hf.field_value || '';
                   if (val.includes('+')) { setBloodRh('+'); setBloodType(val.replace('+', '').trim()); }
                   else if (val.includes('-')) { setBloodRh('-'); setBloodType(val.replace('-', '').trim()); }
                   else { setBloodRh(''); setBloodType(val.trim()); }
               }
           });
           setHealthFields(hFields);
        }
        
        if (res.type === 'pet' && res.pet_fields) {
           const pf = res.pet_fields;
           setPetFields({
               species: pf.species || 'dog',
               species_other_description: pf.species_other_description || '',
               size: pf.size || '',
               size_is_public: Boolean(pf.size_is_public ?? true),
               color: pf.color || '',
               color_is_public: Boolean(pf.color_is_public ?? true),
               is_neutered: pf.is_neutered || '',
               is_neutered_is_public: Boolean(pf.is_neutered_is_public ?? true),
               physical_description: pf.physical_description || '',
               physical_description_is_public: Boolean(pf.physical_description_is_public ?? true),
               clinical_notes: pf.clinical_notes || '',
               clinical_notes_is_public: Boolean(pf.clinical_notes_is_public ?? true),
               reference_contact: pf.reference_contact || '',
               reference_contact_is_public: Boolean(pf.reference_contact_is_public ?? false),
           });
        }
        
        if (res.vaccinations) {
           setVaccinations(res.vaccinations.map(v => ({ vaccine_name: v.vaccine_name, applied_at: v.applied_at })));
        }
        
        if (res.type === 'object' && res.object_fields) {
           const of = res.object_fields;
           setObjectFields({
               description: of.description || '',
               description_is_public: Boolean(of.description_is_public),
               public_label: of.public_label || '',
               handling_fragile: Boolean(of.handling_fragile),
               handling_light_sensitive: Boolean(of.handling_light_sensitive),
               handling_keep_refrigerated: Boolean(of.handling_keep_refrigerated),
               handling_do_not_invert: Boolean(of.handling_do_not_invert),
               handling_sentimental_value: Boolean(of.handling_sentimental_value),
               handling_notes_extra: of.handling_notes_extra || '',
           });
        }

      } catch (err) {
        setError('Erro ao carregar dados da entidade.');
      } finally {
        setLoadingEdit(false);
      }
    };
    loadEntity();
  }, [uniqueCode, initialType, isEditing]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addCustomAttr = () =>
    setCustomAttrs((prev) =>
      prev.length >= MAX_CUSTOM_ATTRS ? prev : [...prev, { key: '', value: '' }]
    );

  const updateCustomAttr = (index, field, value) =>
    setCustomAttrs((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr))
    );

  const removeCustomAttr = (index) =>
    setCustomAttrs((prev) => prev.filter((_, i) => i !== index));

  const updatePetField = (field, value) => setPetFields((prev) => ({ ...prev, [field]: value }));

  const updateObjectField = (field, value) =>
    setObjectFields((prev) => ({ ...prev, [field]: value }));

  const addVaccination = () =>
    setVaccinations((prev) => [...prev, { vaccine_name: '', applied_at: '' }]);

  const updateVaccination = (index, field, value) =>
    setVaccinations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );

  const removeVaccination = (index) =>
    setVaccinations((prev) => prev.filter((_, i) => i !== index));

  const updateHealthField = (key, patch) =>
    setHealthFields((prev) => ({
      ...prev,
      [key]: { value: '', is_public: false, ...prev[key], ...patch },
    }));

  // Trocar o tipo troca o termo — o aceite anterior não vale para o novo texto.
  const changeType = (value) => {
    update('type', value);
    setAcceptedTerm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !acceptedTerm) return;

    setLoading(true);
    setError('');
    setErrorCode('');
    
    // Validação extra de segurança para edições
    if (isEditing && reauthHandler) {
      const success = await reauthHandler(
        'Autorização Necessária',
        'Por segurança, confirme sua senha (e código 2FA, se ativado) para salvar as alterações deste QR Code.'
      );
      if (!success) {
        setLoading(false);
        return;
      }
    }
    
    try {
      // Pares incompletos não vão para a API — o backend espera chave e valor.
      const attributes = customAttrs.reduce((acc, { key, value }) => {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey && trimmedValue) acc[trimmedKey] = trimmedValue;
        return acc;
      }, {});

      const health = HEALTH_FIELDS.reduce((acc, { key, restricted }) => {
        const entry = healthFields[key];
        if (entry?.value?.trim()) {
          acc.push({
            field_key: key,
            field_value: entry.value.trim(),
            is_public: restricted ? false : Boolean(entry.is_public),
          });
        }
        return acc;
      }, []);

      const bloodStr = bloodType ? `${bloodType}${bloodRh}` : '';
      if (bloodStr) {
        health.push({
          field_key: 'blood_type',
          field_value: bloodStr,
          is_public: Boolean(healthFields['blood_type']?.is_public),
        });
      }

      const payload = {
        ...form,
        ...(Object.keys(attributes).length > 0 && { custom_attributes: attributes }),
        ...(health.length > 0 && { health_fields: health }),
        ...(form.type === 'pet' && {
          pet_fields: {
            ...petFields,
            species_other_description:
              petFields.species === 'other' ? petFields.species_other_description : null,
            size: petFields.size || null,
            is_neutered: petFields.is_neutered || null,
          },
          vaccinations: vaccinations.filter((v) => v.vaccine_name.trim() && v.applied_at),
        }),
        ...(form.type === 'object' && { object_fields: objectFields }),
      };

      if (isEditing) {
        await entitiesApi.update(uniqueCode, payload);
        onCreated();
        return;
      }

      const res = await entitiesApi.create({
        ...payload,
        organization_id: organizationId,
        accept_term: true,
      });
      setResult(res);
    } catch (err) {
      const code = err.data?.code;
      const status = err.status;
      let msg = err.data?.error || err.message;
      
      if (code === 'PROFILE_INCOMPLETE') msg = 'Cadastro do responsável financeiro pendente ou perfil incompleto.';
      else if (code === 'ADDRESS_REQUIRED') msg = 'O endereço é obrigatório para criar um QR Code.';
      else if (code === 'TERM_REQUIRED') msg = 'Você precisa aceitar o termo de responsabilidade.';
      // No texto público impresso não existe "enviar mesmo assim": o cadastro
      // fica bloqueado até o texto ser corrigido.
      else if (code === 'CONTACT_DETECTED') msg = 'O texto público não pode conter telefone ou e-mail. Corrija o campo e tente de novo — o cadastro não foi concluído.';
      else if (status === 402) msg = 'Saldo insuficiente ou organização sem créditos.';
      else if (status === 422) msg = 'Os dados informados são inválidos. Verifique os campos.';
      else if (status === 401) msg = 'Sua sessão expirou. Faça login novamente.';

      setError(msg);
      setErrorCode(code || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {result ? 'Registro criado' : (isEditing ? 'Editar QR Code' : 'Novo QR Code')}
          </h2>
          <button
            onClick={result ? onCreated : onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {loadingEdit ? (
          <div className="p-10 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
          </div>
        ) : result ? (
          <div className="p-5 text-center space-y-4">
            <p className="text-sm text-gray-600">Compartilhe ou imprima o QR.</p>
            {result.qr_code_base64 ? (
              <>
                <img
                  src={result.qr_code_base64}
                  alt="QR Code gerado"
                  className="mx-auto w-48 h-48 border rounded-lg p-2 bg-white"
                />
                <a
                  href={result.qr_code_base64}
                  download={`qrdobem-${result.unique_code}.svg`}
                  className="inline-block text-sm text-brand-blue hover:underline"
                >
                  Baixar QR Code (SVG)
                </a>
              </>
            ) : (
              <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm text-left">
                O registro foi criado, mas o servidor não devolveu a imagem do QR Code.
                Verifique se a biblioteca de geração está instalada na API.
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-6 py-2 rounded-lg transition font-medium"
              >
                Abrir página pública
              </a>
              <Link
                to="/messages"
                onClick={onCreated}
                className="border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-6 py-2 rounded-lg transition font-medium"
              >
                Ver mensagens
              </Link>
            </div>

            <button
              onClick={onCreated}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white px-6 py-2 rounded-lg transition font-medium"
            >
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p>{error}</p>
                {PROFILE_ERROR_CODES.includes(errorCode) && (
                  <Link to="/profile" className="underline font-medium mt-1 inline-block">
                    Completar meu perfil
                  </Link>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => !isEditing && changeType(t.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      form.type === t.value
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-brand-blue'
                    } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={isEditing}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de contato *</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de contato</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              />
            </div>

            {form.type === 'pet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sobre o pet</label>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Espécie *</label>
                    <select
                      value={petFields.species}
                      onChange={(e) => updatePetField('species', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    >
                      {SPECIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Sempre visível na página pública.</p>
                  </div>

                  {petFields.species === 'other' && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Qual espécie? *</label>
                      <input
                        type="text"
                        value={petFields.species_other_description}
                        onChange={(e) => updatePetField('species_other_description', e.target.value)}
                        required
                        maxLength={255}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Porte</label>
                    <select
                      value={petFields.size}
                      onChange={(e) => updatePetField('size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    >
                      <option value="">Não informar</option>
                      {SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petFields.size_is_public}
                        onChange={(e) => updatePetField('size_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Cor</label>
                    <input
                      type="text"
                      value={petFields.color}
                      onChange={(e) => updatePetField('color', e.target.value)}
                      placeholder="Caramelo, preto e branco, malhado..."
                      maxLength={255}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petFields.color_is_public}
                        onChange={(e) => updatePetField('color_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Castrado</label>
                    <select
                      value={petFields.is_neutered}
                      onChange={(e) => updatePetField('is_neutered', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    >
                      <option value="">Não informar</option>
                      {NEUTERED_STATES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petFields.is_neutered_is_public}
                        onChange={(e) => updatePetField('is_neutered_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Características e particularidades</label>
                    <textarea
                      value={petFields.physical_description}
                      onChange={(e) => updatePetField('physical_description', e.target.value)}
                      rows={2}
                      placeholder="Marcas, pelagem, cicatrizes, comportamento notável"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petFields.physical_description_is_public}
                        onChange={(e) => updatePetField('physical_description_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Cuidados</label>
                    <textarea
                      value={petFields.clinical_notes}
                      onChange={(e) => updatePetField('clinical_notes', e.target.value)}
                      rows={2}
                      placeholder="Condições clínicas relevantes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petFields.clinical_notes_is_public}
                        onChange={(e) => updatePetField('clinical_notes_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Clínica ou petshop de referência</label>
                    <input
                      type="text"
                      value={petFields.reference_contact}
                      onChange={(e) => updatePetField('reference_contact', e.target.value)}
                      maxLength={255}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petFields.reference_contact_is_public}
                        onChange={(e) => updatePetField('reference_contact_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Vacinas</label>
                    {vaccinations.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {vaccinations.map((v, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nome da vacina"
                              value={v.vaccine_name}
                              onChange={(e) => updateVaccination(index, 'vaccine_name', e.target.value)}
                              maxLength={255}
                              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                            <input
                              type="date"
                              value={v.applied_at}
                              onChange={(e) => updateVaccination(index, 'applied_at', e.target.value)}
                              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeVaccination(index)}
                              aria-label="Remover vacina"
                              className="px-3 text-gray-400 hover:text-red-600 text-xl leading-none shrink-0"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={addVaccination}
                      className="text-sm text-brand-blue hover:underline font-medium"
                    >
                      + Adicionar vacina
                    </button>
                  </div>
                </div>
              </div>
            )}

            {form.type === 'object' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sobre o objeto</label>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Descrição do objeto</label>
                    <textarea
                      value={objectFields.description}
                      onChange={(e) => updateObjectField('description', e.target.value)}
                      rows={2}
                      placeholder="O que o objeto é, de fato"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={objectFields.description_is_public}
                        onChange={(e) => updateObjectField('description_is_public', e.target.checked)}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-gray-500">Tornar público</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Fica privado por padrão. Revelar o conteúdo publicamente pode ser um risco.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Texto público (aparece impresso junto ao QR)
                    </label>
                    <textarea
                      value={objectFields.public_label}
                      onChange={(e) => updateObjectField('public_label', e.target.value)}
                      rows={2}
                      maxLength={PUBLIC_LABEL_MAX}
                      placeholder="Se encontrou esta mochila, por favor escaneie o QR para contato."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {objectFields.public_label.length}/{PUBLIC_LABEL_MAX} &bull; não pode conter telefone nem e-mail.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Avisos de manuseio</label>
                    <div className="space-y-1">
                      {HANDLING_FLAGS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={objectFields[key]}
                            onChange={(e) => updateObjectField(key, e.target.checked)}
                            className="h-4 w-4 accent-brand-blue"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Outras instruções de manuseio</label>
                    <textarea
                      value={objectFields.handling_notes_extra}
                      onChange={(e) => updateObjectField('handling_notes_extra', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.type === 'person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Informações de saúde</label>
              <p className="text-xs text-gray-400 mb-3">
                Preencha só o que fizer sentido. Cada campo é privado até você marcar como público.
              </p>

              <div className="space-y-3">
                {/* Tipo Sanguíneo (Campos separados) */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Tipo sanguíneo e Fator RH</label>
                  <div className="flex gap-2">
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none bg-white"
                    >
                      <option value="">Não informar</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                    <select
                      value={bloodRh}
                      onChange={(e) => setBloodRh(e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none bg-white"
                      disabled={!bloodType}
                    >
                      <option value="">(Sem RH)</option>
                      <option value="+">Positivo (+)</option>
                      <option value="-">Negativo (-)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(healthFields['blood_type']?.is_public)}
                      onChange={(e) => updateHealthField('blood_type', { is_public: e.target.checked })}
                      className="h-4 w-4 accent-brand-blue"
                    />
                    <span className="text-xs text-gray-500">Tornar público</span>
                  </label>
                </div>

                {HEALTH_FIELDS.map(({ key, label, placeholder, restricted, emergencyOnly }) => (
                  <div key={key}>
                    <label className="block text-sm text-gray-700 mb-1">{label}</label>
                    <input
                      type="text"
                      value={healthFields[key]?.value || ''}
                      onChange={(e) => updateHealthField(key, { value: e.target.value })}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    {restricted ? (
                      <p className="text-xs text-gray-400 mt-1">
                        Este dado só será mostrado a quem declarar uma emergência.
                      </p>
                    ) : emergencyOnly ? (
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(healthFields[key]?.is_public)}
                          onChange={(e) => updateHealthField(key, { is_public: e.target.checked })}
                          className="h-4 w-4 accent-brand-blue"
                        />
                        <span className="text-xs text-gray-500">
                          Liberar em emergência declarada (nunca aparece na página pública)
                        </span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(healthFields[key]?.is_public)}
                          onChange={(e) => updateHealthField(key, { is_public: e.target.checked })}
                          className="h-4 w-4 accent-brand-blue"
                        />
                        <span className="text-xs text-gray-500">Tornar público</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Informações adicionais</label>
              <textarea
                value={form.additional_info}
                onChange={(e) => update('additional_info', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campos personalizados
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Informações extras que aparecem na página pública do QR.
              </p>

              {customAttrs.length > 0 && (
                <div className="space-y-2 mb-2">
                  {customAttrs.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nome do campo"
                        value={attr.key}
                        onChange={(e) => updateCustomAttr(index, 'key', e.target.value)}
                        maxLength={CUSTOM_ATTR_KEY_MAX}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Valor"
                        value={attr.value}
                        onChange={(e) => updateCustomAttr(index, 'value', e.target.value)}
                        maxLength={CUSTOM_ATTR_VALUE_MAX}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomAttr(index)}
                        aria-label="Remover campo"
                        className="px-3 text-gray-400 hover:text-red-600 text-xl leading-none shrink-0"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addCustomAttr}
                disabled={customAttrs.length >= MAX_CUSTOM_ATTRS}
                className="text-sm text-brand-blue hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              >
                + Adicionar campo
              </button>
              {customAttrs.length >= MAX_CUSTOM_ATTRS && (
                <p className="text-xs text-gray-400 mt-1">
                  Limite de {MAX_CUSTOM_ATTRS} campos personalizados atingido.
                </p>
              )}
            </div>

            {!isEditing && (
              <TermAcceptance
                type={form.type}
                accepted={acceptedTerm}
                onChange={setAcceptedTerm}
              />
            )}

            <button
              type="submit"
              disabled={loading || (!isEditing && !acceptedTerm) || loadingEdit}
              className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Registrar QR Code')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
