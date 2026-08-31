import { useState, useMemo, useEffect } from 'react';
import { entitiesApi } from '../services/api';

const mediaCache = new Map();

export function useEntityMedia(uniqueCode, initialPhotoUrl = null) {
  const [mediaUrl, setMediaUrl] = useState(initialPhotoUrl || mediaCache.get(uniqueCode) || null);
  const [loading, setLoading] = useState(!initialPhotoUrl && !mediaCache.has(uniqueCode));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialPhotoUrl) return;
    if (mediaCache.has(uniqueCode)) {
      setMediaUrl(mediaCache.get(uniqueCode));
      setLoading(false);
      return;
    }

    let isMounted = true;
    entitiesApi.listMedia(uniqueCode)
      .then(res => {
        if (!isMounted) return;
        const url = res.media && res.media.length > 0 ? res.media[0].url : null;
        mediaCache.set(uniqueCode, url);
        setMediaUrl(url);
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

  return { mediaUrl, loading, error };
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === 'Hoje') return new Date().getTime();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // dd/mm/yyyy
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
  }
  return 0;
}

export function useEntityCatalog(initialEntities = []) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_desc');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredAndSorted = useMemo(() => {
    let result = [...(initialEntities || [])];

    if (typeFilter !== 'all') {
      result = result.filter(e => e.type === typeFilter);
    }

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(e => {
        const name = (e.name || '').toLowerCase();
        const code = (e.unique_code || '').toLowerCase();
        const typeStr = (e.type || '').toLowerCase();
        
        return name.includes(lowerQuery) || code.includes(lowerQuery) || typeStr.includes(lowerQuery);
      });
    }

    result.sort((a, b) => {
      if (sortKey === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortKey === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortKey === 'created_asc') {
        return parseDate(a.created_at) - parseDate(b.created_at);
      }
      if (sortKey === 'created_desc') {
        return parseDate(b.created_at) - parseDate(a.created_at);
      }
      return 0;
    });

    return result;
  }, [initialEntities, query, sortKey, typeFilter]);

  return {
    query,
    setQuery,
    sortKey,
    setSortKey,
    typeFilter,
    setTypeFilter,
    entities: filteredAndSorted
  };
}
