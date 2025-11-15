import api from './api';

export const alertService = {
  /**
   * Get all low stock alerts
   * @param {Object} params - Query parameters (page, limit, alert_level, shop_id)
   * @returns {Promise} API response
   */
  getLowStock: async (params = {}) => {
    const response = await api.get('/alerts/low-stock', { params });
    return response.data;
  },

  /**
   * Get alert count for notification badge
   * @param {Object} params - Query parameters (shop_id)
   * @returns {Promise} API response
   */
  getCount: async (params = {}) => {
    const response = await api.get('/alerts/count', { params });
    return response.data;
  },
};

