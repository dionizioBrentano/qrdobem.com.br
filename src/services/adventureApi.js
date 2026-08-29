import { request } from './http';

export const adventureApi = {
  listPoints: (uniqueCode) => request(`/entities/${uniqueCode}/adventure/reference-points`),

  storePoint: (uniqueCode, payload) => request(`/entities/${uniqueCode}/adventure/reference-points`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  removePoint: (uniqueCode, pointId) => request(`/entities/${uniqueCode}/adventure/reference-points/${pointId}`, {
    method: 'DELETE',
  }),

  setSilentPassword: (uniqueCode, payload) => request(`/entities/${uniqueCode}/adventure/silent-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  createChallenge: (uniqueCode, payload = {}) => request(`/entities/${uniqueCode}/adventure/challenge`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  silentTrigger: (uniqueCode, payload) => request(`/entities/${uniqueCode}/adventure/silent-trigger`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  routines: {
    list: (code) => request(`/entities/${code}/adventure/routines`),
    create: (code, payload) => request(`/entities/${code}/adventure/routines`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (code, id, payload) => request(`/entities/${code}/adventure/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    remove: (code, id) => request(`/entities/${code}/adventure/routines/${id}`, {
      method: 'DELETE',
    }),
    listPoints: (code, routineId) => request(`/entities/${code}/adventure/routines/${routineId}/points`),
    addPoint: (code, routineId, payload) => request(`/entities/${code}/adventure/routines/${routineId}/points`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    updatePoint: (code, routineId, pointId, payload) => request(`/entities/${code}/adventure/routines/${routineId}/points/${pointId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    removePoint: (code, routineId, pointId) => request(`/entities/${code}/adventure/routines/${routineId}/points/${pointId}`, {
      method: 'DELETE',
    }),
  },
};