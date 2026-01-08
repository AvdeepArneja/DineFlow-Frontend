import axiosInstance from './axios';

export const menuApi = {
  // Get menu items for a restaurant
  getMenuItems: async (restaurantId, params = {}) => {
    const response = await axiosInstance.get(`/restaurants/${restaurantId}/menu`, { params });
    return response.data;
  },

  // Create a new menu item
  createMenuItem: async (restaurantId, menuItemData) => {
    const response = await axiosInstance.post(`/restaurants/${restaurantId}/menu-items`, menuItemData);
    return response.data;
  },

  // Update a menu item
  updateMenuItem: async (menuItemId, menuItemData) => {
    const response = await axiosInstance.put(`/menu-items/${menuItemId}`, menuItemData);
    return response.data;
  },

  // Delete/Deactivate a menu item
  deleteMenuItem: async (menuItemId) => {
    const response = await axiosInstance.delete(`/menu-items/${menuItemId}`);
    return response.data;
  },
};
