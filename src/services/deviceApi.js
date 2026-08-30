import { request } from './http';

export const deviceApi = {
  list: (code) => request(`/entities/${code}/devices`),
  
  register: (code, payload) => request(`/entities/${code}/devices`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  
  update: (code, id, payload) => request(`/entities/${code}/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  
  remove: (code, id) => request(`/entities/${code}/devices/${id}`, {
    method: 'DELETE',
  }),

  issueToken: (code, id) => request(`/entities/${code}/devices/${id}/token`, {
    method: 'POST',
  }),

  revokeToken: (code, id) => request(`/entities/${code}/devices/${id}/token`, {
    method: 'DELETE',
  }),
};
