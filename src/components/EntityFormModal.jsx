import { useState } from 'react';
import { entitiesApi } from '../services/api';

const TYPES = [
  { value: 'person', label: 'Pessoa' },
  { value: 'pet', label: 'Pet' },
  { value: 'object', label: 'Objeto' },
];

export default function EntityFormModal({ organizationId, onClose, onCreated }) {
  const [form, setForm] = useState({
    type: 'person',
    name: '',
    contact_phone: '',
    contact_email: '',
    medical_info: '',
    additional_info: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await entitiesApi.create({ ...form, organization_id: organizationId });
      setResult(res);
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {result ? 'QR Code Criado!' : 'Novo QR Code'}
          </h2>
          <button onClick={result ? onCreated : onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>

        {result ? (
          <div className="p-5 text-center space-y-4">
            <div className="text-emerald-600 text-5xl">✓</div>
            <p className="font-medium">{result.message}</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline block text-sm"
            >
              {result.url}
            </a>
            <button
              onClick={onCreated}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('type', t.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar QR Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
