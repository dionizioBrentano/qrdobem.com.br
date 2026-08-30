import { request } from './http';
import { getDeviceToken } from '../utils/deviceToken';

const getHeaders = () => {
  const token = getDeviceToken();
  return token ? { 'X-Device-Token': token } : {};
};

export const deviceAccessApi = {
  storePosition: (data) =>
    request('/device/positions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getHeaders(),
    }),

  latestPosition: () =>
    request('/device/positions/latest', {
      method: 'GET',
      headers: getHeaders(),
    }),

  pendingWellnessCheck: () =>
    request('/device/wellness-checks/pending', {
      method: 'GET',
      headers: getHeaders(),
    }),

  respondWellnessCheck: (checkId) =>
    request(`/device/wellness-checks/${checkId}/respond`, {
      method: 'POST',
      headers: getHeaders(),
    }),

  updateMe: (data) =>
    request('/device/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: getHeaders(),
    }),
};
