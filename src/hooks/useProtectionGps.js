import { useState, useEffect, useRef } from 'react';
import { positionApi } from '../services/positionApi';
import { GPS_INTERVAL_MS, ADVENTURE_UI } from '../constants/adventure';
import { getDeviceId } from '../utils/deviceId';

export function useProtectionGps(uniqueCode, monitoring) {
  const [lastSent, setLastSent] = useState(null);
  const [lastKnown, setLastKnown] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const lastSentTimeRef = useRef(0);

  // Busca a última posição conhecida ao abrir a página
  useEffect(() => {
    async function fetchLatest() {
      if (!uniqueCode) return;
      try {
        const res = await positionApi.latest(uniqueCode);
        if (res) {
          setLastKnown(res);
        }
      } catch (err) {
        // Ignora silenciosamente, apenas não exibe posição prévia
      }
    }
    fetchLatest();
  }, [uniqueCode]);

  // Lida com o Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if (monitoring && 'wakeLock' in navigator) {
        try {
          if (wakeLockRef.current !== null) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
          }
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          // Sem suporte ou permissão negada, apenas segue o jogo
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    if (monitoring) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [monitoring]);

  // Lida com o Geolocation Watch
  useEffect(() => {
    if (!monitoring || !uniqueCode) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    const handleSuccess = async (position) => {
      setError('');
      const now = Date.now();
      
      const posData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy_meters: Math.round(position.coords.accuracy),
        recorded_at: new Date(position.timestamp).toISOString(),
        device_id: getDeviceId(),
      };
      
      // Salva apenas visualmente se for muito recente para enviar
      setLastKnown(posData);

      if (now - lastSentTimeRef.current >= GPS_INTERVAL_MS) {
        try {
          setSending(true);
          lastSentTimeRef.current = now; // Atualiza logo para evitar duplo disparo
          await positionApi.send(uniqueCode, posData);
          setLastSent(posData);
          setError('');
        } catch (err) {
          setError(ADVENTURE_UI.PROTECTION_SEND_ERROR);
        } finally {
          setSending(false);
        }
      }
    };

    const handleError = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setError(ADVENTURE_UI.PROTECTION_GPS_DENIED);
      } else {
        setError(ADVENTURE_UI.PROTECTION_GPS_ERROR);
      }
    };

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    } else {
      setError(ADVENTURE_UI.PROTECTION_GPS_ERROR);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [monitoring, uniqueCode]);

  return { lastSent, lastKnown, error, sending };
}
