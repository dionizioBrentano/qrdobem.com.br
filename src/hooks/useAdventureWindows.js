import { useCallback, useEffect, useMemo, useState } from 'react';
import { adventureApi } from '../services/adventureApi';
import { DEFAULT_TOLERANCE_MINUTES } from '../constants/adventure';
import { apiError } from '../utils/apiError';



function asWindowList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function timeHm(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

export function useAdventureWindows(uniqueCode, routine) {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [toleranceMinutes, setToleranceMinutes] = useState(DEFAULT_TOLERANCE_MINUTES);
  const [referencePointId, setReferencePointId] = useState('');
  const [isRest, setIsRest] = useState(false);

  const loadWindows = useCallback(async () => {
    if (!routine?.id || !uniqueCode) {
      setWindows([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await adventureApi.routines.listWindows(uniqueCode, routine.id);
      setWindows(asWindowList(res));
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [uniqueCode, routine?.id]);

  useEffect(() => {
    loadWindows();
  }, [loadWindows]);

  const addWindows = async () => {
    if (!routine?.id || !uniqueCode) return;
    if (selectedDays.length === 0 || !startTime || !endTime) {
      setError('Marque os dias e informe início e fim.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      for (const day of selectedDays) {
        await adventureApi.routines.addWindow(uniqueCode, routine.id, {
          day_of_week: Number(day),
          start_time: timeHm(startTime),
          end_time: timeHm(endTime),
          tolerance_minutes: Number(toleranceMinutes) || DEFAULT_TOLERANCE_MINUTES,
          expects_movement: !isRest,
          entity_reference_point_id: referencePointId ? Number(referencePointId) : null,
        });
      }
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');
      setToleranceMinutes(DEFAULT_TOLERANCE_MINUTES);
      setReferencePointId('');
      setIsRest(false);
      await loadWindows();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const removeWindowGroup = async (items) => {
    if (!routine?.id || !uniqueCode || !items?.length) return;
    if (!confirm('Remover esta janela?')) return;
    setLoading(true);
    setError('');
    try {
      for (const item of items) {
        await adventureApi.routines.removeWindow(uniqueCode, routine.id, item.id);
      }
      await loadWindows();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const groupedWindows = useMemo(() => {
    const map = new Map();
    windows.forEach((w) => {
      const key = [
        timeHm(w.start_time),
        timeHm(w.end_time),
        w.tolerance_minutes,
        w.entity_reference_point_id ?? '',
        w.expects_movement ? '1' : '0',
      ].join('|');
      const existing = map.get(key);
      if (existing) {
        if (!existing.days.includes(w.day_of_week)) existing.days.push(w.day_of_week);
        existing.items.push(w);
      } else {
        map.set(key, {
          key,
          days: [w.day_of_week],
          items: [w],
          start_time: timeHm(w.start_time),
          end_time: timeHm(w.end_time),
          tolerance_minutes: w.tolerance_minutes,
          expects_movement: w.expects_movement,
          entity_reference_point_id: w.entity_reference_point_id,
        });
      }
    });
    return Array.from(map.values());
  }, [windows]);

  return {
    groupedWindows,
    loading,
    error,
    selectedDays,
    setSelectedDays,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    toleranceMinutes,
    setToleranceMinutes,
    referencePointId,
    setReferencePointId,
    isRest,
    setIsRest,
    addWindows,
    removeWindowGroup,
  };
}
