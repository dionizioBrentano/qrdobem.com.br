import { useState, useEffect } from 'react';
import { AlertTriangle, Check, Phone } from 'lucide-react';
import { panicApi } from '../services/api';

const EmergencyContactsBlock = () => (
  <div className="mt-4 bg-gray-900 text-white p-4 rounded-xl text-center space-y-2 border border-gray-700 shadow-inner">
    <p className="font-bold text-xs uppercase tracking-wider text-red-400">Ligue para o Socorro Local</p>
    <div className="flex justify-center gap-8 pt-2">
      <a href="tel:192" className="flex flex-col items-center gap-2 active:scale-95 transition transform">
        <div className="bg-red-600 p-4 rounded-full shadow-lg"><Phone className="w-6 h-6" /></div>
        <div className="flex flex-col">
          <span className="font-black text-2xl leading-none">192</span>
          <span className="text-xs text-gray-300 font-medium">SAMU</span>
        </div>
      </a>
      <a href="tel:190" className="flex flex-col items-center gap-2 active:scale-95 transition transform">
        <div className="bg-blue-600 p-4 rounded-full shadow-lg"><Phone className="w-6 h-6" /></div>
        <div className="flex flex-col">
          <span className="font-black text-2xl leading-none">190</span>
          <span className="text-xs text-gray-300 font-medium">POLÍCIA</span>
        </div>
      </a>
    </div>
  </div>
);

export default function PublicPanicButton({ uniqueCode, entityType = 'person', onSuccess }) {
  const [armed, setArmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const playFeedback = (type) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? [200, 100, 200] : [500]);
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // ignora se o navegador bloquear autoplay de audio sem interacao suficiente
    }
  };

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
    if (isOffline) return;
    setSending(true);
    setError('');

    try {
      const position = await getPosition();
      await panicApi.triggerPublic(uniqueCode, position || {});
      setSentMessage('Alerta enviado');
      playFeedback('success');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Não foi possível enviar — tente de novo / ligue 192 ou 190');
      playFeedback('error');
    } finally {
      setSending(false);
    }
  };



  if (isOffline) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="border-2 border-orange-500 bg-orange-50 rounded-xl p-5 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-orange-600 mx-auto mb-3" />
          <p className="font-black text-orange-900 text-lg leading-tight mb-2">Sem Conexão de Internet</p>
          <p className="text-sm text-orange-800 font-medium">
            Você pode ler os dados médicos abaixo, mas o aviso pelo sistema está offline.
          </p>
        </div>
        <EmergencyContactsBlock />
      </div>
    );
  }

  if (sentMessage) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="border-4 border-emerald-500 bg-emerald-50 rounded-xl p-6 text-center shadow-lg">
          <Check className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <p className="font-black text-emerald-900 text-xl whitespace-pre-wrap">{sentMessage}</p>
        </div>
        <EmergencyContactsBlock />
      </div>
    );
  }

  if (armed) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="border-4 border-red-600 bg-red-50 rounded-xl p-5 space-y-4 shadow-lg">
          <p className="text-lg font-black text-red-800 text-center uppercase tracking-tight">
            Confirmar o alerta?
          </p>
          <p className="text-sm font-medium text-red-700 text-center">
            O responsável receberá a sua localização para vir prestar socorro.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleFire}
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 text-lg rounded-xl shadow-md disabled:opacity-50 transition transform active:scale-95"
            >
              {sending ? 'ENVIANDO...' : 'SIM, AVISAR AGORA'}
            </button>
            <button
              onClick={() => setArmed(false)}
              disabled={sending}
              className="w-full py-3 border-2 border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-base font-bold text-gray-700 transition"
            >
              Cancelar
            </button>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg text-sm font-bold text-center mt-2">
              {error}
            </div>
          )}
        </div>
        <EmergencyContactsBlock />
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setArmed(true);
        if (navigator.vibrate) navigator.vibrate(50);
      }}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition transform hover:scale-[1.02] active:scale-95"
    >
      <AlertTriangle className="w-8 h-8" />
      <span className="text-lg tracking-wide">AVISAR RESPONSÁVEL</span>
    </button>
  );
}
