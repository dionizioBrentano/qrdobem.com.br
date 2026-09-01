import { useState, useEffect } from 'react';
import { entitiesApi } from '../services/api';
import { resizeImageFile } from '../utils/resizeImageFile';
import { API_BASE } from '../services/http';

const mediaCache = new Map();
const listeners = new Map();

function notifyListeners(uniqueCode, newMedia) {
  if (listeners.has(uniqueCode)) {
    listeners.get(uniqueCode).forEach(fn => fn(newMedia));
  }
}

function subscribe(uniqueCode, listener) {
  if (!listeners.has(uniqueCode)) {
    listeners.set(uniqueCode, new Set());
  }
  listeners.get(uniqueCode).add(listener);
  return () => {
    const set = listeners.get(uniqueCode);
    if (set) {
      set.delete(listener);
      if (set.size === 0) listeners.delete(uniqueCode);
    }
  };
}

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const cleanUrl = url.replace(/^\/+/, '');
  
  return `${cleanBase}/${cleanUrl}`;
}

export function invalidateEntityMedia(uniqueCode) {
  mediaCache.delete(uniqueCode);
  notifyListeners(uniqueCode, null);
}

export function clearAllMediaCache() {
  mediaCache.clear();
}

export function useEntityMedia(uniqueCode, initialPhotoUrl = null) {
  const [media, setMedia] = useState(() => {
    if (initialPhotoUrl) return { url: resolveMediaUrl(initialPhotoUrl) };
    return mediaCache.has(uniqueCode) ? mediaCache.get(uniqueCode) : null;
  });
  
  const [loading, setLoading] = useState(!initialPhotoUrl && !mediaCache.has(uniqueCode));
  const [error, setError] = useState(false);

  const fetchMedia = () => {
    if (initialPhotoUrl) return;
    setLoading(true);
    entitiesApi.listMedia(uniqueCode)
      .then(res => {
        const obj = res.media && res.media.length > 0 ? res.media[0] : null;
        if (obj) {
          obj.url = resolveMediaUrl(obj.url || `/media/${obj.id}`);
        }
        mediaCache.set(uniqueCode, obj);
        setMedia(obj);
        notifyListeners(uniqueCode, obj);
      })
      .catch(() => {
        mediaCache.delete(uniqueCode);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const unsubscribe = subscribe(uniqueCode, (newMedia) => {
      setMedia(newMedia);
    });

    if (initialPhotoUrl) return unsubscribe;
    
    if (mediaCache.has(uniqueCode)) {
      setMedia(mediaCache.get(uniqueCode));
      setLoading(false);
      return unsubscribe;
    }

    fetchMedia();

    return () => {
      unsubscribe();
    };
  }, [uniqueCode, initialPhotoUrl]);

  const uploadMedia = async (file) => {
    const ready = await resizeImageFile(file);
    const objectUrl = URL.createObjectURL(ready);
    const tempMedia = { url: objectUrl, id: 'temp' };
    setMedia(tempMedia);
    notifyListeners(uniqueCode, tempMedia);

    const formData = new FormData();
    formData.append('file', ready);

    try {
      await entitiesApi.uploadMedia(uniqueCode, formData);
      const res = await entitiesApi.listMedia(uniqueCode);
      const obj = res.media && res.media.length > 0 ? res.media[0] : null;
      if (obj) {
        obj.url = resolveMediaUrl(obj.url || `/media/${obj.id}`);
      }
      mediaCache.set(uniqueCode, obj);
      setMedia(obj);
      notifyListeners(uniqueCode, obj);
      URL.revokeObjectURL(objectUrl);
      return true;
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      const oldObj = mediaCache.get(uniqueCode) || null;
      setMedia(oldObj);
      notifyListeners(uniqueCode, oldObj);
      throw err;
    }
  };

  const removeMedia = async () => {
    if (!media || media.id === 'temp') return false;
    try {
      await entitiesApi.removeMedia(uniqueCode, media.id);
      mediaCache.set(uniqueCode, null);
      setMedia(null);
      notifyListeners(uniqueCode, null);
      return true;
    } catch (err) {
      throw err;
    }
  };

  return { media, mediaUrl: media?.url, loading, error, uploadMedia, removeMedia, refetch: fetchMedia };
}
