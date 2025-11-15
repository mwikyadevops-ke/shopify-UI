import api from './api';

export const shopService = {
  getAll: async (params = {}) => {
    const response = await api.get('/shops', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/shops/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/shops', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/shops/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/shops/${id}`);
    return response.data;
  },
};


