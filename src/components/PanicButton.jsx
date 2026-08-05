import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, X, Volume2 } from 'lucide-react';
import { panicApi } from '../services/api';

/**
 * PanicButton — Botão de Pânico com alarme local no próprio app.
 * T1-R07 do PLANO_TRILHAS_2026-08.md.
 *
 * DECISÃO DO PROPRIETÁRIO (06/08/2026): versão rústica agora, sem esperar
 * o WhatsApp. O frontend é instalado como app (PWA) e funciona ele próprio
 * como alarme — sirene, vibração e tela vermelha —, enquanto o backend
 * avisa a família pelos canais disponíveis.
 *
 * O QUE O ALARME LOCAL FAZ, E POR QUÊ
 *   1. Sirene por Web Audio API (dois tons alternados, como sirene real).
 *      Não é arquivo de áudio: som gerado não depende de download, não
 *      falha por rede ruim e não pesa no bundle.
 *   2. Vibração em padrão contínuo (onde o aparelho suporta).
 *   3. Tela vermelha piscando — serve para chamar atenção de quem está por
 *      perto, que é metade do propósito de um alarme.
 *
 * O ALARME TOCA MESMO SE A REDE FALHAR. Ele começa ANTES da chamada à API
 * e não é interrompido por erro dela: numa emergência, alarme que só toca
 * com internet não é alarme.
 *
 * LIMITAÇÃO CONHECIDA (navegador, não do código): som só dispara a partir
 * de um gesto do usuário. Como o alarme nasce de um toque no botão, o caso
 * está coberto — mas isso impede acionamento automático em segundo plano.
 * Alarme em background exige app nativo; fica para a versão definitiva.
 */
export default function PanicButton({ spaceId, entityId = null }) {
  const [armed, setArmed] = useState(false);      // confirmação em 2 toques
  const [firing, setFiring] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const sirenTimerRef = useRef(null);
  const vibrateTimerRef = useRef(null);

  // Garante que o alarme pare se o componente sair da tela — senão a sirene
  // continua tocando sem nada visível para desligá-la.
  useEffect(() => () => stopAlarm(), []);

  /** Sirene de dois tons via Web Audio. */
  const startAlarm = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;

      const ctx = new Ctx();
      audioCtxRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime); // alto, não ensurdecedor

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();

      oscillatorRef.current = oscillator;

      // Alterna as frequências: som contínuo vira ruído de fundo, som que
      // varia é reconhecido como alarme.
      let high = true;
      sirenTimerRef.current = setInterval(() => {
        if (!oscillatorRef.current) return;
        oscillatorRef.current.frequency.setValueAtTime(high ? 620 : 880, ctx.currentTime);
        high = !high;
      }, 500);
    } catch {
      // Áudio bloqueado não pode impedir o resto do alerta.
    }

    if (navigator.vibrate) {
      const pattern = [400, 200, 400, 200];
      navigator.vibrate(pattern);
      vibrateTimerRef.current = setInterval(() => navigator.vibrate(pattern), 1200);
    }
  };

  const stopAlarm = () => {
    if (sirenTimerRef.current) clearInterval(sirenTimerRef.current);
    if (vibrateTimerRef.current) clearInterval(vibrateTimerRef.current);
    sirenTimerRef.current = null;
    vibrateTimerRef.current = null;

    try {
      oscillatorRef.current?.stop();
      audioCtxRef.current?.close();
    } catch {
      // Contexto já encerrado — nada a fazer.
    }

    oscillatorRef.current = null;
    audioCtxRef.current = null;

    if (navigator.vibrate) navigator.vibrate(0);
  };

  /**
   * Posição atual, com timeout curto.
   * 5 segundos de propósito: numa emergência, esperar o GPS travar é pior
   * que mandar o alerta sem coordenada.
   */
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
    setFiring(true);
    setError('');

    // O alarme começa ANTES da rede. Esta ordem é o ponto do desenho.
    startAlarm();

    try {
      const position = await getPosition();
      const res = await panicApi.trigger(spaceId, {
        ...(position || {}),
        ...(entityId ? { entity_id: entityId } : {}),
      });
      setResult(res);
    } catch (err) {
      // A sirene continua tocando. O alerta local não depende do servidor.
      setError(err.message || 'Não foi possível avisar a família pela internet. O alarme continua tocando.');
    } finally {
      setFiring(false);
    }
  };

  const handleCancel = () => {
    stopAlarm();
    setArmed(false);
    setResult(null);
    setError('');
  };

  // Alarme disparado — tela cheia, vermelha, pulsando.
  if (result || error || firing) {
    return (
      <div className="fixed inset-0 z-[100] bg-red-600 text-white flex flex-col items-center justify-center p-6 animate-pulse">
        <AlertTriangle className="w-20 h-20 mb-4" />
        <h2 className="text-3xl font-black text-center mb-2">ALERTA ACIONADO</h2>

        <p className="text-center text-lg mb-6 max-w-md">
          {firing && 'Enviando alerta para a família...'}
          {result && `Família avisada: ${result.notified} de ${result.notified + result.failed}.`}
          {error && error}
        </p>

        <p className="text-center text-sm mb-8 max-w-md opacity-90">
          Se houver risco de vida, ligue <strong>192</strong> (SAMU) ou <strong>190</strong> (Polícia).
        </p>

        <button
          onClick={handleCancel}
          className="bg-white text-red-700 font-black px-8 py-4 rounded-xl text-lg flex items-center gap-2"
        >
          <X className="w-6 h-6" />
          Desligar alarme
        </button>

        <p className="text-xs mt-4 opacity-75 flex items-center gap-1">
          <Volume2 className="w-3 h-3" /> O alarme continua tocando até você desligar.
        </p>
      </div>
    );
  }

  // Confirmação em dois toques: disparo acidental de alarme de emergência
  // custa credibilidade, e alarme em que ninguém acredita não salva ninguém.
  if (armed) {
    return (
      <div className="border-2 border-red-500 bg-red-50 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-bold text-red-800">
          Confirmar acionamento? Toda a família será avisada.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleFire}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-lg text-lg"
          >
            SIM, ACIONAR
          </button>
          <button
            onClick={() => setArmed(false)}
            className="px-4 py-4 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setArmed(true)}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-xl text-xl flex items-center justify-center gap-3 shadow-lg transition"
    >
      <AlertTriangle className="w-7 h-7" />
      BOTÃO DE PÂNICO
    </button>
  );
}
