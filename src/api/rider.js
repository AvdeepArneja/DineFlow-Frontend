import axiosInstance from './axios';

/**
 * Rider API
 * All endpoints for rider-related operations
 */

export const riderApi = {
  /**
   * Get orders assigned to the current rider
   * @param {Object} params - Query parameters (status, limit, offset)
   * @returns {Promise<Object>}
   */
  getMyOrders: async (params = {}) => {
    const response = await axiosInstance.get('/rider/orders', { params });
    return response.data;
  },

  /**
   * Get available orders (ready and not assigned) - for reference
   * @param {Object} params - Query parameters (limit, offset)
   * @returns {Promise<Object>}
   */
  getAvailableOrders: async (params = {}) => {
    const response = await axiosInstance.get('/rider/orders/available', { params });
    return response.data;
  },

  /**
   * Get rider statistics
   * @returns {Promise<Object>}
   */
  getStats: async () => {
    const response = await axiosInstance.get('/rider/stats');
    return response.data;
  },

  /**
   * Update order delivery status
   * @param {number} orderId - Order ID
   * @param {string} status - New status ('out_for_delivery' or 'delivered')
   * @param {number} estimated_delivery_time - Optional estimated delivery time in minutes
   * @returns {Promise<Object>}
   */
  updateOrderStatus: async (orderId, status, estimated_delivery_time = null) => {
    const response = await axiosInstance.put(`/rider/orders/${orderId}/status`, {
      status,
      estimated_delivery_time,
    });
    return response.data;
  },
};
