import axiosInstance from './axios';

export const reviewsApi = {
  // Create or update a review
  createOrUpdateReview: async (reviewData) => {
    const response = await axiosInstance.post('/reviews', reviewData);
    return response.data;
  },

  // Get reviews for a restaurant
  getRestaurantReviews: async (restaurantId, params = {}) => {
    const response = await axiosInstance.get(`/reviews/restaurant/${restaurantId}`, { params });
    return response.data;
  },

  // Get current user's reviews
  getMyReviews: async (params = {}) => {
    const response = await axiosInstance.get('/reviews/my-reviews', { params });
    return response.data;
  },

  // Get current user's review for a specific restaurant
  getMyReviewForRestaurant: async (restaurantId) => {
    const response = await axiosInstance.get(`/reviews/restaurant/${restaurantId}/my-review`);
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    const response = await axiosInstance.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};
