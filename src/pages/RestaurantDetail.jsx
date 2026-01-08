import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Mic, 
  MapPin, 
  ChevronDown, 
  Check, 
  Star, 
  Heart,
  UtensilsCrossed,
  Phone,
  Clock,
  Navigation,
  Trash2,
  Bookmark,
  Minus,
  Plus,
  AlertTriangle,
  X,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { restaurantsApi } from '../api/restaurants';
import { cartApi } from '../api/cart';
import { reviewsApi } from '../api/reviews';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import toast from 'react-hot-toast';

// Cart Conflict Notification Component
const CartConflictNotification = ({ onClearCartAndAdd, onDismiss, itemName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 8 seconds with upward animation
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss();
      }, 500); // Wait for slide-out animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClearCart = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClearCartAndAdd();
    }, 500);
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 500);
  };

  return (
    <div
      className="fixed right-4 top-24 z-50"
      style={{
        transform: isVisible && !isExiting
          ? 'translateX(0)'
          : isExiting
          ? 'translateY(-100%)'
          : 'translateX(100%)',
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'all 0.5s ease-in-out',
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl border-l-4 border-yellow-500 overflow-hidden w-96 max-w-[calc(100vw-2rem)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold">Cart Conflict</h3>
                <p className="text-xs text-yellow-100">
                  Different restaurant items in cart
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          <p className="text-sm text-gray-700 leading-relaxed">
            Your cart has items from another restaurant. Would you like to clear your cart and add{' '}
            <span className="font-semibold text-gray-800">{itemName || 'this item'}</span>?
          </p>
        </div>

        {/* Actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition-colors"
          >
            Keep Cart
          </button>
          <button
            onClick={handleClearCart}
            className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 font-medium transition-colors flex items-center justify-center gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear & Add
          </button>
        </div>
      </div>
    </div>
  );
};

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [activeTab, setActiveTab] = useState('Menu');
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingCart, setIsSyncingCart] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState(() => {
    // Try to get from localStorage first
    const storedCity = localStorage.getItem('selectedCity');
    return storedCity || '';
  });
  const [showCartConflictModal, setShowCartConflictModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [qualifyingOrders, setQualifyingOrders] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewListRefreshTrigger, setReviewListRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchRestaurantData();
    fetchCart();
    if (user && user.role === 'customer') {
      fetchMyReview();
    }

    // Refresh cart when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCart();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh cart when window regains focus
    const handleFocus = () => {
      fetchCart();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id]);

  const fetchRestaurantData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      // Fetch restaurant details
      const restaurantResponse = await restaurantsApi.getRestaurantById(id);
      if (restaurantResponse.success) {
        const restaurantData = restaurantResponse.data.restaurant;
        setRestaurant(restaurantData);
        // Set the selected city to the restaurant's city and store in localStorage
        if (restaurantData.city) {
          setSelectedCity(restaurantData.city);
          localStorage.setItem('selectedCity', restaurantData.city);
        }
      } else {
        throw new Error('Failed to fetch restaurant data');
      }

      // Fetch menu (only on initial load, not on refresh)
      if (showLoading) {
        const menuResponse = await restaurantsApi.getRestaurantMenu(id);
        if (menuResponse.success) {
          setMenu(menuResponse.data.menu || {});
          const cats = menuResponse.data.categories || [];
          setCategories(['All Items', ...cats]);
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      if (showLoading) {
        toast.error('Failed to load restaurant details');
        navigate('/home');
      }
      // Re-throw error so caller can handle it
      throw error;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const fetchMyReview = async () => {
    setIsLoadingReview(true);
    try {
      const response = await reviewsApi.getMyReviewForRestaurant(id);
      if (response.success) {
        setMyReview(response.data.review);
        setCanReview(response.data.can_review);
        setQualifyingOrders(response.data.qualifying_orders || []);
      }
    } catch (error) {
      console.error('Error fetching my review:', error);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleReviewSuccess = async () => {
    setShowReviewForm(false);
    try {
      // Refresh restaurant data to get updated rating (without showing loading spinner)
      await fetchRestaurantData(false);
      // Refresh user's review
      await fetchMyReview();
      // Trigger ReviewList refresh to update statistics
      setReviewListRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing data after review:', error);
      // Still trigger review list refresh even if restaurant data fails
      setReviewListRefreshTrigger(prev => prev + 1);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCart();
      if (response.success && response.data && response.data.cart) {
        // Transform backend cart items to match frontend structure
        const transformedCart = response.data.cart.items.map(cartItem => ({
          id: cartItem.menu_item.id, // Use menu item id for compatibility
          cartItemId: cartItem.id, // Store cart item id for updates
          name: cartItem.menu_item.name,
          description: cartItem.menu_item.description,
          image_url: cartItem.menu_item.image_url,
          price: parseFloat(cartItem.price), // Use snapshot price from cart
          quantity: cartItem.quantity,
          is_available: cartItem.menu_item.is_available,
        }));
        setCart(transformedCart);
      } else {
        // Cart is empty
        setCart([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Don't show error toast, just silently fail
      setCart([]);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      // Check if item already exists in cart
      const existingItem = cart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Update quantity via backend API
        await cartApi.updateItem(existingItem.cartItemId, existingItem.quantity + 1);
      } else {
        // Add new item via backend API
        await cartApi.addItem(item.id, 1);
      }
      
      // Refresh cart from backend
      await fetchCart();
      toast.success(`${item.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add item to cart';
      
      // Check if error is about different restaurant
      if (errorMessage.includes('another restaurant') || errorMessage.includes('clear your cart')) {
        // Show confirmation modal instead of toast
        setPendingItem(item);
        setShowCartConflictModal(true);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleClearCartAndAdd = async () => {
    try {
      // Clear the cart
      await cartApi.clearCart();
      
      // Add the pending item
      if (pendingItem) {
        await cartApi.addItem(pendingItem.id, 1);
        await fetchCart();
        toast.success(`${pendingItem.name} added to cart`);
      }
      
      // Close modal
      setShowCartConflictModal(false);
      setPendingItem(null);
    } catch (error) {
      console.error('Error clearing cart and adding item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clear cart and add item';
      toast.error(errorMessage);
    }
  };

  const updateQuantity = async (itemId, change) => {
    try {
      const cartItem = cart.find(item => item.id === itemId);
      if (!cartItem) {
        toast.error('Item not found in cart');
        return;
      }

      const newQuantity = cartItem.quantity + change;
      
      if (newQuantity <= 0) {
        // Remove item from cart
        await cartApi.removeItem(cartItem.cartItemId);
      } else {
        // Update quantity via backend API
        await cartApi.updateItem(cartItem.cartItemId, newQuantity);
      }
      
      // Refresh cart from backend
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update quantity';
      toast.error(errorMessage);
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      setCart([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clear cart';
      toast.error(errorMessage);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Cart is already synced with backend, just navigate to checkout
    navigate('/checkout');
  };

  const getFilteredMenu = () => {
    let items = [];
    if (selectedCategory === 'All Items') {
      items = Object.values(menu).flat();
    } else {
      items = menu[selectedCategory] || [];
    }
    // Filter out unavailable items (safety measure - backend should already filter them)
    items = items.filter(item => item.is_available !== false);
    
    // Filter by search query if provided
    if (menuSearchQuery.trim().length > 0) {
      const query = menuSearchQuery.toLowerCase().trim();
      items = items.filter(item => {
        const nameMatch = item.name?.toLowerCase().includes(query);
        const descriptionMatch = item.description?.toLowerCase().includes(query);
        const categoryMatch = item.category?.toLowerCase().includes(query);
        return nameMatch || descriptionMatch || categoryMatch;
      });
    }
    
    return items;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <UtensilsCrossed className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Restaurant not found</p>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const filteredMenu = getFilteredMenu();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center gap-1">
                <UtensilsCrossed className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-gray-800">DineFlow</span>
              </div>
            </Link>


            {/* Location Selector - Show restaurant's city (read-only) */}
            <div className="flex-1 flex justify-center">
              <div className="relative hidden md:flex items-center gap-1 px-3 py-2 text-gray-700">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium">{selectedCity || restaurant?.city || 'Location'}</span>
              </div>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 hidden md:block" />
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
                    onClick={() => {
                      logout();
                      navigate('/login');
                      toast.success('Logged out successfully');
                    }}
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

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/home" className="hover:text-orange-600">Home</Link>
            <span>&gt;</span>
            <span className="text-gray-800 font-medium">{restaurant.name}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Banner */}
      <div className="relative h-64 bg-gradient-to-br from-orange-200 to-red-200">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-32 h-32 text-orange-400 opacity-50" />
          </div>
        )}
      </div>

      {/* Restaurant Info Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-800">{restaurant.name}</h1>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Heart className="w-6 h-6 text-red-500" />
                </button>
              </div>

              {/* Ratings and Status */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = parseFloat(restaurant.average_rating) || 0;
                      return (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="font-medium text-gray-700">
                    {(parseFloat(restaurant.average_rating) || 0).toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({restaurant.total_reviews || 0} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Open now</span>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{restaurant.cuisine_type || 'Fast Food'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span>25-30 mins</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.opening_time && restaurant.closing_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Today: {restaurant.opening_time} - {restaurant.closing_time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mini Map Placeholder */}
            <div className="hidden lg:block w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-t pt-4">
            {['Menu', 'Offers', 'Reviews', 'About'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${cart.length > 0 ? 'pb-24 xl:pb-6' : ''}`}>
        <div className="flex gap-6">
          {/* Left Sidebar - Menu Categories */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === category
                        ? 'bg-green-50 text-green-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{category}</span>
                    {selectedCategory === category && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Special Offer Banner */}
              <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">Special offer</p>
                    <p className="text-xs text-gray-600 mb-2">15% OFF Get 15% off on all pizzas. Limited time only!</p>
                    <button className="text-xs text-orange-600 font-medium hover:text-orange-700">
                      View Offer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Menu Content */}
          <div className="flex-1">
            {activeTab === 'Menu' && (
              <>
                {/* Menu Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search food items in this restaurant..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {menuSearchQuery && (
                      <button
                        onClick={() => setMenuSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {menuSearchQuery ? `Search Results for "${menuSearchQuery}"` : selectedCategory}
                  </h2>
                  {menuSearchQuery && filteredMenu.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {filteredMenu.length} item{filteredMenu.length !== 1 ? 's' : ''} found
                    </span>
                  )}
                </div>
                
                {filteredMenu.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg mb-1">
                      {menuSearchQuery 
                        ? `No items found matching "${menuSearchQuery}"`
                        : 'No items in this category'}
                    </p>
                    {menuSearchQuery && (
                      <button
                        onClick={() => setMenuSearchQuery('')}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMenu.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          <div className="relative">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <button className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm hover:bg-red-50">
                              <Heart className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-orange-600">
                                ₹ {parseFloat(item.price).toFixed(2)}
                              </span>
                              {item.is_available ? (
                                <button
                                  onClick={() => handleAddToCart(item)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
                                >
                                  Add to Cart
                                </button>
                              ) : (
                                <span className="text-sm text-red-500">Unavailable</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Offers' && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No offers available at the moment</p>
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="space-y-6">
                {/* User's Review Form or Status */}
                {user && user.role === 'customer' && (
                  <div>
                    {isLoadingReview ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                      </div>
                    ) : showReviewForm ? (
                      (myReview?.order_id || qualifyingOrders[0]?.id) ? (
                        <ReviewForm
                          restaurantId={id}
                          orderId={myReview?.order_id || qualifyingOrders[0]?.id}
                          existingReview={myReview}
                          onSuccess={handleReviewSuccess}
                          onCancel={() => setShowReviewForm(false)}
                        />
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                          <p className="text-red-600">Unable to load order information. Please try again.</p>
                          <button
                            onClick={() => setShowReviewForm(false)}
                            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                          >
                            Close
                          </button>
                        </div>
                      )
                    ) : myReview ? (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Your Review</h3>
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors text-sm"
                          >
                            Edit Review
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= myReview.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {myReview.review_text && (
                          <p className="text-gray-700">{myReview.review_text}</p>
                        )}
                      </div>
                    ) : canReview ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <p className="text-gray-700 mb-4">
                          You have ordered from this restaurant. Share your experience!
                        </p>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                        >
                          Write a Review
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <p className="text-gray-600">
                          Please order something from the restaurant to review it.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                <ReviewList
                  restaurantId={id}
                  hasUserReview={!!myReview}
                  refreshTrigger={reviewListRefreshTrigger}
                  onWriteReview={() => {
                    if (canReview && !myReview) {
                      setShowReviewForm(true);
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'About' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                {restaurant.description ? (
                  <p className="text-gray-600">{restaurant.description}</p>
                ) : (
                  <p className="text-gray-500">No description available</p>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Cart */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Your Cart ({cart.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Clear cart"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Save for later">
                    <Bookmark className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.cartItemId || item.id} className="flex gap-3 pb-3 border-b">
                        <img
                          src={item.image_url || ''}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm mb-1">{item.name}</h4>
                          <p className="text-sm font-bold text-gray-700">₹ {parseFloat(item.price).toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="font-bold text-lg text-gray-800">₹ {calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={isSyncingCart || cart.length === 0}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        isSyncingCart || cart.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white`}
                    >
                      {isSyncingCart ? 'Syncing Cart...' : 'Checkout'}
                    </button>
                  </div>
                </>
              )}

              {/* Special Offer Promotion */}
              <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">Special Offer</p>
                    <p className="text-xs text-gray-600">Get 15% off on all pizzas. Limited time only!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showCityDropdown || showUserDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCityDropdown(false);
            setShowUserDropdown(false);
          }}
        />
      )}

      {/* Cart Conflict Notification - Non-blocking slide-in */}
      {showCartConflictModal && (
        <CartConflictNotification
          onClearCartAndAdd={handleClearCartAndAdd}
          onDismiss={() => {
            setShowCartConflictModal(false);
            setPendingItem(null);
          }}
          itemName={pendingItem?.name}
        />
      )}

      {/* Mobile Floating Cart Button - Only visible on mobile when cart has items */}
      {cart.length > 0 && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-orange-500" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-800">₹ {calculateTotal().toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isSyncingCart || cart.length === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSyncingCart || cart.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                } text-white shadow-md`}
              >
                {isSyncingCart ? 'Syncing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
