import api from './api';

export const quotationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/quotations', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/quotations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  send: async (id) => {
    const response = await api.put(`/quotations/${id}/send`);
    return response.data;
  },

  accept: async (id) => {
    const response = await api.put(`/quotations/${id}/accept`);
    return response.data;
  },

  reject: async (id) => {
    const response = await api.put(`/quotations/${id}/reject`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(`/quotations/${id}/cancel`);
    return response.data;
  },

  /**
   * Get count of draft quotations that need to be sent
   * @param {Object} params - Query parameters (shop_id)
   * @returns {Promise} API response
   */
  getDraftCount: async (params = {}) => {
    const response = await api.get('/quotations', { 
      params: { 
        ...params, 
        status: 'draft',
        limit: 1,
        page: 1
      } 
    });
    // Return count from pagination
    return {
      count: response.data?.pagination?.total || response.data?.data?.length || 0
    };
  },
};

