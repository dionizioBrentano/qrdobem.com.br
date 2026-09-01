import { request } from './http';

export const causeProductsApi = {
  list: (spaceId) => request(`/spaces/${spaceId}/products`),
  
  create: (spaceId, data) => request(`/spaces/${spaceId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (spaceId, productId, data) => request(`/spaces/${spaceId}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  remove: (spaceId, productId) => request(`/spaces/${spaceId}/products/${productId}`, {
    method: 'DELETE',
  }),

  quote: (spaceId, productId, qty) => request(`/spaces/${spaceId}/products/${productId}/quote?qty=${qty}`),
};
