import { request } from './http';

export const wellnessApi = {
  pending: (code) => request(`/entities/${code}/wellness-checks/pending`),
  
  create: (code, payload = {}) => request(`/entities/${code}/wellness-checks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  respond: (code, checkId) => request(`/entities/${code}/wellness-checks/${checkId}/respond`, {
    method: 'POST',
  }),
};
