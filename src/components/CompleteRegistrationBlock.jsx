import { useState, useEffect } from 'react';
import { profileApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidCpf, maskCpf, maskCep, maskPhone } from '../utils/masks';

export default function CompleteRegistrationBlock({ profile, onComplete }) {
  const { refreshTenant } = useAuth();
  const tenant = profile?.tenant || {};
  
  const missingSet = new Set([
    ...(profile?.missing_for_entity || []),
    ...(profile?.missing_for_purchase || [])
  ]);

  const needsEmail = missingSet.has('email_verified');
  const needsCpf = missingSet.has('cpf');
  const needsPhone = missingSet.has('phone');
  const needsNickname = missingSet.has('nickname');
  const needsAddress = missingSet.has('address');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [form, setForm] = useState({
    phone: maskPhone(tenant.phone || ''),
    nickname: tenant.nickname || '',
    address_zipcode: maskCep(tenant.address_zipcode || ''),
    address_street: tenant.address_street || '',
    address_number: tenant.address_number || '',
    address_complement: tenant.address_complement || '',
    address_neighborhood: tenant.address_neighborhood || '',
    address_city: tenant.address_city || '',
    address_state: tenant.address_state || '',
  });

  const [cpf, setCpf] = useState(maskCpf(tenant.cpf || ''));
  const [cepLoading, setCepLoading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCepBlur = async () => {
    const cep = form.address_zipcode.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } catch {
      // ignorar
    } finally {
      setCepLoading(false);
    }
  };

  const handleSendEmailLink = async () => {
    setSaving(true);
    setError('');
    try {
      await authApi.requestRegisterLink(tenant.email);
      setEmailSent(true);
      setSuccess('Link de confirmação enviado para seu e-mail!');
    } catch (err) {
      setError(err.message || 'Erro ao enviar link.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Salvar CPF se precisar
      if (needsCpf && cpf && !tenant.cpf) {
        if (!isValidCpf(cpf)) {
          throw new Error('CPF inválido. Confira os números.');
        }
        await profileApi.addDocument({
          document_type: 'cpf',
          document_number: cpf.replace(/\D/g, ''),
          document_country: 'BR',
          is_primary: true,
        });
      }

      // 2. Salvar outros dados se precisar
      if (needsPhone || needsNickname || needsAddress) {
        const payload = { ...form };
        payload.phone = payload.phone.replace(/\D/g, '');
        payload.address_zipcode = payload.address_zipcode.replace(/\D/g, '');
        payload.address_state = (payload.address_state || '').toUpperCase().slice(0, 2);

        Object.keys(payload).forEach((k) => {
          if (payload[k] === '' || payload[k] === null) delete payload[k];
        });

        if (Object.keys(payload).length > 0) {
          await profileApi.update(payload);
        }
      }

      await refreshTenant();
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (missingSet.size === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 relative z-10">
      <h2 className="text-lg font-bold text-amber-900 mb-2">Complete o cadastro para liberar o painel</h2>
      <p className="text-amber-800 text-sm mb-4">
        Precisamos de mais algumas informações de segurança para liberar a criação de QR Codes e compra de créditos.
      </p>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {needsEmail && !tenant.email_verified_at && (
          <div className="bg-white p-4 rounded-lg border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">E-mail ({tenant.email})</p>
              <p className="text-sm text-gray-500">Confirme pelo link enviado ao seu e-mail.</p>
            </div>
            <button
              type="button"
              onClick={handleSendEmailLink}
              disabled={saving || emailSent}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 whitespace-nowrap"
            >
              {emailSent ? 'Link reenviado' : 'Reenviar link'}
            </button>
          </div>
        )}

        {needsCpf && !tenant.cpf && (
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">CPF do Responsável</label>
            <input
              type="text"
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              required
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none bg-white"
            />
          </div>
        )}

        {needsPhone && (
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Telefone (WhatsApp)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              required
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none bg-white"
            />
          </div>
        )}

        {needsNickname && (
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Apelido</label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => update('nickname', e.target.value)}
              placeholder="Como quer ser chamado"
              maxLength={255}
              required
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none bg-white"
            />
            <p className="text-xs text-amber-700 mt-1">
              Como você quer ser chamado quando ajudar alguém pelo QR do Bem — não precisa ser seu nome completo.
            </p>
          </div>
        )}

        {needsAddress && (
          <div className="space-y-4 bg-white p-4 rounded-lg border border-amber-100">
            <p className="font-medium text-gray-900 text-sm">Endereço Completo</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">CEP {cepLoading && '...'}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.address_zipcode}
                  onChange={(e) => update('address_zipcode', maskCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Rua</label>
                <input
                  type="text"
                  value={form.address_street}
                  onChange={(e) => update('address_street', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={form.address_number}
                  onChange={(e) => update('address_number', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={form.address_neighborhood}
                  onChange={(e) => update('address_neighborhood', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Cidade / UF</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.address_city}
                    onChange={(e) => update('address_city', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={form.address_state}
                    onChange={(e) => update('address_state', e.target.value.toUpperCase().slice(0, 2))}
                    maxLength={2}
                    placeholder="UF"
                    required
                    className="w-16 px-3 py-2 border border-gray-300 rounded-lg outline-none uppercase text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {(needsCpf || needsPhone || needsNickname || needsAddress) && (
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar e Liberar Painel'}
          </button>
        )}
      </form>
    </div>
  );
}
