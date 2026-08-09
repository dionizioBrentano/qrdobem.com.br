import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entitiesApi } from '../services/api';

/**
 * Exibe o QR Code de uma entidade já registrada.
 *
 * A imagem vem da API (que é whitelabel e centraliza a geração). Não dá para
 * apontar um <img src> direto para o endpoint: ele exige o Bearer token, então
 * buscamos por fetch e usamos o data URI que volta.
 */
export default function QrCodeModal({ entity, onClose, onUpdated }) {
  const hasInitialQr = Boolean(entity.qr_code_base64);
  const [data, setData] = useState(
    hasInitialQr ? { qr_code_base64: entity.qr_code_base64, url: entity.url } : null
  );
  const [loading, setLoading] = useState(!hasInitialQr);
  const [error, setError] = useState('');

  // Vacinação é o único campo editável depois da criação (trilha Pet).
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [vaccine, setVaccine] = useState({ vaccine_name: '', applied_at: '' });
  const [savingVaccine, setSavingVaccine] = useState(false);
  const [vaccineError, setVaccineError] = useState('');

  useEffect(() => {
    if (hasInitialQr) return;

    let active = true;

    (async () => {
      try {
        const res = await entitiesApi.qrCode(entity.unique_code);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err.data?.error || err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [entity.unique_code, hasInitialQr]);

  // Considera como indisponível se carregou e não tem erro mas também não tem o base64 (null) ou erro 503
  const isUnavailable = !loading && !error && data && !data.qr_code_base64;

  const handleAddVaccination = async (e) => {
    e.preventDefault();
    setSavingVaccine(true);
    setVaccineError('');
    try {
      await entitiesApi.addVaccination(entity.unique_code, vaccine);
      setVaccine({ vaccine_name: '', applied_at: '' });
      setShowVaccineForm(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      setVaccineError(err.data?.error || err.message);
    } finally {
      setSavingVaccine(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900 truncate pr-2">{entity.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5 text-center space-y-4">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm text-left">
              {error.includes('503') || error.includes('QRCODE_UNAVAILABLE') 
                ? 'QR indisponível no momento' 
                : error}
            </div>
          )}

          {isUnavailable && (
            <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm text-left">
              QR indisponível no momento
            </div>
          )}

          {data?.qr_code_base64 && (
            <>
              <img
                src={data.qr_code_base64}
                alt={`QR Code de ${entity.name}`}
                className="mx-auto w-56 h-56 border rounded-lg p-2 bg-white"
              />
              <a
                href={data.qr_code_base64}
                download={`qrdobem-${entity.unique_code}.svg`}
                className="inline-block bg-brand-accent hover:bg-brand-accent-strong text-white px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                Baixar SVG
              </a>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={data.url || entity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  Abrir página pública
                </a>
                <Link
                  to="/messages"
                  onClick={onClose}
                  className="border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  Ver mensagens
                </Link>
              </div>
              <p className="text-xs text-gray-400">
                O SVG é vetorial: pode ser ampliado para impressão sem perder nitidez.
              </p>
            </>
          )}

          {entity.type === 'pet' && (
            <div className="pt-4 border-t text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Vacinas</h3>

              {entity.pet_info?.vaccinations?.length > 0 && (
                <ul className="space-y-1 text-sm mb-2">
                  {entity.pet_info.vaccinations.map((v) => (
                    <li key={v.id} className="flex justify-between gap-4">
                      <span className="text-gray-500">{v.vaccine_name}</span>
                      <span className="text-gray-900">
                        {new Date(v.applied_at + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {vaccineError && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm mb-2">
                  {vaccineError}
                </div>
              )}

              {showVaccineForm ? (
                <form onSubmit={handleAddVaccination} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nome da vacina"
                    value={vaccine.vaccine_name}
                    onChange={(e) => setVaccine({ ...vaccine, vaccine_name: e.target.value })}
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <input
                    type="date"
                    value={vaccine.applied_at}
                    onChange={(e) => setVaccine({ ...vaccine, applied_at: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingVaccine}
                    className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {savingVaccine ? 'Salvando...' : 'Salvar vacina'}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVaccineForm(true)}
                  className="text-sm text-brand-blue hover:underline font-medium"
                >
                  + Adicionar vacina
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
