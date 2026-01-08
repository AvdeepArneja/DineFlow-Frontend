import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Minus,
  Edit,
  Trash2,
  CreditCard,
  Check,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cartApi } from '../api/cart';
import { addressesApi } from '../api/addresses';
import { ordersApi } from '../api/orders';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);

  // New address form
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
    fetchCart();
    fetchAddresses();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCart();
      console.log('Cart response:', response);
      
      if (response.success) {
        if (response.data.cart) {
          // Cart exists
          setCart(response.data.cart);
          setCartItems(response.data.cart.items || []);
          setCartSummary(response.data.summary || null);
        } else {
          // Cart is empty
          setCart(null);
          setCartItems([]);
          setCartSummary(response.data.summary || null);
        }
      } else {
        setCart(null);
        setCartItems([]);
        setCartSummary(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to load cart';
      toast.error(errorMessage);
      // Don't navigate away, just show empty state
      setCart(null);
      setCartItems([]);
      setCartSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await addressesApi.getAddresses();
      if (response.success) {
        const addressesData = response.data.addresses || [];
        setAddresses(addressesData);
        
        // Set default address or first address
        const defaultAddress = addressesData.find(addr => addr.is_default) || addressesData[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await addressesApi.createAddress(newAddress);
      if (response.success) {
        toast.success('Address added successfully');
        setShowAddAddress(false);
        setNewAddress({
          address_line: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'India',
          phone: user?.phone || '',
          label: 'Home',
        });
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
        setNewAddress({
          address_line: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'India',
          phone: user?.phone || '',
          label: 'Home',
        });
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
        // If deleted address was selected, clear selection
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete address';
      toast.error(errorMessage);
    }
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
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

  const handleUpdateQuantity = async (cartItemId, change) => {
    const cartItem = cartItems.find(item => item.id === cartItemId);
    if (!cartItem) return;

    const newQuantity = cartItem.quantity + change;
    
    if (newQuantity <= 0) {
      // Remove item
      await handleRemoveItem(cartItemId);
      return;
    }

    setIsUpdatingCart(true);
    try {
      await cartApi.updateItem(cartItemId, newQuantity);
      await fetchCart(); // Refresh cart to get updated totals
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update quantity';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setIsUpdatingCart(true);
    try {
      await cartApi.removeItem(cartItemId);
      await fetchCart(); // Refresh cart
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove item';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!cart || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate city match
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    const restaurantCity = cart.restaurant?.city;
    
    if (selectedAddress && restaurantCity) {
      // Case-insensitive comparison
      if (selectedAddress.city.toLowerCase().trim() !== restaurantCity.toLowerCase().trim()) {
        toast.error(
          `Delivery Location Mismatch\n\nThe restaurant is located in ${restaurantCity}, but your selected delivery address is in ${selectedAddress.city}. Please select a delivery address in ${restaurantCity} to proceed with your order.`,
          {
            duration: 4500,
            style: {
              maxWidth: '500px',
              whiteSpace: 'pre-line',
              lineHeight: '1.5',
            },
          }
        );
        return;
      }
    }

    setIsPlacingOrder(true);
    try {
      const response = await ordersApi.createOrder(selectedAddressId);
      console.log('Order response:', response);
      
      if (response.success) {
        toast.success('Order placed successfully!');
        // Redirect to home page after successful order
        navigate('/home');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <UtensilsCrossed className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2 text-lg">Your cart is empty</p>
          <p className="text-gray-500 mb-4 text-sm">Add items to your cart to proceed with checkout</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const deliveryFee = parseFloat(cartSummary?.delivery_fee || 50.0);
  const subtotal = parseFloat(cartSummary?.subtotal || 0);
  const total = subtotal + deliveryFee;

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
            <h1 className="text-xl font-bold text-gray-800 ml-4">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Delivery Address</h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      selectedAddressId === address.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <MapPin className={`w-5 h-5 mt-1 ${
                          selectedAddressId === address.id ? 'text-orange-500' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{address.label}</span>
                            {address.is_default && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Default
                              </span>
                            )}
                            {selectedAddressId === address.id && (
                              <Check className="w-4 h-4 text-orange-500" />
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit address"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {deleteConfirmId === address.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(address.id);
                              }}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(address.id);
                            }}
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

                {addresses.length === 0 && !showAddAddress && !editingAddressId && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No addresses saved</p>
                    <p className="text-sm">Add an address to continue</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg">
                <CreditCard className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay when you receive your order</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Note: Payment integration will be added later
              </p>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

              {/* Restaurant Info */}
              {cart?.restaurant && (
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-500 mb-1">Restaurant</p>
                  <p className="font-semibold text-gray-800">{cart.restaurant.name}</p>
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.menu_item?.image_url ? (
                        <img
                          src={item.menu_item.image_url}
                          alt={item.menu_item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <UtensilsCrossed className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">
                        {item.menu_item?.name || 'Item'}
                      </h4>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        ₹ {parseFloat(item.subtotal || (item.price * item.quantity)).toFixed(2)}
                      </p>
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          disabled={isUpdatingCart}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          disabled={isUpdatingCart}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isUpdatingCart}
                          className="ml-auto p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>₹ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t">
                  <span>Total</span>
                  <span>₹ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddressId || isPlacingOrder}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                  !selectedAddressId || isPlacingOrder
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>

              {!selectedAddressId && (
                <p className="text-sm text-red-500 mt-2 text-center">
                  Please select a delivery address
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
