import api from './api';

export const reportService = {
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  getStockReport: async (params = {}) => {
    const response = await api.get('/reports/stock', { params });
    return response.data;
  },

  getProductSalesReport: async (params = {}) => {
    const response = await api.get('/reports/products', { params });
    return response.data;
  },

  getPaymentReport: async (params = {}) => {
    const response = await api.get('/reports/payments', { params });
    return response.data;
  },

  getDashboardSummary: async (params = {}) => {
    const response = await api.get('/reports/dashboard', { params });
    return response.data;
  },
};


