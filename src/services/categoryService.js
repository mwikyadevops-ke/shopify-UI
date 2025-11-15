import api from "./api";

export const categoryService = {
    /**
     * Get all categories with pagination
     * @param {Object} params - Query parameters (page, limit, search, status, etc.)
     * @returns {Promise} Response with categories data and pagination info
     */
    getAll: async (params = {}) => {
        try {
            console.log('📦 Fetching categories with params:', params);
            const response = await api.get('/categories', { params });
            console.log('✅ Categories fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
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
            console.log(`📦 Fetching category with ID: ${id}`);
            const response = await api.get(`/categories/${id}`);
            console.log('✅ Category fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching category ${id}:`, error);
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
            console.log('📦 Creating category:', data);
            const response = await api.post('/categories', data);
            console.log('✅ Category created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating category:', error);
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
            console.log(`📦 Updating category ${id}:`, data);
            const response = await api.put(`/categories/${id}`, data);
            console.log('✅ Category updated successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating category ${id}:`, error);
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
            console.log(`📦 Deleting category with ID: ${id}`);
            const response = await api.delete(`/categories/${id}`);
            console.log('✅ Category deleted successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error deleting category ${id}:`, error);
            throw error;
        }
    },
};
