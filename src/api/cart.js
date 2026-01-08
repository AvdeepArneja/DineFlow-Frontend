import axiosInstance from './axios';

export const cartApi = {
  // Get current user's cart
  getCart: async () => {
    const response = await axiosInstance.get('/cart');
    return response.data;
  },

  // Add item to cart
  addItem: async (menuItemId, quantity = 1) => {
    const response = await axiosInstance.post('/cart/items', {
      menu_item_id: menuItemId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateItem: async (cartItemId, quantity) => {
    const response = await axiosInstance.put(`/cart/items/${cartItemId}`, {
      quantity,
    });
    return response.data;
  },

  // Remove item from cart
  removeItem: async (cartItemId) => {
    const response = await axiosInstance.delete(`/cart/items/${cartItemId}`);
    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await axiosInstance.delete('/cart');
    return response.data;
  },
};
