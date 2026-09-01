import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidCpf, maskCpf, maskCep, maskPhone } from '../utils/masks';
import CpfInput from '../components/CpfInput';
import { lookupCep } from '../services/cepApi';

const FIELD_LABELS = {
  email_verified: 'Verificar o e-mail',
  cpf: 'Informar o CPF',
  phone: 'Informar o telefone',
  nickname: 'Definir um apelido',
  address: 'Completar o endereço',
};

function GateCard({ title, subtitle, ok, missing }) {
  return (
    <div className={`rounded-xl border p-5 ${ok ? 'bg-brand-blue/10 border-brand-blue/30' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <span className={`text-xl leading-none ${ok ? 'text-brand-blue' : 'text-amber-500'}`}>
          {ok ? '✓' : '!'}
        </span>
        <div>
          <p className={`font-semibold ${ok ? 'text-brand-dark' : 'text-amber-800'}`}>{title}</p>
          <p className={`text-sm ${ok ? 'text-brand-blue' : 'text-amber-700'}`}>
            {ok ? subtitle : 'Falta: ' + missing.map((m) => FIELD_LABELS[m] || m).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { refreshTenant } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    phone: '',
    address_zipcode: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
  });

  const [cpf, setCpf] = useState('');
  const [cpfSaving, setCpfSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await profileApi.get();
      setProfile(res);
      const t = res.tenant || {};
      setForm({
        name: t.name || '',
        nickname: t.nickname || '',
        phone: maskPhone(t.phone || ''),
        address_zipcode: maskCep(t.address_zipcode || ''),
        address_street: t.address_street || '',
        address_number: t.address_number || '',
        address_complement: t.address_complement || '',
        address_neighborhood: t.address_neighborhood || '',
        address_city: t.address_city || '',
        address_state: t.address_state || '',
      });
      setCpf(maskCpf(t.cpf || ''));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Preenche o endereço a partir do CEP. Se o ViaCEP estiver fora do ar,
  // o usuário digita na mão — não bloqueamos o formulário por isso.
  const handleCepBlur = async () => {
    const cep = form.address_zipcode.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const data = await lookupCep(cep);
      if (data) {
        setForm((prev) => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      payload.phone = payload.phone.replace(/\D/g, '');
      payload.address_zipcode = payload.address_zipcode.replace(/\D/g, '');
      payload.address_state = (payload.address_state || '').toUpperCase().slice(0, 2);

      // Campos vazios não vão: o backend usa "sometimes" e reclamaria de string vazia
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '' || payload[k] === null) delete payload[k];
      });

      await profileApi.update(payload);
      setSuccess('Perfil atualizado.');
      await load();
      await refreshTenant();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCpf = async () => {
    if (!isValidCpf(cpf)) {
      setError('CPF inválido. Confira os números.');
      return;
    }
    setCpfSaving(true);
    setError('');
    setSuccess('');
    try {
      await profileApi.addDocument({
        document_type: 'cpf',
        document_number: cpf.replace(/\D/g, ''),
        document_country: 'BR',
        is_primary: true,
      });
      setSuccess('CPF cadastrado.');
      await load();
      await refreshTenant();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setCpfSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  const tenant = profile?.tenant || {};
  const emailVerified = Boolean(tenant.email_verified_at);
  const cpfSaved = Boolean(tenant.cpf);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu perfil</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pedimos os dados aos poucos, conforme cada etapa exige. Nada aqui bloqueia sua navegação.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-brand-blue/10 text-brand-blue px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* As duas gates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GateCard
          title="Comprar créditos"
          subtitle="Liberado."
          ok={profile?.can_purchase}
          missing={profile?.missing_for_purchase || []}
        />
        <GateCard
          title="Criar QR Codes"
          subtitle="Liberado."
          ok={profile?.can_create_entity}
          missing={profile?.missing_for_entity || []}
        />
      </div>

      {/* E-mail */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900">E-mail</p>
            <p className="text-sm text-gray-500">{tenant.email || '—'}</p>
          </div>
          {emailVerified ? (
            <span className="text-brand-blue text-sm font-medium whitespace-nowrap">✓ Verificado</span>
          ) : (
            <button
              onClick={() => navigate('/verify')}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              Verificar e-mail
            </button>
          )}
        </div>
      </div>

      {/* CPF */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
        <div>
          <p className="font-medium text-gray-900">CPF</p>
          <p className="text-sm text-gray-500">
            Guardado de forma criptografada. É o que liga cada QR Code a um responsável.
          </p>
        </div>
        <div className="flex gap-2">
            <CpfInput
              value={cpf}
              onChange={setCpf}
              placeholder="000.000.000-00"
              disabled={cpfSaved}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          {!cpfSaved && (
            <button
              onClick={handleSaveCpf}
              disabled={cpfSaving || !cpf}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {cpfSaving ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </div>
        {cpf && !cpfSaved && !isValidCpf(cpf) && (
          <p className="text-xs text-amber-600">Os dígitos verificadores não conferem.</p>
        )}
        {cpfSaved && (
          <p className="text-xs text-gray-400">
            Para corrigir um CPF já cadastrado, fale com o suporte.
          </p>
        )}
      </div>

      {/* Dados pessoais e endereço */}
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <p className="font-medium text-gray-900">Dados de contato e endereço</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apelido</label>
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => update('nickname', e.target.value)}
            maxLength={255}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Como você quer ser chamado quando ajudar alguém pelo QR do Bem — não precisa ser seu nome completo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP {cepLoading && <span className="text-xs text-gray-400">buscando...</span>}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.address_zipcode}
              onChange={(e) => update('address_zipcode', maskCep(e.target.value))}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
            <input
              type="text"
              value={form.address_street}
              onChange={(e) => update('address_street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              value={form.address_number}
              onChange={(e) => update('address_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input
              type="text"
              value={form.address_complement}
              onChange={(e) => update('address_complement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input
              type="text"
              value={form.address_neighborhood}
              onChange={(e) => update('address_neighborhood', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={form.address_city}
              onChange={(e) => update('address_city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
            <input
              type="text"
              value={form.address_state}
              onChange={(e) => update('address_state', e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              placeholder="SP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none uppercase"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
        <div className="mt-8 text-center border-t pt-6">
          <Link to="/painel" className="text-sm text-gray-500 hover:text-brand-blue">
            Voltar ao Painel
          </Link>
        </div>
      </form>
    </div>
  );
}
