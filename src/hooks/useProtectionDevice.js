import { useState, useEffect } from 'react';
import { getDeviceId } from '../utils/deviceId';
import { deviceApi } from '../services/deviceApi';

export function useProtectionDevice(uniqueCode) {
  const [deviceId] = useState(() => getDeviceId());
  const [role, setRoleState] = useState('protected');
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function registerDevice() {
      if (!uniqueCode) return;
      try {
        const payload = {
          device_id: deviceId,
          role: 'protected',
          label: null,
        };
        const res = await deviceApi.register(uniqueCode, payload);
        const data = res.data || res;
        setRecord(data);
        setRoleState(data.role || 'protected');
        setError('');
      } catch (err) {
        setError(err.data?.error || 'Erro ao registrar dispositivo');
      }
    }
    registerDevice();
  }, [uniqueCode, deviceId]);

  const setRole = async (newRole) => {
    if (!record || !record.id || !uniqueCode) return;
    try {
      const payload = {
        role: newRole,
        label: record.label,
      };
      const res = await deviceApi.update(uniqueCode, record.id, payload);
      const data = res.data || res;
      setRecord(data);
      setRoleState(data.role);
      setError('');
    } catch (err) {
      setError(err.data?.error || 'Erro ao atualizar papel do dispositivo');
    }
  };

  return { deviceId, role, record, error, setRole };
}
