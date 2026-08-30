import { request } from './http';

export const positionApi = {
  send: (code, payload) => request(`/entities/${code}/positions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  latest: (code) => request(`/entities/${code}/positions/latest`),
};
