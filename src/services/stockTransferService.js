import api from './api';

export const stockTransferService = {
  getAll: async (params = {}) => {
    const response = await api.get('/stock-transfers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/stock-transfers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/stock-transfers', data);
    return response.data;
  },

  complete: async (id) => {
    const response = await api.put(`/stock-transfers/${id}/complete`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(`/stock-transfers/${id}/cancel`);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/stock-transfers/${id}/approve`);
    return response.data;
  },

  reject: async (id) => {
    const response = await api.put(`/stock-transfers/${id}/reject`);
    return response.data;
  },
};


