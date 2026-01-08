import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  UtensilsCrossed,
  Star,
  Check,
  MapPin,
  Clock,
  Package,
} from 'lucide-react';
import { restaurantsApi } from '../api/restaurants';
import toast from 'react-hot-toast';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(() => {
    // Get selected city from localStorage
    return localStorage.getItem('selectedCity') || '';
  });

  // Sync searchQuery with URL query parameter when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Real-time search as user types (debounced)
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        // Perform search directly as user types
        performSearch(searchQuery.trim());
        // Update URL in background to keep it in sync (without triggering navigation)
        if (searchQuery.trim() !== query) {
          window.history.replaceState({}, '', `/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
      } else if (searchQuery.trim().length === 0) {
        // If user cleared the search, clear results
        setIsLoading(false);
        setRestaurants([]);
        setMenuItems([]);
        if (query) {
          window.history.replaceState({}, '', '/search');
        }
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Perform search when query from URL changes (for initial load or direct URL access)
  useEffect(() => {
    if (query && query.trim().length > 0) {
      // Only search if this is from URL change and searchQuery hasn't been set yet
      if (query === searchQuery || searchQuery.trim().length === 0) {
        performSearch(query);
      }
    } else if (!query && searchQuery.trim().length < 2) {
      // If no query, set loading to false to show empty state
      setIsLoading(false);
      setRestaurants([]);
      setMenuItems([]);
    }
  }, [query]);

  // Re-search when city changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery.trim());
    }
  }, [selectedCity]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setRestaurants([]);
      setMenuItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Pass selected city to filter search results
      const response = await restaurantsApi.search(searchTerm, selectedCity);
      console.log('Search response:', response);
      if (response.success) {
        setRestaurants(response.data.restaurants || []);
        setMenuItems(response.data.menu_items || []);
      } else {
        console.error('Search failed:', response.message);
        toast.error(response.message || 'Search failed');
        setRestaurants([]);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to perform search';
      toast.error(errorMessage);
      setRestaurants([]);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL which will trigger useEffect to perform search
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If search is empty, navigate to search page without query
      navigate('/search');
    }
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  const handleMenuItemClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-orange-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants, dishes..."
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchQuery(newValue);
                    // Show loading state immediately when user types (will be debounced)
                    if (newValue.trim().length >= 2) {
                      setIsLoading(true);
                    } else if (newValue.trim().length === 0) {
                      setIsLoading(false);
                      setRestaurants([]);
                      setMenuItems([]);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : (
          <>
            {(query || searchQuery.trim().length >= 2) && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Search Results for "{query || searchQuery}"
                </h2>
                {selectedCity && (
                  <p className="text-sm text-gray-500 mb-1">
                    Showing results in {selectedCity}
                  </p>
                )}
                {!isLoading && (
                  <p className="text-gray-600">
                    Found {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} and {menuItems.length} dish{menuItems.length !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Restaurants Results */}
            {restaurants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Restaurants</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {restaurants.map((restaurant) => (
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
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{restaurant.name}</h3>
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
              </div>
            )}

            {/* Menu Items Results */}
            {menuItems.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Dishes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.restaurant_id)}
                      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center" style={{ display: item.image_url ? 'none' : 'flex' }}>
                            <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 mb-1 truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500 mb-2 truncate">
                            {item.restaurant?.name || 'Restaurant'}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-sm font-bold text-orange-600">
                            ₹ {parseFloat(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && restaurants.length === 0 && menuItems.length === 0 && (query || searchQuery.trim().length >= 2) && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any restaurants or dishes matching "{query || searchQuery}"
                  {selectedCity && ` in ${selectedCity}`}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/home')}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors duration-200"
                  >
                    Browse All Restaurants
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      navigate('/search');
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors duration-200"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

            {/* Empty State - No Query */}
            {!query && searchQuery.trim().length < 2 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Start Searching</h3>
                <p className="text-gray-600">
                  Enter a search term to find restaurants and dishes
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
