import { Trash2 } from 'lucide-react';
import { useAdventureWindows } from '../hooks/useAdventureWindows';
import { ADVENTURE_UI, DAYS_OF_WEEK } from '../constants/adventure';

export default function AdventureWindowsBlock({ uniqueCode, routine, points = [] }) {
  const w = useAdventureWindows(uniqueCode, routine);

  if (!routine?.id) return null;

  const toggleDay = (dayValue) => {
    if (w.selectedDays.includes(dayValue)) {
      w.setSelectedDays(w.selectedDays.filter((d) => d !== dayValue));
    } else {
      w.setSelectedDays([...w.selectedDays, dayValue]);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h4 className="font-medium text-gray-800 mb-2">{ADVENTURE_UI.WINDOW_TITLE}</h4>
      {w.error && <p className="text-xs text-red-600 mb-2">{w.error}</p>}

      {w.groupedWindows.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {w.groupedWindows.map((group) => {
            const daysText = [...group.days]
              .sort((a, b) => a - b)
              .map((d) => DAYS_OF_WEEK.find((item) => item.value === d)?.label)
              .filter(Boolean)
              .join(', ');
            const pointName = group.entity_reference_point_id
              ? (points.find((p) => p.id === group.entity_reference_point_id)?.name || 'Ponto')
              : ADVENTURE_UI.WINDOW_ALL_POINTS;
            return (
              <li key={group.key} className="flex justify-between items-center bg-white p-2 border border-gray-200 rounded">
                <span className="text-sm">
                  {daysText} · {group.start_time}–{group.end_time}
                  {' '}({pointName}, tol. {group.tolerance_minutes} min
                  {!group.expects_movement ? ', repouso' : ''})
                </span>
                <button
                  type="button"
                  onClick={() => w.removeWindowGroup(group.items)}
                  className="text-red-500 hover:text-red-700"
                  disabled={w.loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !w.loading && <p className="text-xs text-gray-500 mb-4">{ADVENTURE_UI.WINDOW_EMPTY}</p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-3 py-1 text-sm rounded border ${
                w.selectedDays.includes(day.value)
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="time"
            value={w.startTime}
            onChange={(e) => w.setStartTime(e.target.value)}
            className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <input
            type="time"
            value={w.endTime}
            onChange={(e) => w.setEndTime(e.target.value)}
            className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>
        <input
          type="number"
          min="0"
          placeholder="Tolerância (min)"
          value={w.toleranceMinutes}
          onChange={(e) => w.setToleranceMinutes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
        />
        <label className="block text-sm text-gray-700">
          {ADVENTURE_UI.WINDOW_POINT_LABEL}
          <select
            value={w.referencePointId}
            onChange={(e) => w.setReferencePointId(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="">{ADVENTURE_UI.WINDOW_ALL_POINTS}</option>
            {points.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={w.isRest}
            onChange={(e) => w.setIsRest(e.target.checked)}
            className="h-4 w-4 accent-brand-blue"
          />
          {ADVENTURE_UI.WINDOW_REST_LABEL}
        </label>
        <button
          type="button"
          onClick={w.addWindows}
          disabled={w.loading}
          className="px-3 py-2 bg-brand-blue text-white text-sm rounded w-full hover:bg-brand-blue-strong"
        >
          {w.loading ? 'Salvando...' : ADVENTURE_UI.WINDOW_ADD}
        </button>
      </div>
    </div>
  );
}