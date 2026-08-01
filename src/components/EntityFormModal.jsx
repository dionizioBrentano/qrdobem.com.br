import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entitiesApi } from '../services/api';
import TermAcceptance from './TermAcceptance';

const TYPES = [
  { value: 'person', label: 'Pessoa' },
  { value: 'pet', label: 'Pet' },
  { value: 'object', label: 'Objeto' },
];

// Códigos que o backend devolve quando falta dado de perfil. Nesses casos
// mandar o usuário para /profile resolve; repetir o formulário não.
const PROFILE_ERROR_CODES = ['PROFILE_INCOMPLETE', 'ADDRESS_REQUIRED'];

export default function EntityFormModal({ organizationId, initialType = 'person', onClose, onCreated }) {
  const [form, setForm] = useState({
    type: initialType,
    name: '',
    contact_phone: '',
    contact_email: '',
    medical_info: '',
    additional_info: '',
  });
  const [acceptedTerm, setAcceptedTerm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setForm((prev) => ({ ...prev, type: initialType }));
  }, [initialType]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Trocar o tipo troca o termo — o aceite anterior não vale para o novo texto.
  const changeType = (value) => {
    update('type', value);
    setAcceptedTerm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerm) return;

    setLoading(true);
    setError('');
    setErrorCode('');
    try {
      const res = await entitiesApi.create({
        ...form,
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {result ? 'Registro criado' : 'Novo QR Code'}
          </h2>
          <button
            onClick={result ? onCreated : onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {result ? (
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
                  className="inline-block text-sm text-emerald-600 hover:underline"
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
                className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-2 rounded-lg transition font-medium"
              >
                Abrir página pública
              </a>
              <Link
                to="/messages"
                onClick={onCreated}
                className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-2 rounded-lg transition font-medium"
              >
                Ver mensagens
              </Link>
            </div>

            <button
              onClick={onCreated}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition font-medium"
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
                    onClick={() => changeType(t.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      form.type === t.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                    }`}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de contato *</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de contato</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Informações médicas</label>
              <textarea
                value={form.medical_info}
                onChange={(e) => update('medical_info', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Informações adicionais</label>
              <textarea
                value={form.additional_info}
                onChange={(e) => update('additional_info', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <TermAcceptance
              type={form.type}
              accepted={acceptedTerm}
              onChange={setAcceptedTerm}
            />

            <button
              type="submit"
              disabled={loading || !acceptedTerm}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar QR Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
