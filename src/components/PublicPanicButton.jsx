import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { panicApi } from '../services/api';

/**
 * PublicPanicButton — acionamento do alerta por quem LEU o QR Code.
 * T1-R07 do PLANO_TRILHAS_2026-08.md.
 *
 * Diferente do PanicButton do painel:
 *   - não exige login (quem encontrou a pessoa na rua não tem conta);
 *   - não toca sirene: o alarme aqui atrapalharia o socorro em vez de
 *     ajudar, e o celular é de um terceiro;
 *   - não revela quantos nem quais familiares foram avisados — isso
 *     mapearia a família para um estranho.
 *
 * Confirmação em dois toques pelo mesmo motivo do painel: alarme disparado
 * por engano queima a credibilidade do sistema.
 */
export default function PublicPanicButton({ uniqueCode }) {
  const [armed, setArmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  /** Posição com timeout curto: esperar GPS travar atrasa o socorro. */
  const getPosition = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_accuracy: String(Math.round(pos.coords.accuracy)) + 'm',
        }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    });

  const handleFire = async () => {
    setSending(true);
    setError('');

    try {
      const position = await getPosition();
      await panicApi.triggerPublic(uniqueCode, position || {});
      setSent(true);
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o alerta. Se houver risco de vida, ligue 192 ou 190.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="border-2 border-emerald-500 bg-emerald-50 rounded-xl p-4 text-center">
        <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <p className="font-bold text-emerald-900">Alerta enviado à família.</p>
        <p className="text-sm text-emerald-800 mt-1">
          Se houver risco de vida, ligue <strong>192</strong> (SAMU) ou <strong>190</strong> (Polícia).
        </p>
      </div>
    );
  }

  if (armed) {
    return (
      <div className="border-2 border-red-500 bg-red-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-bold text-red-800">
          Confirmar? A família desta pessoa será avisada imediatamente.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleFire}
            disabled={sending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-lg disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'SIM, AVISAR A FAMÍLIA'}
          </button>
          <button
            onClick={() => setArmed(false)}
            className="px-4 py-3 border border-gray-300 bg-white rounded-lg text-sm font-bold text-gray-700"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setArmed(true)}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
    >
      <AlertTriangle className="w-6 h-6" />
      AVISAR A FAMÍLIA — EMERGÊNCIA
    </button>
  );
}
