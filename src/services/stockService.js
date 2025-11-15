import api from './api';

export const stockService = {
  getAll: async (params = {}) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },

  getByShop: async (shopId, params = {}) => {
    const response = await api.get(`/stock/shop/${shopId}`, { params });
    return response.data;
  },

  getByProduct: async (shopId, productId) => {
    const response = await api.get(`/stock/shop/${shopId}/product/${productId}`);
    return response.data;
  },

  getTransactions: async (params = {}) => {
    const response = await api.get('/stock/transactions', { params });
    return response.data;
  },

  add: async (data) => {
    const response = await api.post('/stock/add', data);
    return response.data;
  },

  reduce: async (data) => {
    const response = await api.post('/stock/reduce', data);
    return response.data;
  },

  adjust: async (data) => {
    const response = await api.post('/stock/adjust', data);
    return response.data;
  },
};


