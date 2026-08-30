import { useEffect, useState } from 'react';
import { adventureApi } from '../services/adventureApi';
import { DEFAULT_RADIUS_METERS } from '../constants/adventure';

const EMPTY_POINT = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  radius_meters: DEFAULT_RADIUS_METERS,
  order_index: 0,
};

function apiError(err) {
  return err?.data?.error || err?.message || 'Erro inesperado.';
}

export function useAdventureRoutine(uniqueCode) {
  const [referencePoints, setReferencePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [silentPassword, setSilentPassword] = useState('');
  const [silentPasswordMessage, setSilentPasswordMessage] = useState('');
  const [silentPasswordError, setSilentPasswordError] = useState('');
  const [routine, setRoutine] = useState(null);
  const [routineName, setRoutineName] = useState('');
  const [routinePoints, setRoutinePoints] = useState([]);
  const [routineError, setRoutineError] = useState('');
  const [routineMessage, setRoutineMessage] = useState('');
  const [skipAlertInsideTrail, setSkipAlertInsideTrail] = useState(true);
  const [newPoint, setNewPoint] = useState(EMPTY_POINT);

  useEffect(() => {
    if (!uniqueCode) return;

    let cancelled = false;

    const load = async () => {
      try {
        const points = await adventureApi.listPoints(uniqueCode);
        if (!cancelled) setReferencePoints(Array.isArray(points) ? points : []);
      } catch (err) {
        console.error('Falha ao carregar pontos da aventura:', err);
      }

      try {
        const routines = await adventureApi.routines.list(uniqueCode);
        const list = Array.isArray(routines) ? routines : [];
        const first = list[0] || null;
        if (cancelled) return;
        setRoutine(first);
        setRoutineName(first?.name || '');
        setSkipAlertInsideTrail(first ? Boolean(first.skip_alert_inside_trail) : true);
        if (first?.id) {
          const rPoints = await adventureApi.routines.listPoints(uniqueCode, first.id);
          if (!cancelled) setRoutinePoints(Array.isArray(rPoints) ? rPoints : (first.points || []));
        } else {
          setRoutinePoints([]);
        }
      } catch (err) {
        console.error('Falha ao carregar trilha:', err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [uniqueCode]);

  const saveRoutine = async () => {
    const name = routineName.trim();
    if (!name) {
      setRoutineError('Informe o nome da trilha.');
      return;
    }
    try {
      setLoading(true);
      setRoutineError('');
      setRoutineMessage('');
      const payload = { name, skip_alert_inside_trail: skipAlertInsideTrail };
      if (routine?.id) {
        const updated = await adventureApi.routines.update(uniqueCode, routine.id, payload);
        setRoutine(updated);
        setRoutineName(updated.name || name);
        setSkipAlertInsideTrail(Boolean(updated.skip_alert_inside_trail));
        setRoutineMessage('Trilha atualizada.');
      } else {
        const created = await adventureApi.routines.create(uniqueCode, payload);
        setRoutine(created);
        setRoutineName(created.name || name);
        setSkipAlertInsideTrail(Boolean(created.skip_alert_inside_trail ?? true));
        setRoutinePoints(created.points || []);
        setRoutineMessage('Trilha criada.');
      }
    } catch (err) {
      setRoutineError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewPoint((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const addRoutinePoint = async () => {
    if (!routine?.id) {
      setRoutineError('Salve o nome da trilha antes de adicionar pontos.');
      return;
    }
    if (!newPoint.name || !newPoint.latitude || !newPoint.longitude) {
      setRoutineError('Nome, latitude e longitude são obrigatórios.');
      return;
    }
    try {
      setLoading(true);
      setRoutineError('');
      const created = await adventureApi.routines.addPoint(uniqueCode, routine.id, {
        name: newPoint.name,
        address: newPoint.address || null,
        latitude: Number(newPoint.latitude),
        longitude: Number(newPoint.longitude),
        radius_meters: Number(newPoint.radius_meters) || DEFAULT_RADIUS_METERS,
        order_index: Number(newPoint.order_index) || 0,
      });
      setRoutinePoints((prev) => [...prev, created]);
      setNewPoint(EMPTY_POINT);
    } catch (err) {
      setRoutineError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const removeRoutinePoint = async (pointId) => {
    if (!routine?.id) return;
    if (!confirm('Remover este ponto da trilha?')) return;
    try {
      setLoading(true);
      await adventureApi.routines.removePoint(uniqueCode, routine.id, pointId);
      setRoutinePoints((prev) => prev.filter((p) => p.id !== pointId));
    } catch (err) {
      setRoutineError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const removeOrphanPoint = async (pointId) => {
    if (!confirm('Remover este ponto sem trilha?')) return;
    try {
      setLoading(true);
      await adventureApi.removePoint(uniqueCode, pointId);
      setReferencePoints((prev) => prev.filter((p) => p.id !== pointId));
    } catch (err) {
      setRoutineError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSilentPassword = async () => {
    if (silentPassword.length < 6) {
      setSilentPasswordError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    try {
      setLoading(true);
      setSilentPasswordError('');
      await adventureApi.setSilentPassword(uniqueCode, { password: silentPassword });
      setSilentPasswordMessage('Senha silenciosa atualizada com sucesso!');
      setSilentPassword('');
      setTimeout(() => setSilentPasswordMessage(''), 5000);
    } catch (err) {
      setSilentPasswordError('Erro ao salvar a senha silenciosa.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    referencePoints,
    routine,
    routineName,
    setRoutineName,
    routinePoints,
    routineError,
    routineMessage,
    skipAlertInsideTrail,
    setSkipAlertInsideTrail,
    newPoint,
    setNewPoint,
    silentPassword,
    setSilentPassword,
    silentPasswordMessage,
    silentPasswordError,
    saveRoutine,
    useCurrentLocation,
    addRoutinePoint,
    removeRoutinePoint,
    removeOrphanPoint,
    saveSilentPassword,
  };
}
