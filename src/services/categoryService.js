import api from "./api";

export const categoryService = {
    /**
     * Get all categories with pagination
     * @param {Object} params - Query parameters (page, limit, search, status, etc.)
     * @returns {Promise} Response with categories data and pagination info
     */
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/categories', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get a single category by ID
     * @param {number|string} id - Category ID
     * @returns {Promise} Response with category data
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Create a new category
     * @param {Object} data - Category data (name, description, status)
     * @returns {Promise} Response with created category data
     */
    create: async (data) => {
        try {
            const response = await api.post('/categories', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update an existing category
     * @param {number|string} id - Category ID
     * @param {Object} data - Updated category data
     * @returns {Promise} Response with updated category data
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`/categories/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete a category
     * @param {number|string} id - Category ID
     * @returns {Promise} Response confirmation
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};
