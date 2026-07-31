import { useState, useEffect } from 'react';
import { entitiesApi } from '../services/api';

/**
 * Exibe o QR Code de uma entidade já registrada.
 *
 * A imagem vem da API (que é whitelabel e centraliza a geração). Não dá para
 * apontar um <img src> direto para o endpoint: ele exige o Bearer token, então
 * buscamos por fetch e usamos o data URI que volta.
 */
export default function QrCodeModal({ entity, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [entity.unique_code]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm text-left">{error}</div>
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
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                Baixar SVG
              </a>
              <div>
                <p className="text-xs text-gray-500 mb-1">Link público</p>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline text-xs break-all"
                >
                  {data.url}
                </a>
              </div>
              <p className="text-xs text-gray-400">
                O SVG é vetorial: pode ser ampliado para impressão sem perder nitidez.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
