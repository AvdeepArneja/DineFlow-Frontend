import axiosInstance from './axios';

export const restaurantsApi = {
  // Get all restaurants with filters
  getRestaurants: async (params = {}) => {
    try {
      console.log('Making API call to /restaurants with params:', params);
      const response = await axiosInstance.get('/restaurants', { params });
      console.log('API response status:', response.status);
      console.log('API response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('API call error:', error);
      console.error('Error config:', error.config);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  // Get available cities
  getCities: async () => {
    const response = await axiosInstance.get('/restaurants/cities');
    return response.data;
  },

  // Get restaurant by ID
  getRestaurantById: async (id) => {
    const response = await axiosInstance.get(`/restaurants/${id}`);
    return response.data;
  },

  // Get restaurant menu
  getRestaurantMenu: async (id) => {
    const response = await axiosInstance.get(`/restaurants/${id}/menu`);
    return response.data;
  },

  // Restaurant Owner APIs
  // Get restaurants owned by current user
  getMyRestaurants: async () => {
    const response = await axiosInstance.get('/restaurants/owner/my-restaurants');
    return response.data;
  },

  // Create a new restaurant
  createRestaurant: async (restaurantData) => {
    const response = await axiosInstance.post('/restaurants', restaurantData);
    return response.data;
  },

  // Search restaurants and menu items
  search: async (query, city = null) => {
    const params = { q: query };
    if (city) {
      params.city = city;
    }
    const response = await axiosInstance.get('/restaurants/search', { params });
    return response.data;
  },
};
