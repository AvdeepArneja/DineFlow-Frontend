import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Mic, 
  MapPin, 
  ChevronDown, 
  User, 
  Check, 
  Star, 
  Heart,
  UtensilsCrossed,
  Pizza,
  Soup,
  Drumstick,
  Clock,
  Package,
  ArrowRight,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { restaurantsApi } from '../api/restaurants';
import { ordersApi } from '../api/orders';
import { cartApi } from '../api/cart';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [cities, setCities] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const [selectedCity, setSelectedCity] = useState(() => {
    // Try to get from localStorage first
    const storedCity = localStorage.getItem('selectedCity');
    return storedCity || '';
  });
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Fetch cities on mount and set default city
  useEffect(() => {
    fetchCities();
    fetchRecentOrders();
    fetchCart();

    // Initialize Socket.io connection for real-time notifications
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);

      // Listen for order status update notifications
      const handleOrderStatusUpdate = (data) => {
        console.log('📦 Order status update received via Socket.io:', data);
        
        // Show toast notification
        toast.success(
          data.message || `Order #${data.order_number} status updated to ${data.status}`,
          {
            duration: 5000,
            icon: '📦',
          }
        );

        // Refresh recent orders list to show updated status
        fetchRecentOrders();
      };

      // Register event listener
      socket.on('order_status_update', handleOrderStatusUpdate);

      // Cleanup on unmount
      return () => {
        socket.off('order_status_update', handleOrderStatusUpdate);
        disconnectSocket();
      };
    }

    // Auto-refresh recent orders every 15 seconds (fallback)
    const interval = setInterval(() => {
      fetchRecentOrders();
    }, 15000); // Refresh every 15 seconds

    // Auto-refresh cart every 10 seconds
    const cartInterval = setInterval(() => {
      fetchCart();
    }, 10000); // Refresh every 10 seconds

    // Refresh cart when window regains focus (user returns to tab)
    const handleFocus = () => {
      fetchCart();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      clearInterval(cartInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Set default city when cities are loaded
  useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      // Set to first available city
      setSelectedCity(cities[0]);
    }
  }, [cities]);

  // Store selected city in localStorage whenever it changes
  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('selectedCity', selectedCity);
    }
  }, [selectedCity]);

  // Search suggestions as user types
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await restaurantsApi.search(searchQuery.trim(), selectedCity);
          if (response.success) {
            const suggestions = [];
            // Add restaurant suggestions (max 5)
            const restaurantSuggestions = (response.data.restaurants || []).slice(0, 5).map(r => ({
              type: 'restaurant',
              id: r.id,
              name: r.name,
              subtitle: r.cuisine_type || r.city,
            }));
            suggestions.push(...restaurantSuggestions);
            
            // Add menu item suggestions (max 5)
            const menuItemSuggestions = (response.data.menu_items || []).slice(0, 5).map(item => ({
              type: 'menu_item',
              id: item.id,
              name: item.name,
              subtitle: item.restaurant?.name || 'Restaurant',
              restaurantId: item.restaurant_id,
            }));
            suggestions.push(...menuItemSuggestions);
            
            setSearchSuggestions(suggestions);
            // Keep suggestions dropdown open even if no results, so user can see "No results found" message
            if (searchQuery.trim().length >= 2) {
              setShowSuggestions(true);
            }
          }
        } catch (error) {
          console.error('Error fetching search suggestions:', error);
          setSearchSuggestions([]);
          // Keep dropdown open to show error state if user has typed enough
          if (searchQuery.trim().length >= 2) {
            setShowSuggestions(true);
          } else {
            setShowSuggestions(false);
          }
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, selectedCity]);

  // Refresh cart items when dropdown opens
  useEffect(() => {
    if (showCartDropdown && cartItemCount > 0) {
      setIsLoadingCart(true);
      fetchCart().finally(() => {
        setIsLoadingCart(false);
      });
    }
  }, [showCartDropdown]);

  const fetchRecentOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await ordersApi.getOrders({ limit: 5 });
      if (response.success) {
        setRecentOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't show error toast, just silently fail
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCart();
      if (response.success) {
        if (response.data.cart) {
          // Cart exists
          const cartData = response.data.cart;
          const summary = response.data.summary || {};
          setCart(cartData);
          setCartItems(cartData.items || []);
          setCartItemCount(summary.item_count || 0);
          setCartTotal(parseFloat(summary.total || 0));
        } else {
          // Cart is empty
          setCart(null);
          setCartItems([]);
          const summary = response.data.summary || {};
          setCartItemCount(summary.item_count || 0);
          setCartTotal(parseFloat(summary.total || 0));
        }
      } else {
        // Error response
        setCart(null);
        setCartItems([]);
        setCartItemCount(0);
        setCartTotal(0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Don't show error toast, just silently fail
      setCart(null);
      setCartItems([]);
      setCartItemCount(0);
      setCartTotal(0);
    }
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
      await fetchCart();
      toast.success('Cart updated');
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
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove item';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingCart(false);
    }
  };

  // Fetch restaurants when city or category changes
  useEffect(() => {
    fetchRestaurants();
  }, [selectedCity, selectedCategory]);

  const fetchCities = async () => {
    try {
      const response = await restaurantsApi.getCities();
      if (response.success) {
        setCities(response.data.cities || []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchRestaurants = async () => {
    // Don't fetch if no city is selected yet
    if (!selectedCity) {
      console.log('No city selected, skipping restaurant fetch');
      return;
    }
    
    setIsLoading(true);
    try {
      const params = {};
      // Add city filter if city is selected
      if (selectedCity) {
        params.city = selectedCity;
      }
      // Add cuisine filter if category is not Popular
      if (selectedCategory && selectedCategory !== 'Popular') {
        params.cuisine_type = selectedCategory;
      }
      
      console.log('Fetching restaurants with params:', params);
      const response = await restaurantsApi.getRestaurants(params);
      console.log('Restaurants response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Handle different response structures
      if (response && response.success) {
        // Check if data exists
        if (response.data) {
          const restaurantsData = response.data.restaurants || [];
          console.log('Restaurants data:', restaurantsData);
          console.log('Number of restaurants:', restaurantsData.length);
          
          // Convert Sequelize instances to plain objects if needed
          const plainRestaurants = restaurantsData.map(restaurant => {
            if (restaurant && typeof restaurant.toJSON === 'function') {
              return restaurant.toJSON();
            }
            return restaurant;
          });
          
          setRestaurants(plainRestaurants);
          
          if (plainRestaurants.length === 0) {
            // Don't show error for empty results, just info
            console.log(`No restaurants found${selectedCity ? ` in ${selectedCity}` : ''}`);
          } else {
            console.log(`Successfully loaded ${plainRestaurants.length} restaurants`);
          }
        } else {
          console.error('Response data is missing:', response);
          setRestaurants([]);
          toast.error('Invalid response from server');
        }
      } else {
        console.error('Response success is false:', response);
        setRestaurants([]);
        const errorMsg = response?.message || 'Failed to load restaurants';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Failed to load restaurants';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        // Something else happened
        errorMessage = error.message || 'Failed to load restaurants';
      }
      
      toast.error(errorMessage);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'Popular', label: 'Popular', icon: Star },
    { id: 'Pizza', label: 'Pizza', icon: Pizza },
    { id: 'Asian', label: 'Asian', icon: Soup },
    { id: 'Chicken', label: 'Chicken', icon: Drumstick },
  ];

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <div className="flex items-center gap-1 sm:gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/home')}>
              <div className="flex items-center gap-1">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span className="text-lg sm:text-2xl font-bold text-gray-800">DineFlow</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:flex">
              <div className="relative w-full">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    setShowSuggestions(false);
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }} className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search restaurants, dishes..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (searchSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Mic className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-green-600" />
                </form>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto search-dropdown-enter">
                    {isSearching ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Searching...</p>
                      </div>
                    ) : searchSuggestions.length > 0 ? (
                      <>
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.type}-${suggestion.id}-${index}`}
                            onClick={() => {
                              if (suggestion.type === 'restaurant') {
                                navigate(`/restaurant/${suggestion.id}`);
                              } else {
                                navigate(`/restaurant/${suggestion.restaurantId}`);
                              }
                              setShowSuggestions(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-0 transition-colors duration-150"
                          >
                            {suggestion.type === 'restaurant' ? (
                              <UtensilsCrossed className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            ) : (
                              <Package className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{suggestion.name}</p>
                              <p className="text-sm text-gray-500 truncate">{suggestion.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </button>
                        ))}
                        <div className="px-4 py-2 border-t bg-gray-50">
                          <button
                            onClick={() => {
                              if (searchQuery.trim()) {
                                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                setShowSuggestions(false);
                              }
                            }}
                            className="w-full text-left text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2 transition-colors duration-150"
                          >
                            <Search className="w-4 h-4" />
                            View all results for "{searchQuery}"
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center animate-fadeIn">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">No results found</p>
                        <p className="text-xs text-gray-500 mb-4">Try searching with different keywords</p>
                        <button
                          onClick={() => {
                            if (searchQuery.trim()) {
                              navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                              setShowSuggestions(false);
                            }
                          }}
                          className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors duration-200"
                        >
                          View all results anyway
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">{selectedCity || 'Select City'}</span>
                <span className="font-medium text-xs sm:hidden">{selectedCity ? selectedCity.substring(0, 8) + '...' : 'City'}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              </button>
              
              {showCityDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Icon with Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  if (cartItemCount > 0) {
                    setShowCartDropdown(!showCartDropdown);
                  } else {
                    navigate('/checkout');
                  }
                }}
                className="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </div>
                {cartItemCount > 0 && (
                  <span className="hidden md:inline font-medium text-sm">₹ {parseFloat(cartTotal).toFixed(2)}</span>
                )}
              </button>

              {/* Cart Dropdown */}
              {showCartDropdown && cartItemCount > 0 && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[calc(100vh-6rem)] sm:max-h-[600px] flex flex-col">
                  {/* Header */}
                  <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">Your Cart</h3>
                    <button
                      onClick={() => setShowCartDropdown(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
                    {isLoadingCart ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading cart...</p>
                      </div>
                    ) : cartItems && Array.isArray(cartItems) && cartItems.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-2 sm:gap-3 pb-2 sm:pb-3 border-b last:border-0">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.menu_item?.image_url ? (
                                <img
                                  src={item.menu_item.image_url}
                                  alt={item.menu_item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center" style={{ display: item.menu_item?.image_url ? 'none' : 'flex' }}>
                                <UtensilsCrossed className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                                {item.menu_item?.name || 'Item'}
                              </h4>
                              <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-0.5 sm:mt-1">
                                ₹ {parseFloat(item.price || 0).toFixed(2)}
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, -1)}
                                  disabled={isUpdatingCart}
                                  className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                  <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                                <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, 1)}
                                  disabled={isUpdatingCart}
                                  className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={isUpdatingCart}
                                  className="ml-auto p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm">Your cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Footer with Total and Checkout */}
                  {cartItems.length > 0 && (
                    <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="font-semibold text-sm sm:text-base text-gray-800">Total</span>
                        <span className="font-bold text-base sm:text-lg text-gray-800">
                          ₹ {parseFloat(cartTotal).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCartDropdown(false);
                          navigate('/checkout');
                        }}
                        className="w-full py-2 sm:py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors text-sm sm:text-base"
                      >
                        Go to Checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1 sm:gap-2"
              >
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-xs sm:text-base">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Check className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 text-white" />
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 hidden sm:block" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Welcome, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-lg text-gray-600">What would you like to order today?</p>
            </div>
            <div className="hidden md:block">
              <div className="w-64 h-48 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-blue-200">
                  <UtensilsCrossed className="w-24 h-24 mx-auto opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                  }}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-300' : 'text-gray-500'}`} />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Restaurants Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Restaurants Near You</h2>
            {restaurants.length > 8 && !showAllRestaurants && (
              <button 
                onClick={() => setShowAllRestaurants(true)}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                View All
                <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-xs font-semibold">
                  {restaurants.length - 8}
                </span>
              </button>
            )}
            {showAllRestaurants && restaurants.length > 8 && (
              <button 
                onClick={() => setShowAllRestaurants(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                Show Less
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(showAllRestaurants ? restaurants : restaurants.slice(0, 8)).map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="relative">
                    {restaurant.image_url ? (
                      <img 
                        src={restaurant.image_url} 
                        alt={restaurant.name}
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-40 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center ${restaurant.image_url ? 'hidden' : ''}`}
                    >
                      <UtensilsCrossed className="w-16 h-16 text-orange-400 opacity-50" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle favorite
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{restaurant.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Open now</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = parseFloat(restaurant.average_rating) || 0;
                          return (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {(parseFloat(restaurant.average_rating) || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {restaurant.estimated_delivery_time || '25-30'} mins
                    </p>
                    <p className="text-sm text-gray-600">
                      {restaurant.cuisine_type || restaurant.description || 'Fast Food'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found in {selectedCity}</p>
            </div>
          )}
        </div>

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Recent Orders</h2>
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentOrders.slice(0, 3).map((order) => {
                const getStatusColor = (status) => {
                  const colors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    confirmed: 'bg-blue-100 text-blue-800',
                    preparing: 'bg-orange-100 text-orange-800',
                    ready: 'bg-purple-100 text-purple-800',
                    out_for_delivery: 'bg-indigo-100 text-indigo-800',
                    delivered: 'bg-green-100 text-green-800',
                    cancelled: 'bg-red-100 text-red-800',
                  };
                  return colors[status] || 'bg-gray-100 text-gray-800';
                };

                const getStatusLabel = (status) => {
                  const labels = {
                    pending: 'Pending',
                    confirmed: 'Confirmed',
                    preparing: 'Preparing',
                    ready: 'Ready',
                    out_for_delivery: 'Out for Delivery',
                    delivered: 'Delivered',
                    cancelled: 'Cancelled',
                  };
                  return labels[status] || status;
                };

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">#{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">{order.restaurant?.name || 'Restaurant'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Package className="w-3 h-3" />
                        <span>{order.item_count || 0} items</span>
                      </div>
                      <p className="font-bold text-gray-800">₹ {parseFloat(order.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-16 h-16 text-blue-600 opacity-50" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  Get 20% Off Your First Order!
                </h3>
                <p className="text-gray-600">Order now and enjoy delicious food delivered to your door</p>
              </div>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-lg">
              Order Now
            </button>
          </div>
        </div>
      </main>

      {/* Click outside to close dropdowns */}
      {(showCityDropdown || showUserDropdown || showCartDropdown || showSuggestions) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCityDropdown(false);
            setShowUserDropdown(false);
            setShowCartDropdown(false);
            setShowSuggestions(false);
          }}
        />
      )}
    </div>
  );
};

export default Home;
