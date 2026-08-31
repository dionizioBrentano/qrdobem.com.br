import { ENTITY_TYPES, SORT_OPTIONS } from '../constants/dashboard';

export default function EntityCatalogToolbar({
  query,
  setQuery,
  sortKey,
  setSortKey,
  typeFilter,
  setTypeFilter
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
      <input
        type="text"
        placeholder="Buscar por nome ou código..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:w-auto flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />
      <div className="flex w-full sm:w-auto items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">{ENTITY_TYPES.all}</option>
          <option value="person">{ENTITY_TYPES.person}</option>
          <option value="pet">{ENTITY_TYPES.pet}</option>
          <option value="object">{ENTITY_TYPES.object}</option>
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
