import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  MapPin,
  Phone,
  LogOut,
  Filter,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Plus,
  Settings,
  Bell,
  X,
  Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { restaurantsApi } from '../api/restaurants';
import { ordersApi } from '../api/orders';
import { notificationsApi } from '../api/notifications';
import { initializeSocket, disconnectSocket, onNewOrder, onOrderUpdate, offNewOrder, offOrderUpdate } from '../utils/socket';
import NewOrderPopup from '../components/NewOrderPopup';
import toast from 'react-hot-toast';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders (unfiltered) for stats
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null); // Track which specific order is being updated
  const [notifications, setNotifications] = useState([]);
  const [newOrderNotifications, setNewOrderNotifications] = useState([]); // Queue of notifications to show
  const shownNotificationIdsRef = useRef(new Set()); // Use ref for immediate synchronous access
  const statusFilterRef = useRef(''); // Track current status filter for Socket.io handler
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if initial load is done
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'notifications'

  useEffect(() => {
    fetchRestaurants();
    fetchNotifications();
    
    // Initialize Socket.io connection
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);

      // Listen for new order notifications
      const handleNewOrder = (data) => {
        console.log('📦 New order received via Socket.io:', data);
        
        // Create notification object for popup
        const notification = {
          _id: `socket_${Date.now()}_${data.order_id}`, // Temporary ID for socket notifications
          type: 'new_order',
          title: 'New Order Received',
          message: data.message || `You have received a new order #${data.order_number}`,
          data: {
            order_id: data.order_id,
            order_number: data.order_number,
            restaurant_id: data.restaurant_id,
            customer_name: data.customer_name,
            total_amount: data.total_amount,
          },
          read: false,
          createdAt: new Date().toISOString(),
        };

        // Add to notification queue if not already shown
        if (!shownNotificationIdsRef.current.has(notification._id)) {
          setNewOrderNotifications(prev => {
            const existingIds = new Set(prev.map(n => n._id));
            if (!existingIds.has(notification._id)) {
              shownNotificationIdsRef.current.add(notification._id);
              return [...prev, notification];
            }
            return prev;
          });
        }

        // Refresh orders list automatically (without loading spinner)
        // Use restaurant_id from socket data or fallback to selectedRestaurant
        const restaurantId = data.restaurant_id || selectedRestaurant || (restaurants.length > 0 ? restaurants[0]?.id : null);
        
        console.log('🔄 Refreshing orders list for new order. Restaurant ID:', restaurantId, 'Selected:', selectedRestaurant);
        
        if (restaurantId) {
          // Use a small delay to ensure state is ready, then fetch
          setTimeout(() => {
            console.log('📥 Calling fetchOrders with restaurantId:', restaurantId);
            fetchOrders(false, restaurantId);
          }, 300);
        } else {
          // Fallback: try again after a short delay
          console.warn('⚠️ No restaurant ID available, will retry...');
          setTimeout(() => {
            fetchOrders(false);
          }, 500);
        }
        
        // Refresh notifications list
        fetchNotifications();
      };

      // Listen for order updates
      const handleOrderUpdate = (data) => {
        console.log('🔄 Order update received via Socket.io:', data);
        
        // Update allOrders for stats (always keep it updated)
        setAllOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === data.order_id 
              ? { ...order, status: data.status }
              : order
          )
        );
        
        // Update orders list: if status filter is active and new status doesn't match, remove the order
        setOrders(prevOrders => {
          const currentFilter = statusFilterRef.current; // Use ref to get current filter value
          const updated = prevOrders.map(order => 
            order.id === data.order_id 
              ? { ...order, status: data.status }
              : order
          );
          
          // If a status filter is active and the new status doesn't match, remove the order
          if (currentFilter && data.status !== currentFilter) {
            return updated.filter(order => order.id !== data.order_id);
          }
          
          return updated;
        });
        
        // Don't show toast here - the user already gets feedback from their own action
        // This Socket.io event is mainly for keeping UI in sync, not for notifications
      };

      // Register event listeners
      onNewOrder(handleNewOrder);
      onOrderUpdate(handleOrderUpdate);

      // Cleanup on unmount
      return () => {
        offNewOrder(handleNewOrder);
        offOrderUpdate(handleOrderUpdate);
        disconnectSocket();
      };
    }

    // Fallback: Poll for new notifications every 10 seconds if Socket.io fails
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Keep statusFilterRef in sync with statusFilter state
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  useEffect(() => {
    if (restaurants.length > 0) {
      if (!selectedRestaurant && restaurants.length === 1) {
        setSelectedRestaurant(restaurants[0].id);
      }
      if (selectedRestaurant) {
        fetchOrders();
      }
    }
  }, [selectedRestaurant, statusFilter, restaurants]);

  const fetchNotifications = async () => {
    try {
      // Fetch all notifications (both read and unread) for the notifications tab
      const response = await notificationsApi.getNotifications({ limit: 50 });
      if (response.success) {
        const allNotifications = response.data.notifications || [];
        
        // On first load, mark ALL existing notifications as shown (don't show popups for old orders)
        if (!initialLoadComplete) {
          const allNotificationIds = new Set(allNotifications.map(n => n._id));
          shownNotificationIdsRef.current = allNotificationIds; // Store in ref for immediate access
          setInitialLoadComplete(true);
          // Set all notifications for the notifications tab
          setNotifications(allNotifications);
          return; // Don't show any popups on initial load
        }
        
        // After initial load, only show popups for NEW notifications
        const unreadNotifications = allNotifications.filter(n => !n.read);
        const newOrderNotifs = unreadNotifications.filter(
          (n) => n.type === 'new_order' && !shownNotificationIdsRef.current.has(n._id)
        );
        
        // Add new notifications to the queue
        if (newOrderNotifs.length > 0) {
          setNewOrderNotifications(prev => {
            const existingIds = new Set(prev.map(n => n._id));
            const newOnes = newOrderNotifs.filter(n => !existingIds.has(n._id));
            return [...prev, ...newOnes];
          });
          
          // Mark these as shown immediately in the ref (synchronous)
          newOrderNotifs.forEach(n => {
            shownNotificationIdsRef.current.add(n._id);
          });
        }
        
        // Set all notifications for the notifications tab
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantsApi.getMyRestaurants();
      if (response.success) {
        setRestaurants(response.data.restaurants || []);
        if (response.data.restaurants && response.data.restaurants.length > 0) {
          setSelectedRestaurant(response.data.restaurants[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async (showLoading = true, restaurantId = null) => {
    // Use provided restaurantId or fallback to selectedRestaurant
    const targetRestaurantId = restaurantId || selectedRestaurant;
    
    if (!targetRestaurantId) {
      // If no restaurant selected but we have restaurants, use the first one
      if (restaurants.length > 0) {
        const firstRestaurantId = restaurants[0].id;
        if (!selectedRestaurant) {
          setSelectedRestaurant(firstRestaurantId);
        }
        // Fetch with the first restaurant ID
        setTimeout(() => {
          fetchOrders(showLoading, firstRestaurantId);
        }, 100);
        return;
      }
      console.warn('Cannot fetch orders: No restaurant selected');
      return;
    }
    
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const params = { restaurant_id: targetRestaurantId };
      if (statusFilter) {
        params.status = statusFilter;
      }
      console.log('🔄 Fetching orders for restaurant:', targetRestaurantId, params);
      
      // First, fetch ALL orders (without status filter) for stats
      const allOrdersResponse = await ordersApi.getRestaurantOrders({ restaurant_id: targetRestaurantId });
      if (allOrdersResponse.success) {
        setAllOrders(allOrdersResponse.data.orders || []);
      }
      
      // Then, fetch filtered orders for display
      const response = await ordersApi.getRestaurantOrders(params);
      if (response.success) {
        console.log('✅ Orders fetched successfully:', response.data.orders?.length || 0, 'orders');
        setOrders(response.data.orders || []);
      } else {
        console.warn('⚠️ Failed to fetch orders:', response.message);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      if (showLoading) {
        toast.error('Failed to load orders');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    // Optimistically update the order in the UI immediately
    const previousOrders = [...orders];
    const previousAllOrders = [...allOrders];
    
    // Update allOrders for stats (always keep it updated)
    setAllOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );
    
    // Update orders list: if status filter is active and new status doesn't match, remove the order
    setOrders(prevOrders => {
      const updated = prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      );
      
      // If a status filter is active and the new status doesn't match, remove the order
      if (statusFilter && newStatus !== statusFilter) {
        return updated.filter(order => order.id !== orderId);
      }
      
      return updated;
    });
    
    setUpdatingOrderId(orderId); // Track which order is being updated
    try {
      const response = await ordersApi.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast.success(`Order status updated to ${getStatusLabel(newStatus)}`);
        // Don't refetch - the optimistic update is already applied
        // The Socket.io handler will also update it when the server confirms
      } else {
        // Revert optimistic update on failure
        setOrders(previousOrders);
        setAllOrders(previousAllOrders);
        toast.error(response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // Revert optimistic update on error
      setOrders(previousOrders);
      setAllOrders(previousAllOrders);
      const message = error.response?.data?.message || 'Failed to update order status';
      toast.error(message);
    } finally {
      setUpdatingOrderId(null); // Clear updating state
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-purple-100 text-purple-800 border-purple-200',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getNextStatus = (currentStatus) => {
    const transitions = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
    };
    return transitions[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ['pending', 'confirmed', 'preparing'].includes(status);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate statistics from ALL orders (unfiltered) - these should remain constant
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    preparing: allOrders.filter(o => o.status === 'preparing').length,
    ready: allOrders.filter(o => o.status === 'ready').length,
    totalRevenue: allOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
  };

  if (isLoading && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold text-gray-800">Restaurant Dashboard</h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center bg-white rounded-lg shadow-sm p-12">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Restaurants Found</h2>
            <p className="text-gray-600 mb-6">Get started by creating your first restaurant.</p>
            <button
              onClick={() => navigate('/restaurant/create')}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Restaurant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <UtensilsCrossed className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-gray-800">Restaurant Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/restaurant/create')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Restaurant</span>
                <span className="sm:hidden">Add</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:inline">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Restaurant Selector */}
        {restaurants.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Select Restaurant</label>
              <div className="flex items-center gap-2">
                {selectedRestaurant && (
                  <>
                    <button
                      onClick={() => navigate(`/restaurant/${selectedRestaurant}/edit`)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      title="Edit Restaurant"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => navigate(`/restaurant/${selectedRestaurant}/menu`)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                      title="Manage Menu"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Manage Menu</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            <select
              value={selectedRestaurant || ''}
              onChange={(e) => setSelectedRestaurant(parseInt(e.target.value))}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.preparing}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹ {stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Orders
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('notifications');
                fetchNotifications(); // Refresh notifications when switching to tab
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors relative ${
                activeTab === 'notifications'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
            {/* Filter Section */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Filter className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => setStatusFilter('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    !statusFilter
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Orders
                </button>
                {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-bold text-gray-800">#{order.order_number}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Customer</p>
                              <p className="text-sm font-medium text-gray-800">{order.customer?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-medium text-gray-800">{order.delivery_address?.phone || order.customer?.phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500">Delivery Address</p>
                              <p className="text-sm font-medium text-gray-800">
                                {order.delivery_address?.address_line || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">{order.delivery_address?.city || ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Items</p>
                              <p className="text-sm font-medium text-gray-800">{order.item_count || 0} items</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-sm text-gray-600">Total Amount</span>
                          <span className="text-lg font-bold text-gray-800">
                            ₹ {parseFloat(order.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 md:min-w-[200px]">
                        {canUpdateStatus(order.status) && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status))}
                            disabled={updatingOrderId === order.id}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                          >
                            {updatingOrderId === order.id ? 'Updating...' : `Mark as ${getStatusLabel(getNextStatus(order.status))}`}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No orders found</p>
                <p className="text-gray-500 text-sm">
                  {statusFilter ? `No orders with status "${getStatusLabel(statusFilter)}"` : 'You don\'t have any orders yet'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No notifications</p>
                  <p className="text-gray-500 text-sm">You'll see new order notifications here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                          {notification.data?.order_id && (
                            <button
                              onClick={() => navigate(`/orders/${notification.data.order_id}`)}
                              className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                            >
                              View Order <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={async () => {
                                try {
                                  await notificationsApi.markAsRead(notification._id);
                                  setNotifications((prev) =>
                                    prev.map((n) =>
                                      n._id === notification._id ? { ...n, read: true } : n
                                    )
                                  );
                                } catch (error) {
                                  console.error('Error marking as read:', error);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* New Order Popups - Stacked from top */}
      {newOrderNotifications.map((notification, index) => (
        <div
          key={notification._id}
          style={{
            top: `${1 + index * 24}rem`, // Stack notifications with 24rem spacing (starting from 1rem)
          }}
          className="fixed right-4 z-50"
        >
          <NewOrderPopup
            notification={notification}
            onClose={() => {
              // Remove from queue and ensure it's marked as shown in ref
              setNewOrderNotifications(prev => prev.filter(n => n._id !== notification._id));
              shownNotificationIdsRef.current.add(notification._id);
            }}
            onAccept={() => {
              // Remove from queue, mark as shown in ref, and refresh
              setNewOrderNotifications(prev => prev.filter(n => n._id !== notification._id));
              shownNotificationIdsRef.current.add(notification._id);
              fetchOrders();
              fetchNotifications();
            }}
          />
        </div>
      ))}
    </div>
  );
};
export default RestaurantDashboard;

