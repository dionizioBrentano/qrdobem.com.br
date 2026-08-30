import { useState, useEffect } from 'react';
import { wellnessApi } from '../services/wellnessApi';
import { deviceAccessApi } from '../services/deviceAccessApi';
import { getDeviceToken } from '../utils/deviceToken';
import { WELLNESS_POLL_MS } from '../constants/adventure';

export function useWellnessCheck(uniqueCode, monitoring) {
  const [pendingCheck, setPendingCheck] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let intervalId;

    async function pollPending() {
      if (!uniqueCode || !monitoring) return;
      try {
        const res = getDeviceToken() 
          ? await deviceAccessApi.pendingWellnessCheck()
          : await wellnessApi.pending(uniqueCode);
        setPendingCheck(res || null);
        setError('');
      } catch (err) {
        // Ignora silenciosamente erros de polling
      }
    }

    if (monitoring && uniqueCode) {
      pollPending(); // poll imediato ao montar ou ligar monitoring
      intervalId = setInterval(pollPending, WELLNESS_POLL_MS);
    } else {
      setPendingCheck(null);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [uniqueCode, monitoring]);

  const respond = async (check) => {
    if (!uniqueCode || !check) return;
    try {
      setBusy(true);
      if (getDeviceToken()) {
        await deviceAccessApi.respondWellnessCheck(check.id);
      } else {
        await wellnessApi.respond(uniqueCode, check.id);
      }
      setPendingCheck(null);
      setError('');
    } catch (err) {
      setError(err.data?.error || 'Erro ao responder à checagem.');
    } finally {
      setBusy(false);
    }
  };

  const createManualAndRespond = async () => {
    if (getDeviceToken()) {
      setError('Criação manual não permitida via token.');
      return;
    }
    if (!uniqueCode) return;
    try {
      setBusy(true);
      const res = await wellnessApi.create(uniqueCode);
      const newCheck = res.data || res;
      await wellnessApi.respond(uniqueCode, newCheck.id);
      setPendingCheck(null);
      setError('');
    } catch (err) {
      setError(err.data?.error || 'Erro ao enviar a checagem manual.');
    } finally {
      setBusy(false);
    }
  };

  return { pendingCheck, error, busy, respond, createManualAndRespond };
}
