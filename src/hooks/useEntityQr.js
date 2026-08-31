import { useState, useEffect } from 'react';
import { entitiesApi } from '../services/api';

const qrCache = new Map();

export function useEntityQr(uniqueCode) {
  const [qrBase64, setQrBase64] = useState(qrCache.get(uniqueCode) || null);
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(!qrCache.has(uniqueCode));
  const [error, setError] = useState('');

  useEffect(() => {
    if (qrCache.has(uniqueCode)) {
      setQrBase64(qrCache.get(uniqueCode));
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    entitiesApi.qrCode(uniqueCode)
      .then(res => {
        if (!isMounted) return;
        if (res.qr_code_base64) {
          qrCache.set(uniqueCode, res.qr_code_base64);
          setQrBase64(res.qr_code_base64);
        }
        if (res.url) setQrUrl(res.url);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.data?.error || err.message || 'Erro ao carregar QR Code');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [uniqueCode]);

  return { qrBase64, qrUrl, loading, error };
}
