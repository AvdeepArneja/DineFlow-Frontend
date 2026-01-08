import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  X,
  Check,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addressesApi } from '../api/addresses';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Address form state
  const [newAddress, setNewAddress] = useState({
    address_line: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'India',
    phone: user?.phone || '',
    label: 'Home',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await addressesApi.getAddresses();
      if (response.success) {
        const addressesData = response.data.addresses || [];
        setAddresses(addressesData);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await addressesApi.createAddress(newAddress);
      if (response.success) {
        toast.success('Address added successfully');
        setShowAddAddress(false);
        resetForm();
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add address';
      toast.error(errorMessage);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setNewAddress({
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      country: address.country || 'India',
      phone: address.phone || user?.phone || '',
      label: address.label || 'Home',
    });
    setShowAddAddress(false);
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await addressesApi.updateAddress(editingAddressId, newAddress);
      if (response.success) {
        toast.success('Address updated successfully');
        setEditingAddressId(null);
        resetForm();
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update address';
      toast.error(errorMessage);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const response = await addressesApi.deleteAddress(id);
      if (response.success) {
        toast.success('Address deleted successfully');
        setDeleteConfirmId(null);
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete address';
      toast.error(errorMessage);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await addressesApi.setDefaultAddress(id);
      if (response.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to set default address';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setNewAddress({
      address_line: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'India',
      phone: user?.phone || '',
      label: 'Home',
    });
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-orange-600"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800 ml-4">Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-2xl">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{user?.name || 'User'}</h2>
              <p className="text-gray-500">{user?.email || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-800">{user?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-800">{user?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Management Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-800">Delivery Addresses</h2>
            </div>
            <button
              onClick={() => {
                setShowAddAddress(!showAddAddress);
                setEditingAddressId(null);
                resetForm();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>

          {/* Add/Edit Address Form */}
          {(showAddAddress || editingAddressId) && (
            <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="mb-6 p-4 bg-gray-50 rounded-lg">
              {editingAddressId && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Edit Address</h3>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (Home/Work/Other) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Home, Work, Office"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="10-20 digits"
                    minLength="10"
                    maxLength="20"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="House/Flat No., Building Name, Street"
                    minLength="5"
                    maxLength="500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="City name"
                    minLength="2"
                    maxLength="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="State/Province"
                    minLength="2"
                    maxLength="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAddress.zip_code}
                    onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Postal code"
                    minLength="3"
                    maxLength="20"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingAddressId) {
                      cancelEdit();
                    } else {
                      setShowAddAddress(false);
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Address List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading addresses...</p>
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    address.is_default
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <MapPin className={`w-5 h-5 mt-1 ${
                        address.is_default ? 'text-orange-500' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{address.label}</span>
                          {address.is_default && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {address.address_line}, {address.city}, {address.state} {address.zip_code}
                        </p>
                        {address.phone && (
                          <p className="text-gray-500 text-sm mt-1">Phone: {address.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Set as default"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit address"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === address.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(address.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No addresses saved</p>
              <p className="text-sm mb-4">Add an address to get started</p>
              {!showAddAddress && (
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Add Address
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
