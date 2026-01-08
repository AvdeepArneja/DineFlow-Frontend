import axiosInstance from './axios';

export const addressesApi = {
  // Get all addresses
  getAddresses: async () => {
    const response = await axiosInstance.get('/addresses');
    return response.data;
  },

  // Get default address
  getDefaultAddress: async () => {
    const response = await axiosInstance.get('/addresses/default');
    return response.data;
  },

  // Get address by ID
  getAddressById: async (id) => {
    const response = await axiosInstance.get(`/addresses/${id}`);
    return response.data;
  },

  // Create new address
  createAddress: async (addressData) => {
    const response = await axiosInstance.post('/addresses', addressData);
    return response.data;
  },

  // Update address
  updateAddress: async (id, addressData) => {
    const response = await axiosInstance.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  // Set address as default
  setDefaultAddress: async (id) => {
    const response = await axiosInstance.put(`/addresses/${id}/set-default`);
    return response.data;
  },

  // Delete address
  deleteAddress: async (id) => {
    const response = await axiosInstance.delete(`/addresses/${id}`);
    return response.data;
  },
};
