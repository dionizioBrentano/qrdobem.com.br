import { useState, useEffect } from 'react';
import { entitiesApi } from '../services/api';

const mediaCache = new Map();

// O VITE_API_URL aponta para a API (ex: https://api.qrdobem.com.br/api).
// Alguns registros devolvem a rota relativa /media/{id} em media.url.
function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.qrdobem.com.br/api';
// Evitar duplicacao de barras
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanUrl = url.replace(/^\/+/, '');
  
  return `${cleanBase}/${cleanUrl}`;
}

export function useEntityMedia(uniqueCode, initialPhotoUrl = null) {
  const [media, setMedia] = useState(
    initialPhotoUrl ? { url: resolveMediaUrl(initialPhotoUrl) } : mediaCache.get(uniqueCode) || null
  );
  const [loading, setLoading] = useState(!initialPhotoUrl && !mediaCache.has(uniqueCode));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialPhotoUrl) return;
    if (mediaCache.has(uniqueCode)) {
      setMedia(mediaCache.get(uniqueCode));
      setLoading(false);
      return;
    }

    let isMounted = true;
    entitiesApi.listMedia(uniqueCode)
      .then(res => {
        if (!isMounted) return;
        const obj = res.media && res.media.length > 0 ? res.media[0] : null;
        if (obj && obj.url) {
          obj.url = resolveMediaUrl(obj.url);
        }
        mediaCache.set(uniqueCode, obj);
        setMedia(obj);
      })
      .catch(() => {
        if (!isMounted) return;
        mediaCache.set(uniqueCode, null);
        setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [uniqueCode, initialPhotoUrl]);

  const uploadMedia = async (file) => {
    // Optimistic UI preview
    const objectUrl = URL.createObjectURL(file);
    setMedia({ url: objectUrl, id: 'temp' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      await entitiesApi.uploadMedia(uniqueCode, formData);
      const res = await entitiesApi.listMedia(uniqueCode);
      const obj = res.media && res.media.length > 0 ? res.media[0] : null;
      if (obj && obj.url) {
        obj.url = resolveMediaUrl(obj.url);
      }
      mediaCache.set(uniqueCode, obj);
      setMedia(obj);
      URL.revokeObjectURL(objectUrl);
      return true;
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      // Revert to cache
      setMedia(mediaCache.get(uniqueCode) || null);
      throw err;
    }
  };

  const removeMedia = async () => {
    if (!media || media.id === 'temp') return false;
    try {
      await entitiesApi.removeMedia(uniqueCode, media.id);
      mediaCache.set(uniqueCode, null);
      setMedia(null);
      return true;
    } catch (err) {
      throw err;
    }
  };

  return { media, mediaUrl: media?.url, loading, error, uploadMedia, removeMedia };
}
