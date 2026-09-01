import { useState, useMemo } from 'react';

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
