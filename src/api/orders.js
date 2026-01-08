import axiosInstance from './axios';

export const ordersApi = {
  // Create order from cart
  createOrder: async (addressId) => {
    const response = await axiosInstance.post('/orders', {
      address_id: addressId,
    });
    return response.data;
  },

  // Get user's orders
  getOrders: async (params = {}) => {
    const response = await axiosInstance.get('/orders', { params });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id, reason) => {
    const response = await axiosInstance.put(`/orders/${id}/cancel`, {
      cancellation_reason: reason,
    });
    return response.data;
  },

  // Track order
  trackOrder: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}/track`);
    return response.data;
  },

  // Restaurant Owner APIs
  // Get orders for restaurant owner
  getRestaurantOrders: async (params = {}) => {
    const response = await axiosInstance.get('/orders/restaurant/my-orders', { params });
    return response.data;
  },

  // Update order status (restaurant owner can update to: confirmed, preparing, ready)
  updateOrderStatus: async (id, status) => {
    const response = await axiosInstance.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};
